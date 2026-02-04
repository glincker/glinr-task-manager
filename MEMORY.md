# GLINR Task Manager Memory

## Project Overview
GLINR is an AI-native task management system that orchestrates AI agents for software development tasks.

## Key Decisions

### 2026-02-04: OpenClaw Parity Features
- Implemented Device Identity with ED25519 keys
- Added pairing codes system for device authentication
- Created session spawn/send tools for cross-session orchestration
- Memory UI added to settings
- Device Management UI added to settings

### Architecture
- Uses Hono for HTTP server
- BullMQ + Redis for task queue
- libSQL/SQLite for storage
- Vercel AI SDK for multi-provider support

## User Preferences
- Prefers TypeScript strict mode
- Uses pnpm as package manager
- Feature-based architecture for UI

## Important Notes
- Always use `.js` extension for local imports
- Memory system uses hybrid search (vector + FTS5)
- 51 built-in tools available for AI agents
