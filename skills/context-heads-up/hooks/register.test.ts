/**
 * context-heads-up/hooks/register.test.ts — one note per band crossing, delivered between tool batches
 * and on the next prompt, re-armed by a drop, with bands scaled to the model's context window.
 */
import type { Engine } from 'claude-code/testing'
import type { On, SessionMessage } from 'claude-code'
import { describe, expect, test } from 'claude-code/testing'

const summary: SessionMessage = { role: 'user', text: 'summary', toolUses: [] }

/** Stands in for the engine beneath the mod: a model whose window is `window` and whose next response reports `tokens`. */
function engine(on: On, window = 1_000_000, beneath: string[] = []) {
  let tokens: number | null = null
  on('session.usage', () => ({ value: { startedAt: 0, context: { window }, rateLimits: [] } }))
  on('turn.step', async function* (_$, e) {
    const usage =
      tokens === null
        ? null
        : { model: 'm', input_tokens: 1, cache_read_input_tokens: tokens - 1_001, cache_creation_input_tokens: 0, output_tokens: 1_000 }
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: usage ? 'tool_use' : null, usage }
  })
  on('session.compact', () => ({ messages: [summary] }))
  on('classic.PostToolBatch', () => (beneath.length ? { additionalContext: beneath } : {}))
  on('classic.UserPromptSubmit', () => ({}))

  /** One model response in the thread (a sub-agent's when `agentId` is given); null is a response with no usage. */
  const respond = async ($: Engine, reading: number | null, agentId?: string) => {
    tokens = reading
    for await (const _ of $.turn.step({ turnId: 't', index: 0, model: 'm', messageCount: 1, agentId })) void _
  }
  /** The notes a tool batch in the thread delivers. */
  const batch = async ($: Engine, agentId?: string) =>
    (await $.classic.PostToolBatch({ tool_calls: [], agent_id: agentId })).additionalContext ?? []
  /** The notes the next prompt delivers. */
  const prompt = async ($: Engine) =>
    (await $.classic.UserPromptSubmit({ prompt: 'next' })).additionalContext ?? []
  return { respond, batch, prompt }
}

describe('main thread', () => {
  test('sends no note below the first band', async ($, on) => {
    const { respond, batch } = engine(on)
    await respond($, 499_000)
    expect(await batch($)).toEqual([])
  })

  test('notes each band once, between batches or on the next prompt', async ($, on) => {
    const { respond, batch, prompt } = engine(on)
    await respond($, 520_000)
    const [headsUp] = await batch($)
    expect(headsUp).toStartWith('Context heads-up: this thread is at 520k tokens.')
    expect(headsUp).toContain("tell the user it's time to /compact")
    await respond($, 530_000)
    expect(await prompt($)).toEqual([])
    await respond($, 551_000)
    const overdue = await prompt($)
    expect(overdue).toEqual([expect.stringMatching(/^Context overdue: this thread is at 551k tokens\./)])
    expect(overdue[0]).toContain('never past 600k')
    expect(await batch($)).toEqual([])
  })

  test('a jump past both bands sends only the higher note', async ($, on) => {
    const { respond, batch } = engine(on)
    await respond($, 560_000)
    expect(await batch($)).toEqual([expect.stringMatching(/^Context overdue:/)])
    expect(await batch($)).toEqual([])
  })

  test('holds through a compaction and re-arms once the figure drops below', async ($, on) => {
    const { respond, batch } = engine(on)
    await respond($, 520_000)
    expect(await batch($)).toEqual([expect.stringMatching(/^Context heads-up:/)])
    await $.session.compact({ trigger: 'plugin', messages: [summary] })
    expect(await batch($)).toEqual([])
    await respond($, 150_000)
    expect(await batch($)).toEqual([])
    await respond($, 505_000)
    expect(await batch($)).toEqual([expect.stringMatching(/^Context heads-up: this thread is at 505k tokens\./)])
  })

  test('a response with no usage (an API error) changes nothing', async ($, on) => {
    const { respond, batch } = engine(on)
    await respond($, 520_000)
    expect((await batch($)).length).toBe(1)
    await respond($, null)
    expect(await batch($)).toEqual([])
    await respond($, 521_000)
    expect(await batch($)).toEqual([])
  })
})

describe('sub-agents', () => {
  test('read their own figure, get the sub-agent notes, and keep their own bands', async ($, on) => {
    const { respond, batch } = engine(on)
    await respond($, 520_000)
    await respond($, 100_000, 'a1')
    expect(await batch($, 'a1')).toEqual([])
    await respond($, 510_000, 'a1')
    const [note] = await batch($, 'a1')
    expect(note).toStartWith("Context heads-up: you're a sub-agent at 510k tokens")
    expect(note).not.toContain('compact-prep')
    expect(await batch($, 'a1')).toEqual([])
    await respond($, 552_000, 'a1')
    expect(await batch($, 'a1')).toEqual([expect.stringMatching(/^Context overdue: you're a sub-agent at 552k tokens/)])
    expect(await batch($)).toEqual([expect.stringMatching(/^Context heads-up: this thread is at 520k tokens\./)])
  })

  test("a sub-agent's batch before its first response sends nothing", async ($, on) => {
    const { respond, batch } = engine(on)
    await respond($, 520_000)
    expect(await batch($, 'a-new')).toEqual([])
  })
})

describe('window scaling', () => {
  test('bands are shares of the model window', async ($, on) => {
    const { respond, batch } = engine(on, 200_000)
    await respond($, 99_000)
    expect(await batch($)).toEqual([])
    await respond($, 101_000)
    expect(await batch($)).toEqual([expect.stringMatching(/^Context heads-up: this thread is at 101k tokens\./)])
    await respond($, 111_000)
    const [overdue] = await batch($)
    expect(overdue).toStartWith('Context overdue: this thread is at 111k tokens.')
    expect(overdue).toContain('never past 120k')
  })

  test(
    'the shares come from the options',
    { options: { headsUpPercent: 70, overduePercent: 80, ceilingPercent: 90 } },
    async ($, on) => {
      const { respond, batch } = engine(on)
      await respond($, 650_000)
      expect(await batch($)).toEqual([])
      await respond($, 810_000)
      const [overdue] = await batch($)
      expect(overdue).toStartWith('Context overdue: this thread is at 810k tokens.')
      expect(overdue).toContain('never past 900k')
    },
  )
})

test('keeps what other hooks added to the additional context', async ($, on) => {
  const { respond } = engine(on, 1_000_000, ['from beneath'])
  await respond($, 520_000)
  const { additionalContext } = await $.classic.PostToolBatch({ tool_calls: [] })
  expect(additionalContext).toEqual(['from beneath', expect.stringMatching(/^Context heads-up:/)])
})
