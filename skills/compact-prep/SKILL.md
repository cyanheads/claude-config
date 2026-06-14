---
name: compact-prep
description: >
  When the user signals an imminent context compaction ("thread is about to compact", "save your context", "what do you need to carry over"), output a structured snapshot of session state that survives the compaction boundary. The compaction summary is lossy — details that aren't surfaced here may not survive.
metadata:
  author: cyanheads
  version: "1.0"
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

## Rules

- **Be specific, not narrative.** Paths, versions, line numbers, command outputs — not summaries of summaries.
- **Assume the post-compaction context has only the snapshot + CLAUDE.md.** Everything else may be lost or compressed to a sentence.
- **Don't pad.** If the session was simple and everything is persisted on disk, a 3-line snapshot is fine.
- **Don't ask what to include.** Output everything that matters — Casey triggered this because compaction is imminent, not to start a conversation about what's important.
