# Contributing to avercel

Thanks for your interest in contributing! 🎉

## Getting Started

1. Fork the repo and clone it
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run tests: `npm test`

## Development

```bash
# Build and watch for changes
npm run build

# Run tests
npm test

# Type check without building
npm run lint
```

## Project Structure

```
src/
  index.ts              — Entry point, command routing
  passthrough.ts        — Spawn vercel with full stdio
  config.ts             — Load and merge config files
  patches/
    env-add.ts          — Patched env add (strip trailing whitespace)
  commands/
    env-check.ts        — Audit env vars via Vercel API
    config.ts           — Print active config
  utils/
    blocked-envs.ts     — Blocked environment name checking
    disabled.ts         — Disabled command checking
  __tests__/
    *.test.ts           — Tests (Node.js built-in test runner)
```

## Design Principles

1. **Zero runtime deps** (except `js-yaml` for config)
2. **Full passthrough fidelity** — stdin/stdout/stderr/exit code must be preserved
3. **Don't break workflows** — if avercel doesn't patch it, it should behave identically to `vercel`
4. **Explicit > magic** — config file makes behavior visible and team-shareable

## Versioning

We follow [Semantic Versioning](https://semver.org/):

- **PATCH** (0.1.x): Bug fixes, docs updates, no behavior change
- **MINOR** (0.x.0): New features, new config options (backward compatible)
- **MAJOR** (x.0.0): Breaking config changes, removed features

### Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit: `chore: release vX.Y.Z`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push origin main --tags`
6. CI auto-publishes to npm on tag push

## Pull Requests

- Keep PRs focused on a single change
- Add tests for new features
- Update README if adding user-facing features
- Use conventional commit messages: `feat:`, `fix:`, `docs:`, `test:`, `chore:`

## Reporting Issues

Use the [GitHub issue templates](.github/ISSUE_TEMPLATE/) for bug reports and feature requests.
