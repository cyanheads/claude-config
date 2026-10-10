/**
 * self-compact/hooks/register.test.ts — the compaction runs after the turn that asked for it, then the resume line.
 */
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const TOOL = 'mcp__self-compact__compact'

/** Stands in for the engine beneath the mod: records compactions and prompts, fails the first `failures` compactions. */
function engine(on: On, failures = 0) {
  const clock = mock.clock(on)
  const compacted: (string | undefined)[] = []
  const submitted: string[] = []
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  on('tool.register', (_$, e) => ({ value: { tool: `mcp__self-compact__${e.name}` } }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  // A throw here leaves the chain to a bottom that rejects, as core rejects a compaction during a turn.
  on('session.compact', (_$, e) => {
    if (failures-- > 0) throw new Error('a turn is running')
    compacted.push(e.instructions)
    return { messages: [{ role: 'user', text: 'summary', toolUses: [] }] }
  })
  on('prompt.submit', (_$, e) => {
    submitted.push(e.text)
    return { text: e.text }
  })
  return { clock, compacted, submitted }
}

const start = ($: Engine) => $.session.start({ cwd: '/tmp', surface: null, isInteractive: true })
const turnEnds = ($: Engine, reason: 'answer' | 'aborted' = 'answer', agentId?: string) =>
  $.turn.complete({ answer: '', durationMs: 1, isAborted: reason === 'aborted', turnId: 't', reason, agentId })

test('compacts once the turn ends, then submits the resume line', async ($, on) => {
  const { clock, compacted, submitted } = engine(on)
  await start($)
  await $.tool.call({ tool: TOOL, resume: 'carry on with step 4' })
  expect(compacted).toEqual([])
  await turnEnds($)
  await clock.settle()
  expect(compacted).toEqual([expect.stringContaining('Compaction Snapshot')])
  expect(submitted).toEqual(['carry on with step 4'])
})

test('without a resume line, compacts and submits nothing', async ($, on) => {
  const { clock, compacted, submitted } = engine(on)
  await start($)
  const call = await $.tool.call({ tool: TOOL })
  expect(call.deny).toBeUndefined()
  await turnEnds($)
  await clock.settle()
  expect(compacted.length).toBe(1)
  expect(submitted).toEqual([])
})

test('passes the given instructions through', async ($, on) => {
  const { clock, compacted } = engine(on)
  await start($)
  await $.tool.call({ tool: TOOL, resume: 'go', instructions: 'keep the plan' })
  await turnEnds($)
  await clock.settle()
  expect(compacted).toEqual(['keep the plan'])
})

test('a refused compaction waits for the next turn to end', async ($, on) => {
  const { clock, compacted, submitted } = engine(on, 1)
  await start($)
  await $.tool.call({ tool: TOOL, resume: 'go' })
  await turnEnds($)
  await clock.settle()
  expect(compacted).toEqual([])
  await turnEnds($)
  await clock.settle()
  expect(compacted.length).toBe(1)
  expect(submitted).toEqual(['go'])
})

test('an interrupted turn cancels it', async ($, on) => {
  const { clock, compacted } = engine(on)
  await start($)
  await $.tool.call({ tool: TOOL, resume: 'go' })
  await turnEnds($, 'aborted')
  await turnEnds($)
  await clock.settle()
  expect(compacted).toEqual([])
})

test('a sub-agent is refused, and its turns never compact', async ($, on) => {
  const { clock, compacted } = engine(on)
  await start($)
  const call = await $.tool.call({ tool: TOOL, resume: 'go', agentId: 'a1' })
  expect(call.isError ?? call.deny !== undefined).toBe(true)
  await turnEnds($, 'answer', 'a1')
  await turnEnds($)
  await clock.settle()
  expect(compacted).toEqual([])
})
