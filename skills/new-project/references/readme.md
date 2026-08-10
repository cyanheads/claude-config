# README structure

The README is the storefront: a stranger decides in ten seconds whether this is worth their time, then needs to run it in two minutes. Lead with what it does, not how it was built.

## Skeleton

```markdown
<div align="center">
  <h1><package-name-exactly-as-published></h1>
  <p><b><the one description string — same as package.json description></b>
  <div><N Things • N Other Things></div>   <!-- only when there's a countable surface -->
  </p>
</div>

<div align="center">

[![Version](…)](./CHANGELOG.md) [![License](…)](./LICENSE) [![npm](…)](…) [![TypeScript](…)](…) [![Bun](…)](…)

</div>

---

## <Surface>          ← the API/tool/command table: the first thing a reader wants
## <Per-item detail>  ← only for items that need more than a table row
## Features           ← factual bullets, what it does that isn't obvious from the table
## Getting started    ← hosted/zero-install path first if one exists, then install
## Configuration      ← env var table
## Running            ← the actual commands
## Project structure  ← directory → purpose table
## Development guide  ← one-liner rules + pointer to CLAUDE.md
## Contributing       ← the gate commands
## License
```

## Rules

**The `<h1>` is the published identity, verbatim.** Whatever `npm install` / `pip install` / `git clone` actually names. A scoped package shows its scope because that is its real name; an unscoped one shows none. Never normalize a name to a house convention — that implies a rename.

**Tagline = `package.json` `description` = GitHub repo description.** One sentence, three places, identical. Check all three when any one changes.

**Badges:** `style=flat-square` for the informational row (version → CHANGELOG, license → LICENSE, npm, language, runtime). `style=for-the-badge` only for install/deeplink actions, on their own centered row. Two rows maximum. A badge nobody clicks is noise.

**Tables over prose.** Surface inventory, env vars, project structure, commands — all tables, one line per row, left-aligned (`|:---|`). Prose is for the paragraph a table can't carry.

**One line per item.** This is a README, not documentation. If a tool/function/command needs three paragraphs, it needs a `docs/` page the README links to.

**Zero-install path first.** If there is a hosted instance, a `bunx`/`npx` one-liner, or a Docker image, it goes above the clone-and-build instructions. Most readers never reach the second option.

**Config as a table:** variable · required · default · what it does. Every var the code reads, matching `.env.example`. Secrets show a placeholder, never a real value.

**Project structure table** maps directory → purpose in one line each. This is the map an agent reads before touching anything; keep it accurate or delete it.

**Development guide is three or four bullets and a pointer.** The real rules live in `CLAUDE.md` — the README says "see CLAUDE.md" plus the load-bearing invariants a drive-by contributor would otherwise violate.

## Voice

- No marketing adjectives — comprehensive, robust, seamless, powerful, blazing, enhanced. State the capability; the reader grades it
- No "This project aims to…", no origin story, no roadmap-as-feature-list
- Don't anti-position against the ecosystem the project builds on. "Works with any X-format directory" is honest; "no need to install X" is adversarial toward the thing the project depends on
- Assume a competent reader who has never seen the project. No internal shorthand, no references to conversations, no "as mentioned above"
- Long-form or brand-facing README → a `writing-humanizer` pass before it ships
