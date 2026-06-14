# claude-config

My [Claude Code](https://github.com/anthropics/claude-code) setup — settings, system prompt, and skills — installable on any machine with one command. **No GitHub authentication required.**

```sh
sh -c "$(curl -fsLS https://caseyjhand.com/setup.sh)"
```

Or straight from this repo:

```sh
sh -c "$(curl -fsLS https://raw.githubusercontent.com/cyanheads/claude-config/main/install.sh)"
```

## What it does

- Installs the Claude Code CLI if it isn't already present (it self-updates afterward).
- Installs the [Bun](https://bun.sh) runtime if it isn't present — the toolchain these settings and skills assume.
- Writes `settings.json`, `CLAUDE.md`, and `skills/` into `~/.claude/`, backing up anything already there.

## What's here

| File | What it is |
|---|---|
| `settings.json` | Claude Code settings — model, output limits, editor/notification preferences, auto permission mode. |
| `CLAUDE.md` | Global system prompt: engineering philosophy, response style, code conventions. |
| `skills/` | General-purpose skills — code cleanup, context handoff, `gh` workflows, web→Markdown, writing cleanup. |
| `orchestrator/CLAUDE.md` | A workspace-tier doctrine **template** for running multi-agent (orchestrator → worker) work — copy it to a workspace root and fill the `<…>` slots. *Not* installed into `~/.claude` (a workspace prompt only takes effect at a workspace/project root). |

## After installing

Two steps that can't be scripted:

1. `claude`, then `/login` to authenticate.
2. Export any API keys/secrets your own workflow needs.

Personal automation hooks and machine-specific config are intentionally left out — this is the portable, shareable core.
