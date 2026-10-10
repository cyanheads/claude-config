---
name: git-wrapup
description: >
  Land working-tree changes as a stack of logical commits — grouped by concern, versioned and tagged when
  the project is versioned. The default git standard for any project that does not carry its own
  git-wrapup skill; a project-local one always wins. Stops at "committed locally" unless the project's
  own release flow says push is the release.
metadata:
  author: cyanheads
  version: "1.3"
  type: workflow
---

## Precedence — check for a local skill first

A project's own `git-wrapup` (`skills/git-wrapup/SKILL.md`, or under `.claude/skills/` / `.agents/skills/`) outranks this one and is followed instead: it names the real gate commands, the version-declaring files, and whether push is part of the release. Look for one before using this.

This skill is the fallback — the standards that hold in every repo, with no project-specific machinery assumed. Anything a framework adds (registry publishes, container images, bundle artifacts) lives in that framework's own skill, never here.

## Before anything: was a commit actually requested?

A commit is never the default end state of a task. Do the work, then hand back a working tree for review — unless the user asked for the commit in their own words ("commit this", "commit and push", a wrap-up or release request). "Fix this", "make the changes", "apply your recommendations", and "ship it" ask for the work, not the commit. When in doubt, stop at a clean diff and say so.

## Pre-commit gate

A commit means the work is ready, not that the edits are done. Every item true before staging anything:

- [ ] **Changes exist** — uncommitted files, or commits since the last tag
- [ ] **Work is complete** — no half-finished unit, no TODO placeholder, no "test later"
- [ ] **Nothing that shouldn't ship** — no secrets, `.env` files, keys, or credentials; no large binaries or build output the repo doesn't track by convention; no scratch, debug, or log files
- [ ] **The project's own gates pass** — discover them, don't assume: `package.json` scripts (`check`, `devcheck`, `typecheck`, `lint`, `test`, `build`), a Makefile, or the CI workflow. Run what exists, raw, and read the output — a zero exit with warnings printed is not a clean gate
- [ ] **Simplified** — if the diff is large or spans several files, run the `code-simplifier` skill across it first
- [ ] **No known regressions** — the change doesn't break what worked
- [ ] **Docs current** — surgical updates where the change made a doc wrong; no rewrites of docs that are still accurate

If a gate is red, fix it first — including a failure that predates this session. Starting a wrap-up on a broken tree burns a version number and creates an amend-or-revert mess.

## Steps

### 1. Review the diff

```bash
git branch --show-current   # empty output = detached HEAD
git status
git diff HEAD --stat        # every uncommitted change, staged or not
git diff HEAD               # read the actual content, not just the file list
git ls-files --others --exclude-standard   # new files, which never appear in the diff
git log <last-tag>..HEAD --oneline    # versioned projects: what's already landed
```

