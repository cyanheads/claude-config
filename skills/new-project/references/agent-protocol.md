# CLAUDE.md and AGENTS.md

`README.md` tells a human what the project is. `CLAUDE.md` tells an agent **how to work in it** — the gate, the invariants, the footguns, and where things live. Facts and narrative belong in the README or `docs/`; anything that reads like a story rather than a rule is in the wrong file.

Write it for a cold agent: no memory of this session, no idea which repo it is in, and every generic noun in the file resolves against whatever is salient to it rather than what you meant. Pair every noun with the artifact it names — `docs/architecture.md`, `src/lib/actions.ts`, `bun run check` — not "the docs", "the action file", "the gate".

## AGENTS.md

Codex and other agents read `AGENTS.md`. One file, two names:

```bash
ln -s CLAUDE.md AGENTS.md
git add AGENTS.md          # git stores the symlink; clones get it
```

Relative target, so it survives a clone anywhere. **Exception:** a package that ships agent docs inside its published tarball needs two real files — packing dereferences symlinks inconsistently across tools. There, keep both as real files and sync them (a `check-docs-sync`-style gate catches drift).

## Structure

```markdown
# <project-name>

<One paragraph: what this is, what it runs on, who calls it. Two or three sentences.>

**Orientation:** this file is the behavioral layer; `README.md` has <the architecture / API surface / env table>.
<Where the skills are, if any.>

## Stack & gate
## Running it
## Architecture
## The rules that matter
## Where things live
## Triggers
## Related repos & links
## Commit stance
```

**Stack & gate** — runtime, framework, type settings, and the **one command** that has to be green (`bun run check`). Name what is *not* there too: "no test suite — don't add one unless asked" saves an agent from inventing infrastructure.

**Running it** — a table: mode · command · what it does. Include the non-obvious operational facts (what needs a restart, what hot-reloads, where the logs are).

**Architecture** — one sentence of data/request flow, then a path → role table. This is the map; keep every row true or delete it.

**The rules that matter** — the invariants a fresh agent breaks by default. Not general good practice ("write tests", "handle errors") — the project-specific traps: what must never be edited by hand, which file is the single contract, the state that lives outside the repo, the operation that is irreversible.

**Where things live** — path pointers, as paths. `docs/decisions.md`, `scripts/`, `.env` (gitignored, never committed), the generated files and what regenerates them.

**Triggers** — a phrase → action table, so recurring asks route the same way every time:

```markdown
| When the ask is | Do this |
|:---|:---|
| "deploy", "ship it", "push it live" | Read `docs/release.md` — the gate is `bun run check`, then `bun run deploy` |
| "regenerate the schema" | `bun run codegen` — never hand-edit `src/generated/` |
| "add a new <thing>" | Copy `src/<domain>/<example>.ts`; register it in `src/<domain>/index.ts` |
```

Trigger phrases are the words the user actually says, including the sloppy ones. That table is what makes a repeat request cost one lookup instead of a rediscovery.

**Commit stance** — whether this repo commits and pushes freely or waits to be asked, and the gate that must pass first. Say it explicitly; the default is "hand back a dirty tree."

## Skills

A workflow that will be run more than once — a release flow, a data refresh, a review pass — becomes `skills/<name>/SKILL.md` rather than another CLAUDE.md section. List them in a table in CLAUDE.md so an agent finds them without a directory walk, and give the project a `list-skills` script if there is more than a couple.

## Keep it current

CLAUDE.md is edited in place, as work lands — a rule that got clarified, a path that moved, a gate that changed. Capturing a lesson means **rewriting the rule it belongs to**, not appending a dated note about the time it was learned. A file that grows by accretion stops being read.
