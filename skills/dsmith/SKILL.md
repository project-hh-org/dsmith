---
name: dsmith
description: Find hardcoded colors, spacing, radius and font sizes in a web or React Native codebase, draft design tokens from them, replace them with token references, and keep new code on the design system. Use when the user asks to audit design-system usage, create or clean up design tokens, migrate hardcoded style values to tokens, or stop AI-written code from hardcoding styles.
---

# dsmith

dsmith is an open-source CLI (MIT, https://github.com/project-hh-org/dsmith) that reads a repository's styles with an AST parser and works on the design system in place. It supports CSS, SCSS, Tailwind (v3 and v4), CSS-in-JS (styled-components, Emotion, MUI `sx`), inline styles and React Native (`StyleSheet`, `style` props, Reanimated).

Run it with `npx dsmith <command>` from the repository root (or pass `--root <dir>`). `npx` downloads the `dsmith` package from npm the first time; nothing else is sent over the network. Every command writes its state under `.dsmith/` in the repository.

## When to use

- "How much of our UI is hardcoded?" / "Audit our design system usage" → `audit`
- "We have no tokens, make some from what we already use" → `init`
- "Replace hardcoded colors/spacing with our tokens" → `migrate`
- "Make the AI agent use our design system" → `install`
- "Block new hardcoded values in PRs" → `guard`

## Workflow

Follow these steps in order. Stop and ask the user before any step that writes files outside `.dsmith/`.

1. **Detect and audit (read-only).**
   ```
   npx dsmith detect
   npx dsmith audit
   ```
   Report the styling approach, whether a design system exists, the number of hardcoded values by category (color, spacing, radius, font-size) and the files with the most. Use `--json` when you need to read the numbers yourself.

2. **Draft tokens (only if the repo has none).** Preview first, then write after the user agrees:
   ```
   npx dsmith init --dry-run
   npx dsmith init
   ```
   This writes W3C token JSON, CSS variables (`--ds-*`) and a TS module under `design-system/` and reports coverage. In React Native repos that already have a JS theme object, dsmith uses that theme as the tokens and writes nothing.

3. **Plan the migration.** The default run only prints a plan:
   ```
   npx dsmith migrate
   npx dsmith migrate --category color
   ```
   Show the user how many replacements are planned and a few examples. Only exact matches are planned by default. `--close` adds near matches (±2px, small color difference); mention that these can change what renders.

4. **Apply only with consent.**
   ```
   npx dsmith migrate --apply
   npx dsmith migrate --apply --branch ds/migrate-colors
   ```
   Each applied migration is recorded. To undo: `npx dsmith migrate --list`, then `npx dsmith migrate --revert <id>` (files edited after the migration are skipped).

5. **Keep agents on the design system.**
   ```
   npx dsmith install
   ```
   Adds a design-system section to `AGENTS.md` (rules: use tokens, prefer existing DS components, add a token instead of a new raw value). `--mcp` also registers the dsmith MCP server and `--skills` adds slash commands for the detected AI tool; both are optional. In the author's benchmark the AGENTS.md section alone gave the best token usage.

6. **Guard pull requests.**
   ```
   npx dsmith guard init
   npx dsmith guard --ci --base origin/main
   ```
   `guard init` writes `.dsmith/guard.json` and an ESLint block (commit both). `guard --ci` exits with code 1 when a PR adds hardcoded values above the threshold.

## Rules

- Never run `migrate --apply`, `init` (without `--dry-run`), `install` or `guard init` without the user's go-ahead: they write source files.
- Prefer `--dry-run` or the default plan output and show the diff first.
- Do not hand-edit `.dsmith/`; rerun the command instead.
- When writing new UI code in a repo that has dsmith tokens, use the token (`var(--ds-color-blue-400)`, `colors.surface` in React Native) instead of a raw value. If no token fits, ask before adding one.

See `reference/commands.md` for every flag.
