<div align="center">

# claude-config

A portable [Claude Code](https://github.com/anthropics/claude-code) setup: settings, a system prompt, skills, and mods.<br>
One command installs it as its own profile. No GitHub login needed.

[![Claude Code](https://img.shields.io/badge/Claude_Code-D97757?style=for-the-badge&logo=claude&logoColor=white)](https://github.com/anthropics/claude-code) [![Bun](https://img.shields.io/badge/Bun-FBF0DF?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh) [![Model Context Protocol](https://img.shields.io/badge/Model_Context_Protocol-1A1A1A?style=for-the-badge)](https://modelcontextprotocol.io)

</div>

## Install

```sh
sh -c "$(curl -fsLS https://caseyjhand.com/setup.sh)"
```

Or straight from this repo:

```sh
sh -c "$(curl -fsLS https://raw.githubusercontent.com/cyanheads/claude-config/main/install.sh)"
```

The installer:

1. Installs the Claude Code CLI if it's missing. It updates itself after that.
2. Installs [Bun](https://bun.sh) if it's missing. The settings and skills assume it.
3. Writes `settings.json`, `CLAUDE.md`, and `skills/` into a separate profile at `~/.claude-cyanheads/`, backing up any `settings.json` or `CLAUDE.md` already there. Your `~/.claude` is never touched.
4. Puts a `claude-cyanheads` launcher in `~/.local/bin`, and prints the command to add that directory to your `PATH` if it's missing.
5. Registers the cyanheads discovery MCP server (`cyanheads.caseyjhand.com/mcp`) in the profile, so you can search the cyanheads MCP servers and pull install snippets from inside Claude. No key required.

## Use

```sh
claude-cyanheads
```

This starts Claude Code on the `~/.claude-cyanheads/` profile. Plain `claude` keeps using `~/.claude`.

- Run `/login` on first launch if prompted. It's a one-time step.
- Export any API keys or secrets your workflow needs.
- To make this profile the default for plain `claude` too, run the line the installer prints at the end. It appends the export to your shell's startup file so it holds in every new shell. For zsh:

  ```sh
  echo 'export CLAUDE_CONFIG_DIR="$HOME/.claude-cyanheads"' >> ~/.zshrc && source ~/.zshrc
  ```

## What's inside

| Path | Contents |
|:---|:---|
| `settings.json` | Claude Code settings: Opus at high effort, raised output and tool-timeout limits, auto permission mode, language-server plugins, and auto-compact turned off (the mods below handle compaction) |
| `CLAUDE.md` | The global system prompt: engineering principles, response style, code and git conventions |
| `skills/` | Ten skills and two mods, listed below |
| `orchestrator/` | A template for orchestrator → worker agent runs. Not installed into the profile; see [Orchestrator template](#orchestrator-template) |

### Skills

| Skill | What it does |
|:---|:---|
| `new-project` | Scaffolds a new repo: skeleton, README, CLAUDE.md, changelog, GitHub repo, first push |
| `git-wrapup` | Lands working-tree changes as a stack of logical commits, versioned and tagged where the project is |
| `code-simplifier` | Runs a cleanup pass over uncommitted changes or a named path |
| `compact-prep` | Saves a snapshot of session state before a context compaction, then triggers it |
| `github-cli` | `gh` workflows for PRs, issues, CI, and releases |
| `vet-agent-filed-issues` | Reviews GitHub issues another agent filed, then rewrites, closes, or splits them before anyone builds from them |
| `markdown-new` | Fetches a web page as full, clean Markdown instead of a summary |
| `writing-humanizer` | Strips the tells of AI-generated writing from prose |
| `changelog` | Reviews npm changelogs across a dependency version range |
| `modelcontextprotocol` | MCP spec and SDK link index, plus scaffolding a TypeScript server |
| `procedural-canvas-animation` | Makes code-drawn Canvas animations as one HTML file, exported to MP4 or GIF |

### Mods

Mods are Claude Code plugins that hook into the running session. These two load automatically from `skills/`:

| Mod | What it does |
|:---|:---|
| `context-heads-up` | Tells each thread when its context passes a share of the model's window: the main thread to compact at a pause, a sub-agent to wrap up and hand back. Thresholds default to 50, 55, and 60% and are configurable |
| `self-compact` | Gives the main thread a tool to compact itself at a pause it picks, then resume from a line it wrote or wait for you |

Together they replace auto-compact, so a thread compacts between tasks instead of in the middle of one.

## Orchestrator template

`orchestrator/` holds a workspace doctrine template for multi-agent work, where an orchestrator hands tasks to workers. Point an agent at `orchestrator/BOOTSTRAP.md`. It takes in the doctrine, works out your harness's conventions (which instruction files it loads, where playbooks live), surveys your environment, and fills in the skeleton. The skeleton ships as `CLAUDE.md`, and the bootstrap renames and moves it to whatever your runtime reads.

It isn't installed into the profile, because a workspace prompt only takes effect at a workspace or project root.

## What's left out

Personal automation hooks and machine-specific config stay out. This repo is the portable core. `CLAUDE.md` follows the same rule: private operational sections are removed, and rules that name my own accounts and repos are written generically, so they describe your setup instead of mine.
