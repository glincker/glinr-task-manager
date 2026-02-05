---
name: smart-commit
description: Create a git commit with conventional commit message. Use when asked to commit changes.
disable-model-invocation: true
allowed-tools: Bash
---

# Smart Commit

Create a well-formatted conventional commit.

## Steps

1. Run `git status` to see changes (never use -uall flag)
2. Run `git diff --staged` to see what's staged
3. If nothing staged, run `git diff` to see unstaged changes
4. Analyze the changes and determine:
   - Type: feat, fix, perf, refactor, docs, test, chore
   - Scope: affected area (optional)
   - Description: imperative, lowercase, no period

## Commit Format

```
<type>(<scope>): <description>

<optional body explaining why>

Co-Authored-By: Glinr <bot@glincker.com>
```

## Examples

- `feat(chat): add streaming response support`
- `fix(queue): handle null task descriptions`
- `perf(api): cache registry adapter lookups`
- `refactor(auth): extract token validation`

## Rules

- Never commit .env files or secrets
- Stage specific files, avoid `git add -A` unless user confirms
- If pre-commit hook fails, fix and create NEW commit (don't amend)
- Don't push unless explicitly asked
