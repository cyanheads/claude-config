/**
 * self-compact/hooks/register.ts — lets the main thread compact itself at a pause it picks.
 *
 * The model calls `mcp__self-compact__compact` as its turn's last tool call. Once that turn ends,
 * the mod runs the compaction `/compact` runs (`$.session.compact`), then submits the model's
 * resume line as the next prompt; with no resume line, the session waits for the user. A turn that starts before the compaction can (a queued
 * notification, a typed prompt) pushes it to that turn's end; an interrupted turn cancels it.
 */
import type { EngineInterface, Register } from 'claude-code'

const TOOL = 'compact'

/** Treats the compact-prep snapshot as notes to reconcile against the conversation, not a summary to copy. */
const DEFAULT_INSTRUCTIONS =
  "Treat the Compaction Snapshot as the session's own notes: let it guide the summary, not stand in for it. " +
  'Keep what the conversation shows matters even where the snapshot left it out. Check the snapshot against ' +
  'the conversation; where a path, status, or decision in it is wrong or stale, go with the conversation and ' +
  'name the mismatch in the summary. Keep file paths and identifiers exact.'

/** Turn ends a scheduled compaction may wait through before it is dropped. */
const MAX_ATTEMPTS = 3

type Job = { instructions: string; resume?: string; attempts: number }

/** The compaction the model asked for, until it runs, is cancelled, or gives up. */
let pending: Job | undefined

function finish($: EngineInterface, notice?: string) {
  pending = undefined
  $.ui.status(undefined)
  if (notice) $.ui.toast(`self-compact: ${notice}`)
}

async function compact($: EngineInterface, job: Job) {
  job.attempts += 1
  $.ui.status('self-compact: compacting')
  try {
    const out = await $.session.compact({ instructions: job.instructions })
    if (out.skip !== undefined) return finish($, `skipped (${out.skip})`)
    finish($)
    if (job.resume) await $.prompt.submit({ text: job.resume })
  } catch (error) {
    $.ui.log(`compaction attempt ${job.attempts} refused: ${String(error)}`, { to: 'debug' })
    if (job.attempts >= MAX_ATTEMPTS) return finish($, `gave up after ${job.attempts} tries (${String(error)})`)
    $.ui.status('self-compact: waiting for the turn to end')
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: TOOL,
      description:
        'Compacts this conversation once the current turn ends, then submits `resume` as the next prompt; ' +
        'without `resume`, the session waits for the user. Call it as the last tool call of a turn, then end ' +
        'the turn. Main thread only: a sub-agent cannot compact.',
      inputSchema: {
        type: 'object',
        properties: {
          resume: {
            type: 'string',
            description:
              'The prompt to continue with after the compaction: the concrete first step, in a line or two. ' +
              'Omit it when the user said not to continue after compacting.',
          },
          instructions: {
            type: 'string',
            description:
              'What the summary should keep or stress. Defaults to reconciling the Compaction Snapshot against the conversation.',
          },
        },
      },
    })
    return next(e)
  })

  on('tool.call', { tool: 'mcp__self-compact__compact' }, ($, e) => {
    if (e.agentId) return { deny: 'A sub-agent cannot compact. Finish, or hand back a report with a punch list.' }
    const args = e as { resume?: unknown; instructions?: unknown }
    const resume = typeof args.resume === 'string' ? args.resume.trim() : ''
    const instructions = typeof args.instructions === 'string' ? args.instructions.trim() : ''
    pending = { instructions: instructions || DEFAULT_INSTRUCTIONS, resume: resume || undefined, attempts: 0 }
    $.ui.status('self-compact: compacting after this turn')
    const after = resume ? 'the resume line follows as the next prompt' : 'the session then waits for the user'
    return {
      result: `Compaction scheduled: it runs once this turn ends, and ${after}. End the turn now, with no further tool calls.`,
    }
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const job = pending
    if (e.agentId || !job) return done
    if (e.reason !== 'answer') {
      finish($, 'cancelled: the turn ended without an answer')
      return done
    }
    // Compaction is refused while a turn runs, and this hook still holds the one that just ended.
    $.clock.after(0, () => void compact($, job))
    return done
  })
}