**Check the branch first.** Empty output from `git branch --show-current` means a detached HEAD: halt. A branch that doesn't match the project's flow (it releases from a dedicated release branch and you're on `main`, or the reverse) → stop and report before committing anything.

Diff against `HEAD`, not the index: plain `git diff` omits staged changes, so a group staged before wrap-up began (a `git mv`, a hook's output) shows up as a `git status` line to scroll past and nowhere in the review. Whatever is staged is part of what ships and gets grouped in step 2 like everything else.

**Read every untracked file in full.** New files ship through `git add` like any other change, but no diff shows their content, and `git status` collapses a new directory to a single line.

**Ship only finished work no one is still writing.** Uncommitted changes outside the work you were asked to land are candidates, not automatic exclusions: git records no author for them, so judge each from the evidence. A complete, safe change that has sat idle for hours folds in as its own commit. A change this run didn't make, modified in the last few minutes (check mtimes) or visibly half-done, may belong to a session still writing it: leave it uncommitted and report it, since committing it would ship work in progress and leave its writer editing on top of a commit. Anything unsafe or secret-bearing stays out regardless.

Clean tree with nothing since the last tag → halt, nothing to wrap up.

### 2. Group by concern

Never `git add -A` into one blob; never one-file-per-commit ceremony. Group the tree by logical concern — a fix and its test are one commit; two unrelated fixes in two files are two commits. For a tree spanning N distinct ideas, expect roughly N commits.

**The file is the atomic boundary.** Never split one file's changes across commits — not with `git add -p`, not by editing the file between commits, not by any other mechanism. When one file serves two concerns it ships whole, in the commit of its dominant concern. If that feels wrong, extract the shared part as its own commit first, then build on it.

**Order the stack foundations first.** An extracted helper or a refactor lands before the feature that uses it, so each commit builds on its own and `git bisect` stays usable.

Stage each group explicitly and commit it by pathspec before moving to the next:

```bash
git add <paths-for-this-concern>
git commit --only <paths-for-this-concern> -m "<subject>" -m "<one-line body>"
```

**Commit by pathspec, never the bare index.** A bare `git commit` commits everything staged, not the paths just added, so anything staged before wrap-up began — or staged concurrently by another session or a hook — rides into the first concern's commit. `--only` takes the named paths' working-tree content and disregards the rest of the index; a pre-staged group stays staged, to be committed as its own concern or reported. Anything still staged at step 6 fails the clean-tree check instead of shipping silently.

### 3. Write the messages

Conventional Commits — `feat|fix|refactor|chore|docs|test|build(scope): message`. Subject around 50 characters as a soft target; longer only when it earns it.

**Every commit carries a body of one or two lines** — uniform across the stack. Never subject-only, never a paragraph. One sentence for the *why* or the load-bearing constraint; a second only if the first genuinely can't carry it.

```
fix: handle empty result sets

Upstream returns 200 with an empty array rather than 404.
```

A body is too long the moment it enumerates the files touched (that's `git show --stat`), walks through how the code works (that's the code), or narrates a mechanism across sentences (that's the changelog).

Rules:
- Commit messages use plain `-m` flags only — no heredoc, no command substitution. Never put a backtick inside a double-quoted `-m`: the shell runs it as command substitution and the span disappears from the message. Tag messages go through a file instead (step 5)
- No `Co-authored-by` or `Generated with` trailers
- No marketing adjectives — "comprehensive", "robust", "enhanced", "seamless", "improved". State the change, not its quality
- Each message stands alone for someone reading `git log` weeks later — no chat context, no option numbers, no "as discussed"
- **No closing keywords in the body.** `Fixes #N` / `Closes #N` close the issue the instant the commit is pushed, before any close-out comment records what shipped. Use bare `(#N)` backlinks; closing is a deliberate later step

### 4. Versioned projects: bump, then release commit on top

Skip this entire step for content repos, config repos, and anything with no version to declare.

The bump magnitude is the user's to set — apply a documented floor when one exists, otherwise surface the choice rather than picking. Update every file that declares a version (`package.json` at minimum; also any README badge, manifest, or doc that pins one), then grep the old version string to catch stragglers — historical changelog entries are correct as-is, everything else should match. If the lockfile records the package's own version (`package-lock.json` does), regenerate it through the package manager so it matches too.

**Changelog.** A project with a `changelog/` directory of per-version files keeps its source of truth there: author `changelog/<major.minor>.x/<version>.md` — frontmatter `summary` (≤350 chars, quoted, single line) plus `breaking` / `security` flags — then regenerate the rollup with the project's `changelog:build` script. `CHANGELOG.md` is generated; never hand-edit it. Format reference: `changelog/template.md` in the project, or the `new-project` skill's `references/changelog.md`. A project with a single hand-maintained `CHANGELOG.md` gets a new dated version section at the top, same section order (Added, Changed, Deprecated, Removed, Fixed, Security), same one-sentence-per-bullet discipline.

Version bump, changelog entry, and regenerated artifacts land in a **single release commit on top of the work stack** — never mixed into a feature commit. Its subject leads with the version: `chore(release): 0.4.2 — <theme>`.

Exception: for a small release that is one cohesive change, the version files may ride with the work in one commit whose subject leads with the version. The failure to avoid is the inverse — a multi-concern diff collapsed into one release commit.

### 5. Annotated tag

```bash
git tag -a v<version> --cleanup=whitespace -F <message-file>
```

Write the message to a file outside the repo with the file-writing tool, pass it with `-F`, and delete the file once the tag exists. Markdown passed as a shell argument breaks silently: inside double quotes every backticked span runs as command substitution and vanishes from the release notes, and an apostrophe ends a single-quoted string early.

`--cleanup=whitespace` is load-bearing when the message is markdown: the default (`strip`) deletes `#`-leading lines as comments, silently eating headers. `verbatim` is worse — it skips end-of-message normalization, so with tag signing on, the signature appends flush against the last character, git can't parse it, and the whole signature block publishes into the release body.

The tag is a **headline digest**, not a changelog mirror: a subject line omitting the version (hosts prepend it), flat bullets naming the notable changes with `(#N)` backlinks, one compact grouped bullet for minor/internal items, dependencies on one line naming only what earns it. No section headers, no gates line, no narrative preamble. Depth belongs in the changelog; the tag records existence.

### 6. Verify end state

```bash
git log --oneline -8     # work commits, release commit on top
git status               # clean, apart from changes reported as excluded in step 1
git show v<version> --stat | head -20    # tag points at HEAD
```

### 7. Update tracked issues

Comment on each issue this work addresses with what landed and the commit SHAs, backlinked as needed. Closing an issue stays a separate, deliberate step.

### 8. Push only if the project says so

Default: **stop here.** Committed and tagged locally, nothing pushed — the user reviews, and a separate release step handles publishing.

Push as part of this flow only when the project's own rules say push is the release (a deploy-on-push site, a repo consumed by tag) or the user asked for it. Then `git push --follow-tags`, and confirm the deploy or release surface actually came up.

**If the push is rejected, never force-push.** For an untagged push, `git pull --rebase`, re-run the gate, and retry. For a tagged release, halt and report instead: rebasing replaces the commits and leaves the tag pointing at one that is no longer on the branch, and moving a tag needs explicit authorization.

## Constraints

- **Never `git stash`** — not for a quick check, not for a clean baseline, not for any reason. Read-only `git diff` / `git show` instead
- **Never destructive** — no `git reset --hard`, `git restore .`, `git clean -f`, `git checkout -- .` without an explicit request
- **Bash git only**
- **Never `--no-verify`** — a failing hook is a red gate. When a pre-commit hook fails, the commit did not happen: fix the cause and commit again, never `--amend`, which would rewrite the previous commit. When a hook reformats files, re-stage those paths before retrying
- **Never git worktrees** — not the shell command, not an agent isolation flag, not an MCP tool
- Never edit a file to shape how its diff will look before staging — that's the signal to rethink the commit structure, not to massage the file
- If `v<version>` already exists as a tag, **halt and report** — the version string, the existing tag's SHA, and current HEAD. Never move or delete a tag without explicit authorization

## Checklist

- [ ] A commit was actually requested
- [ ] No project-local `git-wrapup` skill that should have been followed instead
- [ ] On the branch the project's flow expects; not a detached HEAD
- [ ] Diff and every untracked file reviewed end-to-end
- [ ] Other writers' recent changes left out and reported; nothing secret-bearing or scratch staged
- [ ] Project gates run raw and green; no hook bypassed
- [ ] Work grouped by concern, foundations first; no file split across commits
- [ ] Every commit has a one-or-two-line body; no trailers, no marketing adjectives
- [ ] Versioned projects: changelog entry authored in the project's own format (per-version file + regenerated rollup, or a new dated section), version bumped everywhere it's declared (lockfile included when it records it), release commit on top
- [ ] Annotated tag with a headline-digest message passed via `-F` (if the project tags)
- [ ] Working tree clean apart from reported exclusions, tag points at HEAD
- [ ] Each addressed issue commented with what landed and the commit SHAs
- [ ] Nothing pushed unless the project's flow or the user called for it; no force-push
