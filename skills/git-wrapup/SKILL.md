---
name: git-wrapup
description: >
  Land working-tree changes as a stack of logical commits — grouped by concern, versioned and tagged when
  the project is versioned. The default git standard for any project that does not carry its own
  git-wrapup skill; a project-local one always wins. Stops at "committed locally" unless the project's
  own release flow says push is the release.
metadata:
  author: cyanheads
  version: "1.0"
  type: workflow
---

## Precedence — check for a local skill first

A project's own `git-wrapup` (`skills/git-wrapup/SKILL.md`, or under `.claude/skills/` / `.agents/skills/`) outranks this one and is followed instead: it names the real gate commands, the version-declaring files, and whether push is part of the release. Look for one before using this.

This skill is the fallback — the standards that hold in every repo, with no project-specific machinery assumed. Anything a framework adds (changelog directories, registry publishes, container images) lives in that framework's own skill, never here.

## Before anything: was a commit actually requested?

A commit is never the default end state of a task. Do the work, then hand back a working tree for review — unless the user asked for the commit in their own words ("commit this", "commit and push", a wrap-up or release request). "Fix this", "make the changes", "apply your recommendations", and "ship it" ask for the work, not the commit. When in doubt, stop at a clean diff and say so.

## Pre-commit gate

A commit means the work is ready, not that the edits are done. Every item true before staging anything:

- [ ] **Changes exist** — uncommitted files, or commits since the last tag
- [ ] **Work is complete** — no half-finished unit, no TODO placeholder, no "test later"
- [ ] **The project's own gates pass** — discover them, don't assume: `package.json` scripts (`check`, `devcheck`, `typecheck`, `lint`, `test`, `build`), a Makefile, or the CI workflow. Run what exists, raw, and read the output — a zero exit with warnings printed is not a clean gate
- [ ] **Simplified** — if the diff is large or spans several files, run the `code-simplifier` skill across it first
- [ ] **No known regressions** — the change doesn't break what worked
- [ ] **Docs current** — surgical updates where the change made a doc wrong; no rewrites of docs that are still accurate
- [ ] **Tracked issues updated** — anything this work addresses gets a comment on what landed, backlinked as needed

If a gate is red, fix it first — including a failure that predates this session. Starting a wrap-up on a broken tree burns a version number and creates an amend-or-revert mess.

## Steps

### 1. Review the diff

```bash
git status
git diff --stat
git diff                    # read the actual content, not just the file list
git log <last-tag>..HEAD --oneline    # versioned projects: what's already landed
```

Clean tree with nothing since the last tag → halt, nothing to wrap up.

### 2. Group by concern

Never `git add -A` into one blob; never one-file-per-commit ceremony. Group the tree by logical concern — a fix and its test are one commit; two unrelated fixes in two files are two commits. For a tree spanning N distinct ideas, expect roughly N commits.

**The file is the atomic boundary.** Never split one file's changes across commits — not with `git add -p`, not by editing the file between commits, not by any other mechanism. When one file serves two concerns it ships whole, in the commit of its dominant concern. If that feels wrong, extract the shared part as its own commit first, then build on it.

Stage each group explicitly and commit it before moving to the next:

```bash
git add <paths-for-this-concern>
git commit -m "<subject>" -m "<one-line body>"
```

### 3. Write the messages

Conventional Commits — `feat|fix|refactor|chore|docs|test|build(scope): message`. Subject around 50 characters as a soft target; longer only when it earns it.

**Every commit carries a body of one or two lines** — uniform across the stack. Never subject-only, never a paragraph. One sentence for the *why* or the load-bearing constraint; a second only if the first genuinely can't carry it.

```
fix: handle empty result sets

Upstream returns 200 with an empty array rather than 404.
```

