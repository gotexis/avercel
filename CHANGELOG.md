# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-14

### Added

- `takeover` command — replace global `vercel` CLI with avercel
- Bundled `vercel` as dependency (no separate install needed)
- `blocked_envs` config — block specific environment names with messages
- AgentSkill (`skill/SKILL.md`) for AI agents
- Landing page (`docs/index.html`)
- GitHub Actions: `publish.yml` with trusted publishing (OIDC)
- GitHub Actions: `version-bump.yml` for manual version bumps

### Changed

- Removed environment aliases feature (replaced by `blocked_envs`)
- `vercel` is now a bundled dependency, not a peer dependency

### Fixed

- CI package-lock.json sync

## [0.1.0] - 2025-07-14

### Added

- Full CLI passthrough to `vercel` with stdio/exit code preservation
- Patched `env add` — strips trailing whitespace/newlines from piped stdin
- `env check` command — audits env vars via Vercel API for trailing whitespace
- Environment aliases — map custom names to Vercel environment names in config
- Disabled commands — block specific commands with custom error messages
- Config file support — project-level and global `.avercel/avercel.yaml`
- `config show` command — print active configuration
