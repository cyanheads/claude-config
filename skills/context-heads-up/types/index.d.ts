/** The bands a thread can be noted for: the heads-up, then overdue. */
export type ContextHeadsUpBand = 'heads-up' | 'overdue'

/**
 * One thread's context reading and the bands already announced to it.
 *
 * `tokens` is the last model response's input + cache reads + cache writes + output, or null
 * after a compaction until the next response reports a figure.
 */
export type ContextHeadsUpThread = {
  tokens: number | null
  noted: ContextHeadsUpBand[]
}

declare module 'claude-code' {
  interface PluginState {
    'context-heads-up': {
      /** Keyed by the sub-agent's id, or `main` for the main thread. */
      threads: StateFamily<ContextHeadsUpThread>
    }
  }
}
