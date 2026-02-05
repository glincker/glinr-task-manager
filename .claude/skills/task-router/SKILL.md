---
name: task-router
description: Analyze task complexity and recommend model/mode. Use at the start of complex or unclear tasks.
user-invocable: true
disable-model-invocation: false
---

# Task Complexity Router

Analyze the task and recommend the optimal model and mode.

## Complexity Signals

### Use Haiku (simple)
- Single file changes
- Typo fixes, renames
- Simple questions ("what does X do?")
- Running commands
- Reading/searching files

### Use Sonnet (standard)
- Feature implementation (1-3 files)
- Writing tests
- Refactoring
- Bug fixes with clear reproduction
- Documentation

### Use Opus + Plan Mode (complex)
- Architecture decisions
- Multi-file refactoring (4+ files)
- Unclear requirements
- Performance optimization
- Security-sensitive changes
- New system design
- Debugging without clear cause

## Response Format

After analyzing, respond with:

```
Complexity: [simple/standard/complex]
Recommended Model: [haiku/sonnet/opus]
Recommended Mode: [direct/plan]
Reasoning: [1 sentence why]

Proceed? (or switch with /model <name>)
```

## Auto-Switch Triggers

If during execution you realize:
- Task is more complex than expected → Suggest switching to plan mode
- Task is simpler than expected → Note that haiku would suffice next time
- Multiple files need coordination → Suggest Opus for planning phase
