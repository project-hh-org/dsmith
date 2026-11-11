# dsmith command reference

All commands accept `--root <dir>` (target repository, default: current directory) and `--json` (machine-readable output only).

## detect
Detects the styling approach, framework and whether a design system already exists. Writes `.dsmith/detect.json`.

## audit
Counts hardcoded style values and component usage. Writes reports to `.dsmith/reports`.
- `--exclude <glob...>` extra globs to skip (node_modules, dist, *.min.css and vendor are skipped by default)

## init
Creates W3C token files (`tokens.json`, CSS, TS) and component scaffolds from the audit, then reports coverage.
- `--out <dir>` output directory inside the repo (default `design-system`)
- `--dry-run` print the files and diff without writing
- `--all` scaffold the recommended components without decision cards (top `--top`, default 10)
- `--force` overwrite token files the user edited (scaffolds are never overwritten)

## migrate
Replaces hardcoded values with token references. Prints a plan by default.
- `--category <color|spacing|radius|font-size>` limit to one category
- `--files <glob...>` limit to files (relative to root)
- `--only <tokens|components>`
- `--close` include near matches (may change rendered values)
- `--max-files <n>` first n files only
- `--apply` write the plan, validating each file, and record it in `.dsmith/migrations`
- `--branch <name>` commit the applied migration to a new git branch (with `--apply`)
- `--with-tokens` include untracked or modified token files in that commit
- `--rename-prefix` rename old-format token names (`--color-*`) to the `--ds-` prefix; plan by default, `--apply` to write
- `--list` list recorded migrations
- `--revert <id>` undo a recorded migration (files changed afterwards are skipped)

## decide
Shows decision cards for duplicated or locally overridden components and records choices in `.dsmith/decisions.json`.

## ai
Builds the component catalog (`.dsmith/catalog.json`) and updates the design-system section of `AGENTS.md`.

## install
Ensures the design-system section in `AGENTS.md` (same as `ai`).
- `--mcp` also register the dsmith MCP server for the detected AI tool
- `--skills` also write slash commands / skill files for the detected AI tool
- `--tool <claude-code|codex|cursor|gemini|agents-md...>` choose tools instead of detecting
- `--all` target every supported AI tool
- `--global` install into the user's home (claude-code and codex only)
- `--dry-run` print the files and diff without writing
- `--force` overwrite sections the user edited

## mcp
Runs the MCP server over stdio (started by the AI tool, not by hand). Runs `audit` once if no index exists.

## guard
- `guard init` writes `.dsmith/guard.json` and adds the `@dsmith-dev/eslint-plugin` block to the ESLint config (commit both). `--ci github` also writes a workflow.
- `guard --ci --base <ref>` counts hardcoded values, off-system and deprecated components added since the merge base; exits 1 above the threshold.
- `--comment` upserts the result as a GitHub PR comment (needs `GITHUB_TOKEN`)
