---
name: new-project
description: >
  Stand up a new project from nothing — directory, git, modular skeleton, README, CLAUDE.md +
  AGENTS.md, directory-based changelog, GitHub repo with description and topics, initial commit
  and push. Use when a project does not exist yet and the user asks to start, create, scaffold,
  bootstrap, spin up, or set up one. Triggers: "new project", "start a new project", "create a
  new repo", "spin up a repo", "scaffold <name>", "bootstrap <name>", "set up a project for X",
  "make this a real project", "init a repo", "let's build X" when there is no repo yet.
  NOT for MCP servers — those scaffold via their framework (`bunx @cyanheads/mcp-ts-core init`),
  which bakes these conventions in; stop and use that path instead.
metadata:
  author: cyanheads
  version: "1.0"
  type: workflow
---

## When to use

A project that does not exist yet is about to. Trigger phrases: **new project · start a new project · create a new repo · spin up a repo · scaffold `<name>` · bootstrap `<name>` · set up a project for X · make this a real project · init a repo · let's build X** (when no repo exists).

Not this skill:

| Situation | Go instead |
|:---|:---|
| Repo already exists | Just do the work; `polish`/`git-wrapup` for shipping |
| **An MCP server** — or anything else whose framework owns the scaffold | **Stop.** Run the framework's scaffolder (`bunx @cyanheads/mcp-ts-core init <name>` for MCP servers), then follow **its** setup skill — this skill's conventions are already baked in there |
| One-off script, throwaway analysis | Scratchpad file. A repo is not the answer to every task |

## Ask once, then build

Everything below has a default, so a scaffold rarely needs to stall. Ask **one** round only for what is genuinely unknown and changes the shape:

| Decision | Default |
|:---|:---|
| Name | Hyphenated, lowercase, says what it is. Names an agent will re-read benefit from being explicit over short |
| Location | `~/Developer/github/<name>/` — every repo is a sibling there, no nested roots, no per-category dirs |
| Visibility | **Private** unless it is meant to be published or shown off. Client work is always private |
| License | Apache-2.0 for public, none needed for private |
| Runtime | Bun + TypeScript. Python → `uv` |
| Version | `0.1.0` |
| Publishes? | No, unless said otherwise — that decides npm metadata, badges, and whether the changelog ships in the package |

## 1 — Directory and git

```bash
mkdir -p ~/Developer/github/<name> && cd ~/Developer/github/<name>
git init -b main
```

`-b main` at init — never rename a branch after the fact.

## 2 — Skeleton

**Modular from the first commit.** Directories are domains, not type-buckets: `src/<domain>/` beats `src/utils/`, `src/helpers/`, `src/types/`. One primary export per non-trivial file, named for what it exports (`token-store.ts`, not `store.ts`). A module's public surface is its `index.ts` barrel; cross-module imports go through the barrel, never into another module's internals. Tests mirror `src/`. `scripts/` holds repo tooling, `docs/` holds design docs and decisions.

Stack defaults — 2026, no legacy patterns:

| Language | Defaults |
|:---|:---|
| TypeScript | Bun runtime + package manager · ESM only (`"type": "module"`) · `strict` + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` + `erasableSyntaxOnly` + `moduleResolution: "bundler"` · Biome for lint **and** format (not ESLint/Prettier) · Vitest · Zod at system edges · engines pinned (`bun >=1.3`, `node >=24`) · lockfile committed |
| Python | `uv` for everything (`uv venv` in-project, `uv add`, `uv run`) · `pyproject.toml` · ruff · pytest |

Files at the root, all of them present before the first commit:

- `package.json` — complete metadata, not just name/version: `description` (see below), `keywords`, `repository`, `bugs`, `homepage`, `author`, `license`, `engines`, `files` if published
- `tsconfig.json`, `biome.json`, `bunfig.toml`
- `.gitignore` — `.env` in it before `.env` exists
- `.env.example` — every var the code reads, with a comment and a safe default. Real secrets never leave `.env`
- `LICENSE` (public repos)
- `README.md` → `references/readme.md`
- `CLAUDE.md` + `AGENTS.md` → `references/agent-protocol.md`
- `CHANGELOG.md` + `changelog/` + `scripts/build-changelog.ts` → `references/changelog.md`

**Wire the gate before the first commit.** One command that a later session can trust: `bun run check` (typecheck + lint + test), or `devcheck` if the project grows its own. A project whose gate arrives later never gets one.

**Supply-chain hold** — `bunfig.toml` gets `[install] minimumReleaseAge = 259200` (3 days). New projects inherit the guard rather than bolting it on after an incident.

## 3 — The three documents

Read the reference file before writing each — they carry the structure, not this file:

| Document | Reference |
|:---|:---|
| `README.md` | `references/readme.md` |
| `CLAUDE.md` + `AGENTS.md` symlink | `references/agent-protocol.md` |
| `changelog/` system | `references/changelog.md` |

**One description string, three places** — `package.json` `description`, the README tagline, and the GitHub repo description are the same sentence, verbatim. They drift the moment they are written independently.

## 4 — GitHub repo

```bash
gh repo create <name> --private --source=. --remote=origin \
  --description "<the one description string>"
gh repo edit --add-topic "<topic>,<topic>,..."
gh repo edit --homepage "<url>"     # only if there is a real one
```

**Description:** one line, ~60–120 chars, states what it does and how it's reached. No "A tool for…", no adjectives.

**Topics:** 8–20, lowercase-hyphenated, covering domain terms, the tech (`typescript`, `bun`), the ecosystem it plugs into, and the owner handle as a personal tag. Topics are how a stranger finds the repo — pick the words they would type, not the words the code uses.

`--private` unless the decision above said public. Flipping private→public later is one command; the reverse leaks.

## 5 — Initial commit and push

A new-project request **authorizes** the scaffold commit, the repo creation, and the initial push — that is what "set up the repo" means. It does not authorize any commit after that one; from there the standing rule applies (commit only when asked).

```bash
git add .
git commit -m "chore: scaffold <name>" -m "<one line: what this project is>"
git push -u origin main
```

Then verify the surface actually came up — the repo page, the description, the topics, the README rendering.

## 6 — Register it

A new repo that nothing points at is invisible next session. Same turn: add it wherever the environment tracks projects — the workspace `CLAUDE.md` repo list, an inventory or catalog file, a dashboard's source data. If the project earns a standing commit grant or a gate command a future session must know, that goes in the same edit.

## Checklist

- [ ] `~/Developer/github/<name>/`, `git init -b main`
- [ ] Skeleton is modular by domain; no `utils/` catch-all
- [ ] `package.json` metadata complete; `.gitignore` covers `.env`; `.env.example` written
- [ ] Gate command exists and passes on the empty scaffold
- [ ] README follows `references/readme.md`
- [ ] `CLAUDE.md` written for a cold agent; `AGENTS.md` symlink in place
- [ ] `changelog/template.md`, `changelog/0.1.x/0.1.0.md`, generated `CHANGELOG.md`, builder script + `changelog:build` / `changelog:check` scripts
- [ ] Description string identical in `package.json`, README tagline, repo description
- [ ] Repo created with description + topics; initial commit pushed; surface verified
- [ ] Project registered wherever the environment tracks repos
