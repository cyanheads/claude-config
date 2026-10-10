/**
 * context-heads-up/hooks/register.ts — tells a thread when its context passes set shares of the
 * model's window, once per band.
 *
 * Each model response (`turn.step`) records its thread's context: input + cache reads + cache
 * writes + output. Between tool batches (`classic.PostToolBatch`) and on the next prompt
 * (`classic.UserPromptSubmit`), a thread past a band it hasn't been told about gets one note as
 * additional context: the main thread to compact at a natural pause, a sub-agent (which can't
 * compact) to wrap up and hand back a punch list. A band re-arms once the figure drops back below
 * it, as it does after a compaction.
 */
import { update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { ContextHeadsUpBand, ContextHeadsUpThread } from '../types'

const MAIN = 'main'

type Shares = { headsUp: number; overdue: number; ceiling: number }

type Note = (k: number, ceilingK: number) => string

const howToCompact =
  `At the pause: run the compact-prep skill if this session has it, put anything its snapshot holds that ` +
  `isn't on disk yet into the run's state file if it keeps one, then call the \`mcp__self-compact__compact\` ` +
  `tool as your last call (load it with ToolSearch \`select:mcp__self-compact__compact\` if it's deferred), ` +
  `with \`resume\` set to what to do first once compacted, and end the turn. The compaction runs once the ` +
  `turn ends, and \`resume\` follows as the next prompt. If this session has no such tool, tell the user ` +
  `it's time to /compact.`

const MAIN_NOTES: Record<ContextHeadsUpBand, Note> = {
  'heads-up': k =>
    `Context heads-up: this thread is at ${k}k tokens. Start looking for a natural pause to compact: sub-agents ` +
    `in flight with nothing waiting on you, a phase just closed, a result just handed back. It's a cue, not a ` +
    `cap — finish the unit you're in rather than compacting mid-edit, but don't push past a good pause to see ` +
    `how far it goes. ${howToCompact}`,
  overdue: (k, ceilingK) =>
    `Context overdue: this thread is at ${k}k tokens. If what you're on is a few steps from done, finish it ` +
    `first; compacting that close to the end costs more than it saves. Otherwise compact at the next pause. ` +
    `Either way, compact before starting anything new, and never past ${ceilingK}k. ${howToCompact}`,
}

const SUB_AGENT_NOTES: Record<ContextHeadsUpBand, Note> = {
  'heads-up': k =>
    `Context heads-up: you're a sub-agent at ${k}k tokens, and a sub-agent can't compact. Finish what you're ` +
    `on, plus anything small that closes out the task, but don't start a new large piece of work. If the task ` +
    `still needs one, stop at a clean point, leave the files you touched coherent, and hand back your report: ` +
    `open it by saying you stopped at your context heads-up, and include a punch list of what's done and ` +
    `what's left, precise enough for a fresh agent to pick up.`,
  overdue: k =>
    `Context overdue: you're a sub-agent at ${k}k tokens. If the task is a few steps from done, finish it and ` +
    `hand back as normal; a fresh agent would cost more than those steps. Otherwise stop now, without starting ` +
    `another step: finish or revert the edit in progress, then hand back your report, opening with the fact ` +
    `that you stopped at your context limit, with a punch list of what's done and what's left for a fresh agent.`,
}

/** One member per thread: `{ ...threads, id }`. */
const threads = { plugin: 'context-heads-up', key: 'threads' } as const

const blank = (): ContextHeadsUpThread => ({ tokens: null, noted: [] })

const record = ($: EngineInterface, id: string, tokens: number | null) =>
  update($, { ...threads, id }, t => ({ ...(t ?? blank()), tokens }))

/**
 * The thread after its latest reading is checked against the bands (token thresholds, lowest
 * first), and the highest band it newly crossed: bands it fell below are forgotten, and a thread
 * with no reading is left as it is.
 */
function check(t: ContextHeadsUpThread, bands: readonly (readonly [ContextHeadsUpBand, number])[]) {
  const { tokens } = t
  let crossed: ContextHeadsUpBand | undefined
  if (tokens === null) return { next: t, crossed }
  const noted = new Set(t.noted)
  for (const [band, threshold] of bands) {
    if (tokens < threshold) noted.delete(band)
    else if (!noted.has(band)) {
      noted.add(band)
      crossed = band
    }
  }
  return { next: { tokens, noted: [...noted] }, crossed }
}

/** Adds the thread's band note, if it newly crossed one, to a classic event's additional context. */
async function withNote<R extends { additionalContext?: string[] }>(
  $: EngineInterface,
  id: string,
  shares: Shares,
  out: R,
): Promise<R> {
  const { window } = (await $.session.usage()).context
  const bands = [
    ['heads-up', shares.headsUp * window],
    ['overdue', shares.overdue * window],
  ] as const
  let verdict = check(blank(), bands)
  await update($, { ...threads, id }, t => (verdict = check(t ?? blank(), bands)).next)
  const { crossed, next: { tokens } } = verdict
  if (!crossed || tokens === null) return out
  const note = (id === MAIN ? MAIN_NOTES : SUB_AGENT_NOTES)[crossed](
    Math.round(tokens / 1000),
    Math.round((shares.ceiling * window) / 1000),
  )
  return { ...out, additionalContext: [...(out.additionalContext ?? []), note] }
}

export const register: Register = (on, options) => {
  const shares: Shares = {
    headsUp: Number(options.headsUpPercent) / 100,
    overdue: Number(options.overduePercent) / 100,
    ceiling: Number(options.ceilingPercent) / 100,
  }

  on('turn.step', async function* ($, e, next) {
    const step = yield* next(e)
    const u = step.usage
    if (u) {
      const tokens = u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens + u.output_tokens
      await record($, e.agentId ?? MAIN, tokens)
    }
    return step
  })

  // Until the first response after a compaction, the last reading is still the pre-compaction figure.
  on('session.compact', async ($, e, next) => {
    const out = await next(e)
    if (e.trigger !== 'precompute' && out.skip === undefined) await record($, e.agentId ?? MAIN, null)
    return out
  })

  // PostToolBatch reaches a long turn between tool batches; UserPromptSubmit covers a crossing on a turn's last response.
  on('classic.PostToolBatch', async ($, e, next) => withNote($, e.agent_id ?? MAIN, shares, await next(e)))
  on('classic.UserPromptSubmit', async ($, e, next) => withNote($, e.agent_id ?? MAIN, shares, await next(e)))
}
