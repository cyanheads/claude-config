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
- Writes `settings.json`, `CLAUDE.md`, and `skills/` into a dedicated **`~/.claude-cyanheads/`** profile — your existing `~/.claude` is never touched — and drops a **`claude-cyanheads`** launcher on your PATH.

## What's here

| File | What it is |
|---|---|
| `settings.json` | Claude Code settings — model, output limits, editor/notification preferences, auto permission mode. |
| `CLAUDE.md` | Global system prompt: engineering philosophy, response style, code conventions. |
| `skills/` | General-purpose skills — code cleanup, context handoff, `gh` workflows, web→Markdown, writing cleanup. |
| `orchestrator/` | A workspace-tier doctrine **template** for running multi-agent (orchestrator → worker) work. Point an agent at `orchestrator/BOOTSTRAP.md` — it internalizes the orchestrator doctrine, surveys your environment, and rewrites `orchestrator/CLAUDE.md` filled in. *Not* installed into the config profile (a workspace prompt only takes effect at a workspace/project root). |

## Using it

Run **`claude-cyanheads`** to start Claude Code with this config — an isolated profile in `~/.claude-cyanheads/`. Your plain `claude` keeps using `~/.claude`, untouched.

- First launch: run `/login` if prompted (one time).
- Export any API keys/secrets your workflow needs.
- Want it everywhere? Add `export CLAUDE_CONFIG_DIR="$HOME/.claude-cyanheads"` to your shell rc and plain `claude` uses it too.

Personal automation hooks and machine-specific config are intentionally left out — this is the portable, shareable core.