A body is too long the moment it enumerates the files touched (that's `git show --stat`), walks through how the code works (that's the code), or narrates a mechanism across sentences (that's the changelog).

Rules:
- Plain `-m` flags only — no heredoc, no command substitution
- No `Co-authored-by` or `Generated with` trailers
- No marketing adjectives — "comprehensive", "robust", "enhanced", "seamless", "improved". State the change, not its quality
- Each message stands alone for someone reading `git log` weeks later — no chat context, no option numbers, no "as discussed"
- **No closing keywords in the body.** `Fixes #N` / `Closes #N` close the issue the instant the commit is pushed, before any close-out comment records what shipped. Use bare `(#N)` backlinks; closing is a deliberate later step

### 4. Versioned projects: bump, then release commit on top

Skip this entire step for content repos, config repos, and anything with no version to declare.

The bump magnitude is the user's to set — apply a documented floor when one exists, otherwise surface the choice rather than picking. Update every file that declares a version (`package.json` at minimum; also any README badge, manifest, or doc that pins one), then grep the old version string to catch stragglers — historical changelog entries are correct as-is, everything else should match.

Version bump, changelog entry, and regenerated artifacts land in a **single release commit on top of the work stack** — never mixed into a feature commit. Its subject leads with the version: `chore(release): 0.4.2 — <theme>`.

Exception: for a small release that is one cohesive change, the version files may ride with the work in one commit whose subject leads with the version. The failure to avoid is the inverse — a multi-concern diff collapsed into one release commit.

### 5. Annotated tag

```bash
git tag -a v<version> --cleanup=whitespace -m "<structured markdown message>"
```

`--cleanup=whitespace` is load-bearing when the message is markdown: the default (`strip`) deletes `#`-leading lines as comments, silently eating headers. `verbatim` is worse — it skips end-of-message normalization, so with tag signing on, the signature appends flush against the last character, git can't parse it, and the whole signature block publishes into the release body.

The tag is a **headline digest**, not a changelog mirror: a subject line omitting the version (hosts prepend it), flat bullets naming the notable changes with `(#N)` backlinks, one compact grouped bullet for minor/internal items, dependencies on one line naming only what earns it. No section headers, no gates line, no narrative preamble. Depth belongs in the changelog; the tag records existence.

### 6. Verify end state

```bash
git log --oneline -8     # work commits, release commit on top
git status               # clean
git show v<version> --stat | head -20    # tag points at HEAD
```

### 7. Push only if the project says so

Default: **stop here.** Committed and tagged locally, nothing pushed — the user reviews, and a separate release step handles publishing.

Push as part of this flow only when the project's own rules say push is the release (a deploy-on-push site, a repo consumed by tag) or the user asked for it. Then `git push --follow-tags`, and confirm the deploy or release surface actually came up.

## Constraints

- **Never `git stash`** — not for a quick check, not for a clean baseline, not for any reason. Read-only `git diff` / `git show` instead
- **Never destructive** — no `git reset --hard`, `git restore .`, `git clean -f`, `git checkout -- .` without an explicit request
- **Bash git only**
- **Never git worktrees** — not the shell command, not an agent isolation flag, not an MCP tool
- Never edit a file to shape how its diff will look before staging — that's the signal to rethink the commit structure, not to massage the file
- If `v<version>` already exists as a tag, **halt and report** — the version string, the existing tag's SHA, and current HEAD. Never move or delete a tag without explicit authorization

## Checklist

- [ ] A commit was actually requested
- [ ] No project-local `git-wrapup` skill that should have been followed instead
- [ ] Diff reviewed end-to-end
- [ ] Project gates run raw and green
- [ ] Work grouped by concern; no file split across commits
- [ ] Every commit has a one-or-two-line body; no trailers, no marketing adjectives
- [ ] Versioned projects: version bumped everywhere it's declared, release commit on top
- [ ] Annotated tag with a headline-digest message (if the project tags)
- [ ] Working tree clean, tag points at HEAD
- [ ] Nothing pushed unless the project's flow or the user called for it
