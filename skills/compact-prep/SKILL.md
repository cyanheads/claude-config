---
name: compact-prep
description: >
  When the user signals an imminent context compaction ("thread is about to compact", "save your context", "what do you need to carry over", "compact yourself"), or a context heads-up says it's time, output a structured snapshot of session state that survives the compaction boundary, then compact and resume. The compaction summary is lossy — details that aren't surfaced here may not survive.
metadata:
  author: cyanheads
  version: "1.1"
  audience: internal
  type: workflow
---

## When to Use

Casey says something like:
- "thread is about to be compacted"
- "save your context before compaction"
- "output anything you need to carry over"
- "what do you want to preserve"
- "context is about to compress"
- "compact yourself" / "run compact prep"

Or a context heads-up note tells the thread to compact at its next pause.

## What to Output

A structured block under a `## Compaction Snapshot` header with these sections. Only include sections that have content — skip empty ones.

### 1. Current task state
What you're in the middle of, what's done, what's next. Include file paths and line numbers for anything in-progress.

### 2. Working tree state
Per-project `git status` and branch for any repo you've touched this session. Note uncommitted work, staged files, dirty trees.

### 3. Decisions made
Choices that were discussed and resolved — the kind of thing that would waste time re-deriving. Include the reasoning if it's non-obvious.

### 4. Key findings
Facts you discovered during the session that aren't written down elsewhere (not in a file, not in a commit message, not in a skill). If it's already persisted on disk, skip it.

### 5. Blocked / waiting on
Anything paused pending external input, a running background process, or a dependency.

### 6. File locations touched
List of files created or modified this session, grouped by project. This helps post-compaction orientation — "what did I change?" is the first question.

### 7. Open threads
Conversations or sub-topics that were started but not finished. Include enough context to resume without re-reading the full pre-compaction thread.

## Then Compact

The snapshot is half the job. In the same turn, right after it:

1. Write anything the snapshot holds that isn't on disk yet into the run's state file, if the run keeps one.
2. Call `mcp__self-compact__compact` as the turn's last tool call (load it with ToolSearch `select:mcp__self-compact__compact` if it's deferred), then end the turn with no further calls. The compaction runs once the turn ends.
   - **Resume (default).** Set `resume` to the concrete first step after compaction — a command, a file, an issue number (e.g. "Run `bun run devcheck` in ~/Developer/github/foo, then commit the #12 fix"). A vague line like "continue" gets an idle "what next?" reply.
   - **No resume.** When Casey said not to continue ("don't continue", "just compact", "stop after", "I'll take it from there"), or nothing is left to do, omit `resume`. The thread compacts and waits for his next prompt.
   - Pass `instructions` only when the summary needs a specific emphasis; the default already reconciles the snapshot against the conversation.
3. In a sub-agent, or when the session has no such tool, stop after the snapshot and tell Casey to run `/compact`.

## Rules

- **Be specific, not narrative.** Paths, versions, line numbers, command outputs — not summaries of summaries.
- **Assume the post-compaction context has only the snapshot + CLAUDE.md.** Everything else may be lost or compressed to a sentence.
- **Don't pad.** If the session was simple and everything is persisted on disk, a 3-line snapshot is fine.
- **Don't ask what to include, or whether to compact.** Output everything that matters, then compact — Casey triggered this because compaction is due, not to start a conversation about it.
