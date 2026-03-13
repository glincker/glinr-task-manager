# Changelog

## [2.1.0](https://github.com/glincker/glinr-task-manager/compare/v2.0.0...v2.1.0) (2026-03-13)


### Features

* GLINR Task Manager v1.0.0 ([9b7f7a2](https://github.com/glincker/glinr-task-manager/commit/9b7f7a21a716db9008598adc3346ad5ba49650a0))
* OpenClaw parity push - 95% complete (103/108 items) ([c734dd0](https://github.com/glincker/glinr-task-manager/commit/c734dd0c66ec7c599dfbd908e86c856daa8ed748))
* Phase 19 autonomous intelligence + Phase 11 infra + UI code-splitting ([bf93c06](https://github.com/glincker/glinr-task-manager/commit/bf93c0661ae89db45cdce6cae4106b274d2efc89))
* profClaw v2.0.0 - full rebrand and feature expansion ([db2d3f2](https://github.com/glincker/glinr-task-manager/commit/db2d3f249416143766cccd10cb02b31ca829ef4b))

## [2.0.0](https://github.com/profclaw/profclaw/compare/v1.0.0...v2.0.0) (2026-03-11)

### Breaking Changes

* Renamed from "GLINR Task Manager" to "profClaw" — all env vars, CLI commands, and API paths updated
* `GLINR_REQUIRE_REDIS` renamed to `PROFCLAW_REQUIRE_REDIS`
* `glinr.mjs` renamed to `profclaw.mjs`
* All `glinr-*` skill names renamed to `profclaw-*`

### Features

* **Deployment Modes**: Run as `pico`, `mini`, or `pro` via `PROFCLAW_MODE` env var
* **In-Memory Queue**: BullMQ-compatible task queue without Redis for pico/mini modes
* **Unified Queue Facade**: Auto-selects Redis or memory backend based on mode
* **WebChat Provider**: Browser-based chat via SSE with session management
* **Matrix Provider**: Matrix homeserver integration via Client-Server API
* **Google Chat Provider**: Google Workspace integration via webhook or service account
* **MS Teams Provider**: Microsoft Teams integration via Bot Framework
* **Plugin SDK**: Third-party plugin system with `definePlugin()` helper, npm/local loader
* **Onboarding CLI**: `npx profclaw onboard` wizard for zero-to-running setup
* **Skills Expansion**: 15 built-in skills (code-review, code-generation, debug-helper, git-workflow, web-research, cron-manager, memory-manager, system-admin, file-manager, api-tester, docker-ops)
* **Sandbox Hardening**: Security presets per deployment mode
* **Static UI Serving**: Hono middleware serves `ui/dist/` with SPA fallback
* **Pico Docker Image**: Minimal image without Chromium (`Dockerfile.pico`)

### Chat Channels (4 → 8)

* Slack, Discord, Telegram, WhatsApp (existing)
* WebChat, Matrix, Google Chat, Microsoft Teams (new)

### Infrastructure

* CI/CD: GitHub Actions with build+test+lint, release-please, Docker multi-arch, npm publish
* OSS files: CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md, LICENSE (AGPL-3.0)

## [1.0.0](https://github.com/profclaw/profclaw/releases/tag/v1.0.0) (2026-03-10)

### Features

* Initial release as GLINR Task Manager v1.0.0
* AI agent task orchestration with 51+ built-in tools
* 15+ AI provider support (Anthropic, OpenAI, Google, Azure, Ollama, etc.)
* 4 chat channels (Slack, Discord, Telegram, WhatsApp)
* GitHub, Jira, Linear integrations
* MCP server for Model Context Protocol
* Redis-backed BullMQ task queue
* React 19 dashboard UI
