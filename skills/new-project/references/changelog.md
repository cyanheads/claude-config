# Directory-based changelog

One file per release, generated index on top. A single hand-edited `CHANGELOG.md` rots: merge conflicts on every parallel release, no per-version metadata, and an agent has to read the whole file to find one version. Split it at scaffold time — retrofitting means rewriting history.

## Layout

```
changelog/
  template.md            ← format reference, copied once, never edited afterward
  0.1.x/
    0.1.0.md
    0.1.1.md
  0.2.x/
    0.2.0.md
CHANGELOG.md             ← GENERATED index — never hand-edited
scripts/build-changelog.ts
```

Series directories are `<major>.<minor>.x`. Pre-releases consolidate as sub-headers inside the final version's file — no separate file per rc.

## Install

1. Copy `assets/changelog-template.md` from this skill to `changelog/template.md`, replacing the `<owner>/<repo>` placeholders in the link examples.
2. Copy `assets/build-changelog.ts` from this skill to `scripts/build-changelog.ts`. Zero dependencies, no edits needed.
3. Wire the scripts:

```json
"changelog:build": "bun run scripts/build-changelog.ts",
"changelog:check": "bun run scripts/build-changelog.ts --check"
```

4. Add `changelog:check` to the project's gate command. Drift between `changelog/` and `CHANGELOG.md` then fails the gate instead of shipping.
5. Write `changelog/0.1.x/0.1.0.md` for the scaffold and run `changelog:build`.

Published packages list `changelog/` in `package.json` `files` — the per-version files are the richest thing an upgrading agent can read.

## Frontmatter

| Field | Required | Purpose |
|:---|:---|:---|
| `summary` | yes | The index line. ≤350 chars, single line, no markdown, quoted (an unquoted `: ` breaks strict YAML). Write it like a GitHub Release title |
| `breaking` | no (`false`) | Consumers must change code to upgrade. Renders `· ⚠️ Breaking` in the index |
| `security` | no (`false`) | A security fix **in this project's own source**. A dependency or transitive CVE bump is routine maintenance — record it under `## Dependencies` and leave this `false`. Renders `· 🛡️ Security` |
| `agent-notes` | no | Free-form adoption instructions for an agent upgrading a downstream consumer: files to create, fields to populate, one-time migrations. Not rendered anywhere — omit the field entirely when there is nothing to say. Situational; most releases have none |

Badge order when both flags are set: `· ⚠️ Breaking · 🛡️ Security`.

## Body

H1 is `# <version> — YYYY-MM-DD` with a real date. Sections in Keep a Changelog order — Added, Changed, Deprecated, Removed, Fixed, Security — and only the ones with entries. Never ship an empty header.

- Lead each bullet with the symbol or concept in **bold** so a reader can skip what does not affect them
- One sentence per bullet. A second only when it carries weight. If a bullet feels long, it is
- Cut: mechanism walkthroughs (those live in code and CLAUDE.md), "This release introduces…" framings, file-by-file test enumerations
- Link issues and PRs with **full URLs** — bare `#12` only auto-links inside GitHub's own UI, not on npm or in an editor. Verify the number exists before linking; never cite a number that does not exist yet
- Dependencies get their own `## Dependencies` section with version arrows: `` `pkg` `^1.2.3` → `^1.4.5` ``, grouped Runtime / Dev

## The tag is a derivative, not a copy

The annotated tag body becomes the GitHub Release body (`--notes-from-tag`). It is a condensed, scannable version of the changelog entry: a subject line **without** the version (hosts prepend `v<VERSION>:`), one or two sentences of context, then flat sections with bullets. Never a comma-spliced single line. Depth stays in the changelog; the tag records existence.

`git tag -a` needs `--cleanup=whitespace` when the message is markdown — the default strips `#`-leading lines as comments and silently eats headers.
