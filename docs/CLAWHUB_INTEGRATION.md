# ClawHub Skills Integration

> **Goal:** Make GLINR compatible with ClawHub's 1000+ community skills ecosystem
> **Status:** In Progress

---

## Phase 1: ClawHub Registry Client
- [ ] Create `src/skills/clawhub-client.ts` - API client for ClawHub registry
  - [ ] `searchSkills(query)` - Vector-powered search via `/api/search`
  - [ ] `listSkills(cursor?)` - Paginated listing via `/api/v1/skills`
  - [ ] `getSkill(slug)` - Fetch skill detail + versions
  - [ ] `downloadSkill(slug, version?)` - Download zip to `~/.glinr/skills/`
  - [ ] Registry URL override via `CLAWHUB_REGISTRY` env var
- [ ] Create `src/skills/lockfile.ts` - Track installed skills
  - [ ] Read/write `.glinr/lock.json` (compatible with `.clawhub/lock.json`)
  - [ ] Hash-based update detection

## Phase 2: Skills Browse/Install API Routes
- [ ] Add to `src/routes/skills.ts`:
  - [ ] `GET /api/skills/registry/search?q=` - Search ClawHub
  - [ ] `GET /api/skills/registry/browse?cursor=` - Browse all skills
  - [ ] `POST /api/skills/registry/install` - Install skill from ClawHub
  - [ ] `POST /api/skills/registry/update` - Update installed skill
  - [ ] `GET /api/skills/registry/updates` - Check for available updates

## Phase 3: Skills Store UI
- [ ] Create `ui/src/features/settings/sections/SkillsStoreDialog.tsx`
  - [ ] Search bar with debounced vector search
  - [ ] Skills grid/list with name, description, stars, downloads
  - [ ] Install button per skill with progress
  - [ ] Installed badge + update available indicator
  - [ ] Skill detail view (instructions preview, metadata, versions)
- [ ] Wire into SkillsSection.tsx with "Browse Skills" button

## Phase 4: Auto-Discovery & Agent Integration
- [ ] Skills loaded from `~/.glinr/skills/` are already picked up (managed source)
- [ ] Verify ClawHub SKILL.md format compatibility with GLINR loader
- [ ] Test: install a ClawHub skill → appears in `/api/skills` → injected in chat prompt

---

## Test Checklist

### Test 1: Registry Search
```bash
curl -s 'http://localhost:3000/api/skills/registry/search?q=github' | python3 -m json.tool
# Expected: Array of skills with slug, displayName, summary, stats
```

### Test 2: Install a Skill
```bash
curl -s 'http://localhost:3000/api/skills/registry/install' \
  -X POST -H 'Content-Type: application/json' \
  -d '{"slug":"github"}' | python3 -m json.tool
# Expected: { success: true, skill: "github", installedTo: "~/.glinr/skills/github" }
```

### Test 3: Skill Appears in Loaded Skills
```bash
curl -s 'http://localhost:3000/api/skills' | python3 -c "
import sys,json
d=json.load(sys.stdin)
names = [s['name'] for s in d['skills']]
print('Skills:', names)
print('Has github:', 'github' in names)
"
# Expected: github skill in list with source "managed"
```

### Test 4: Chat Uses Installed Skill Knowledge
```bash
CONV=$(curl -s 'http://localhost:3000/api/chat/conversations' -X POST \
  -H 'Content-Type: application/json' \
  -d '{"title":"test","presetId":"glinr-assistant"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['conversation']['id'])")

curl -s "http://localhost:3000/api/chat/conversations/$CONV/messages" \
  -X POST -H 'Content-Type: application/json' \
  -d '{"content":"What skills do you have? List all names.","provider":"ollama","model":"llama3.2"}' | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('Prompt tokens:', d['usage']['promptTokens'])
print(d['assistantMessage']['content'][:500])
"
# Expected: Prompt tokens > 3000, lists installed ClawHub skills
```
