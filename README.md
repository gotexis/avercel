# avercel

[![npm version](https://img.shields.io/npm/v/avercel)](https://www.npmjs.com/package/avercel)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/gotexis/avercel/actions/workflows/ci.yml/badge.svg)](https://github.com/gotexis/avercel/actions/workflows/ci.yml)

> Agent-Vercel: an opinionated Vercel CLI wrapper that fixes the things that drive you crazy.

## The Problem

Ever spent 45 minutes debugging why your app works locally but breaks on Vercel, only to discover a **trailing newline** in an environment variable?

```bash
# This looks fine...
echo "sk-abc123" | vercel env add SECRET_KEY production

# But echo adds a trailing \n, and now your API key is "sk-abc123\n"
# Your app breaks. Vercel shows no error. You question your career choices.
```

Or maybe you've accidentally run `vercel deploy` and bypassed your entire CI/CD pipeline. Or your team keeps using `preview` when the project convention is `dev`.

**avercel** wraps the official Vercel CLI and fixes all of this.

## Features

- 🧹 **Patched `env add`** — Automatically strips trailing whitespace/newlines from piped stdin
- 🔍 **`env check`** — Audits all your env vars for trailing whitespace (the silent killer)
- 🚫 **Disabled commands** — Block dangerous commands with custom error messages
- 🛑 **Blocked environments** — Prevent wrong environment names with guidance messages
- 🔀 **Full passthrough** — Everything else forwards to `vercel` exactly as-is (same stdin/stdout/stderr/exit code)

## Installation

```bash
npm install -g avercel
```

Requires Node.js ≥ 18 and `vercel` CLI installed.

## Usage

Use `avercel` exactly like you'd use `vercel`:

```bash
# These just work — forwarded to vercel as-is
avercel dev
avercel ls
avercel domains ls

# This is the magic — trailing newline stripped automatically
echo "sk-abc123" | avercel env add SECRET_KEY production
# → "avercel: stripped 1 trailing whitespace/newline character(s) from piped input"

# Audit existing env vars
avercel env check
# → ⚠️  Found 2 env var(s) with trailing whitespace/newlines:
#    Variable                      Targets                  Problem
#    ────────────────────────────────────────────────────────────────
#    DATABASE_URL                  production, preview      trailing newline (\n)
#    SECRET_KEY                    production               trailing whitespace

# Blocked environment names show a helpful error
avercel env pull preview
# → ❌ This project uses 'dev' not 'preview'. Use: avercel env pull dev

# Blocked commands show your custom message
avercel deploy
# → ❌ Do not use `vercel deploy`. Push to GitHub and let the integration handle it.
```

## Configuration

Create `.avercel/avercel.yaml` in your project root (or `~/.avercel/avercel.yaml` for global config). Project config overrides global.

```yaml
# Block commands with custom messages
disabled:
  deploy: "❌ Do not use `vercel deploy`. Push to GitHub — Vercel deploys on git push."
  build: "❌ Do not use `vercel build`. Vercel builds automatically on deploy."

# Block specific environment names in env commands
# When someone runs `avercel env pull preview`, they get a loud error with guidance
blocked_envs:
  preview: "❌ This project uses 'dev' not 'preview'. Use: avercel env pull dev"
```

View active config:

```bash
avercel config
```

### `disabled`

Block entire commands. When a user runs a disabled command, they see your custom error message and the command exits without forwarding to vercel.

```yaml
disabled:
  deploy: "❌ Push to GitHub instead."
  build: "❌ Vercel builds automatically."
  "env rm": "❌ Don't remove env vars directly."
```

### `blocked_envs`

Block specific environment names in `env pull`, `env add`, `env ls`, and `env rm` commands. This is **not** silent replacement — it's a loud error with guidance.

```yaml
blocked_envs:
  preview: "❌ Use 'dev' not 'preview'. Run: avercel env pull dev"
  staging: "❌ No staging environment. Use 'production' or 'dev'."
```

## `env check`

Audits all environment variables in your Vercel project for trailing whitespace and newlines.

```bash
# Uses .vercel/project.json for project ID (run `vercel link` first)
avercel env check

# Or specify explicitly
avercel env check --project prj_abc123 --token tkn_xyz
```

Token sources (in order):
1. `--token` flag
2. `VERCEL_TOKEN` environment variable
3. `~/.vercel_token` file

## How It Works

```
┌─────────────────┐
│     avercel     │
│                 │
│  1. Load config │
│  2. Check if    │
│     disabled    │
│  3. Check       │
│     blocked_envs│
│  4. Patch or    │
│     passthrough │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   vercel CLI    │
│  (unmodified)   │
└─────────────────┘
```

- **Passthrough**: `spawn('vercel', args, { stdio: 'inherit' })` — zero overhead, same experience
- **Patched `env add`**: Only intercepts stdin when piped, strips trailing whitespace, forwards to vercel
- **`env check`**: Calls Vercel API directly, never touches the CLI

## Why Not Just...

| Alternative | Problem |
|---|---|
| Be careful with `echo` | You'll forget. Everyone forgets. |
| Use `printf` | Not all tools use printf. And you'll still forget. |
| Check env vars manually | There's no `vercel env check` command |
| Alias `deploy` in your shell | Doesn't help your teammates |
| Use a `.env` file | Doesn't solve the Vercel-side issue |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
