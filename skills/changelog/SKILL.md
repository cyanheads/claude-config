---
name: changelog
description: Investigate npm dependency changelog entries between version ranges. Use when the user runs "bun update" and wants to understand what changed in specific packages, or when asked to "check changelog", "what changed in <pkg>", or review dependency updates for impact.
---

# Dependency Changelog Investigator

Analyze changelog entries for npm packages between two versions and assess impact on this project.

## Input

The user will provide either:
- Raw `bun update` output with `↑ package old → new` lines
- Explicit package names and version ranges

Parse all `↑ <package> <old_version> → <new_version>` lines from the input. The user may ask about all of them or only specific ones — respect their selection.

## Finding the notes

For each package, resolve its GitHub repo (`npm view <package> repository.url`, else `homepage`), then collect the changes between `old_version` (exclusive) and `new_version` (inclusive). Prefer GitHub release notes (`gh release view <tag> -R <org/repo> --json body`), then the repo's `CHANGELOG.md`, then the commit log between the two tags (`gh api repos/<org/repo>/compare/<old_tag>...<new_tag>`) as a last resort. Check the tag format first (`gh release list -R <org/repo> --limit 10`): besides `v1.2.3` and `1.2.3`, monorepos tag per package (`<package-name>@1.2.3`, `<short-name>-v1.2.3`).

## Assessing impact

After gathering changelog data for all packages, analyze relevance to this project:

1. **Read the project's imports** — search `src/**/*.ts` for each package's import specifier to find which files use it, then check which APIs/features are actually used
2. **Cross-reference** changelog entries against actual usage
3. **Flag** breaking changes, deprecations, new features we should adopt, and bug fixes that affect us
4. **Ignore** changes to APIs/features we don't use (but mention them briefly)

## Output Format

For each package, provide:

```
## <package> <old> → <new>

### What Changed
- Bullet summary of meaningful changes

### Impact on This Project
- **Breaking:** [any breaking changes affecting us]
- **Relevant:** [bug fixes or improvements to APIs we use]
- **New:** [new features worth considering]
- **None:** [changes to things we don't use — brief mention only]

### Action Items
- [ ] Concrete steps if any changes are needed (code changes, config updates, etc.)
```

If no action is needed for a package, say so in one line and move on.

## Tips

- Monorepo packages (scoped like `@org/pkg`) often share a single GitHub repo. Check once, extract relevant entries for each sub-package.
- Some repos tag releases per-package: `sdk@1.27.0`, `ext-apps@1.1.2`. Look for these patterns.
- If `gh` commands fail (rate limiting, private repo), fall back to `npm view <package> changelog` or check the package's npm page.
- For the MCP TypeScript SDK: the repo is `modelcontextprotocol/typescript-sdk`, a monorepo that tags per package (`<package-short-name>@<version>`). The fleet depends on the v2 packages (`@modelcontextprotocol/server`, `@modelcontextprotocol/client`), not the v1 `@modelcontextprotocol/sdk`.