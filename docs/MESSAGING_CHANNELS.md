# Messaging Channels Integration

> **Goal:** Complete Telegram, WhatsApp, Discord integrations with enterprise-grade security
> **Status:** In Progress

---

## Architecture Overview

GLINR uses a **plugin-based adapter pattern** with four composable adapters per channel:

```
┌─────────────────────────────────────────────────────────────┐
│                    ChatProviderRegistry                      │
├─────────────────────────────────────────────────────────────┤
│  Providers: slack, telegram, discord, whatsapp              │
│  Accounts: Multiple per provider (multi-workspace support)  │
│  Events: Real-time dispatch to handlers                     │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │  Auth    │       │ Outbound │       │ Inbound  │
    │ Adapter  │       │ Adapter  │       │ Adapter  │
    ├──────────┤       ├──────────┤       ├──────────┤
    │ OAuth    │       │ send()   │       │ parse    │
    │ exchange │       │ edit()   │       │ Message  │
    │ verify   │       │ delete() │       │ verify   │
    │ webhook  │       │ react()  │       │ Signature│
    └──────────┘       └──────────┘       └──────────┘
```

---

## Security Requirements

### 1. Webhook Signature Verification
All incoming webhooks MUST verify signatures:

| Channel | Algorithm | Format |
|---------|-----------|--------|
| Slack | HMAC-SHA256 | `v0:timestamp:body` |
| Telegram | SHA-256 (secret_token header) | Direct comparison |
| Discord | Ed25519 | `timestamp + body` |
| WhatsApp | HMAC-SHA256 | `sha256=signature` |

### 2. Replay Attack Prevention
- Timestamp validation (max 5 minutes old)
- Nonce tracking for critical operations

### 3. Token Security
- Encrypted storage in database (AES-256-GCM)
- Environment variable override for server-side tokens
- Never log tokens, even partially

### 4. Rate Limiting
- Per-account rate limits
- Exponential backoff on 429 responses
- Circuit breaker for repeated failures

### 5. Access Control
- User ID allowlists (configurable)
- Channel ID allowlists (configurable)
- Admin-only commands

---

## Implementation Status

| Channel | Auth | Send | Receive | Commands | Interactive | Security | UI |
|---------|------|------|---------|----------|-------------|----------|-----|
| **Slack** | ✅ OAuth | ✅ | ✅ | ✅ | ✅ | ✅ HMAC | ✅ |
| **Telegram** | ✅ Token | ✅ | ✅ | ✅ | ✅ | ✅ Secret Token | ✅ |
| **Discord** | ✅ OAuth | ✅ | ✅ | ✅ | ✅ | ✅ Ed25519 | ⏳ |
| **WhatsApp** | ✅ Token | ✅ | ✅ | N/A | ✅ | ✅ HMAC | ✅ |

---

## Phase 1: Telegram Integration

### Files to Create/Modify
- [x] `src/chat/providers/telegram/index.ts` - Full implementation
- [x] `src/chat/providers/types.ts` - Telegram types in shared types file
- [x] `src/routes/telegram.ts` - Webhook routes
- [ ] `src/auth/telegram-bot.ts` - Bot token validation (integrated in routes)
- [x] `ui/src/features/settings/sections/TelegramSection.tsx` - Settings UI

### Telegram Bot API
```
POST /api/telegram/webhook           - Receive updates
POST /api/telegram/set-webhook       - Configure webhook URL
GET  /api/telegram/webhook           - Get webhook info
DELETE /api/telegram/webhook         - Remove webhook
GET  /api/telegram/status            - Bot info & health
GET  /api/telegram/config            - Get current config
POST /api/telegram/config            - Save config
POST /api/telegram/test              - Send test message
```

### Security Checklist
- [x] Verify `X-Telegram-Bot-Api-Secret-Token` header
- [x] Validate update structure (prevent injection)
- [ ] Rate limit per chat_id
- [x] Allowlist user_ids and chat_ids

### Test Commands
```bash
# Test 1: Verify webhook is protected
curl -s 'http://localhost:3000/api/telegram/webhook' \
  -X POST -H 'Content-Type: application/json' \
  -d '{"update_id":1}'
# Expected: 401 Unauthorized (no secret token)

# Test 2: Send test message (after config)
curl -s 'http://localhost:3000/api/telegram/test' \
  -X POST -H 'Content-Type: application/json' \
  -d '{"chat_id":"123","text":"Hello from GLINR"}'
```

---

## Phase 2: Discord Integration ✅

### Files Created/Modified
- [x] `src/chat/providers/discord/index.ts` - Full implementation
- [x] `src/chat/providers/types.ts` - Discord types in shared types file
- [x] `src/routes/discord.ts` - Interactions endpoint
- [ ] `ui/src/features/settings/sections/DiscordSection.tsx` - Settings UI (TODO)

### Discord Interactions API
```
POST /api/discord/interactions       - Slash commands, buttons, modals
GET  /api/discord/oauth/url          - Get OAuth URL for bot installation
GET  /api/discord/oauth/callback     - OAuth redirect
GET  /api/discord/status             - Bot info & health
GET  /api/discord/config             - Get current config
POST /api/discord/config             - Save config
POST /api/discord/test               - Send test message
POST /api/discord/commands/register  - Register slash commands
GET  /api/discord/commands           - List registered commands
```

### Security Checklist
- [x] Ed25519 signature verification (native SubtleCrypto)
- [x] Validate application_id matches
- [x] Allowlist guild_ids
- [x] Allowlist channel_ids
- [x] Allowlist role_ids
- [ ] Rate limit per guild_id (TODO)

### Test Commands
```bash
# Test 1: Verify Ed25519 protection
curl -s 'http://localhost:3000/api/discord/interactions' \
  -X POST -H 'Content-Type: application/json' \
  -d '{"type":1}'
# Expected: 401 (invalid signature)

# Test 2: Check OAuth URL generation
curl -s 'http://localhost:3000/api/discord/oauth/url'
# Expected: { url: "https://discord.com/oauth2/authorize?..." }

# Test 3: Check status
curl -s 'http://localhost:3000/api/discord/status'
# Expected: { configured: true/false, connected: true/false, ... }
```

---

## Phase 3: WhatsApp Integration ✅

### Files to Create/Modify
- [x] `src/chat/providers/whatsapp/index.ts` - Full implementation
- [x] `src/chat/providers/types.ts` - WhatsApp types in shared types file
- [x] `src/routes/whatsapp.ts` - Webhook routes
- [x] `ui/src/features/settings/sections/MessagingSection.tsx` - WhatsAppConfig in tabbed UI

### WhatsApp Cloud API
```
POST /api/whatsapp/webhook           - Receive messages
GET  /api/whatsapp/webhook           - Webhook verification (challenge)
GET  /api/whatsapp/status            - Connection status
GET  /api/whatsapp/config            - Get current config
POST /api/whatsapp/config            - Save config
POST /api/whatsapp/test              - Send test message
```

### Security Checklist
- [x] HMAC-SHA256 signature verification
- [x] Webhook verify_token challenge/response
- [x] Validate phone_number_id matches config
- [x] Allowlist phone numbers
- [ ] Rate limit per wa_id (phone number)

### Test Commands
```bash
# Test 1: Webhook verification challenge
curl -s 'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=abc123'
# Expected: abc123 (echoed challenge)

# Test 2: Invalid signature rejected
curl -s 'http://localhost:3000/api/whatsapp/webhook' \
  -X POST -H 'Content-Type: application/json' \
  -H 'X-Hub-Signature-256: sha256=invalid' \
  -d '{}'
# Expected: 401 Unauthorized

# Test 3: Check status
curl -s 'http://localhost:3000/api/whatsapp/status'
# Expected: { configured: true/false, connected: true/false, ... }
```

---

## Phase 4: Settings UI

### Integrations Hub
Create unified integrations page at `/settings/integrations`:

```
┌─────────────────────────────────────────────────────────────┐
│  Messaging Channels                                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Slack  │  │Telegram │  │ Discord │  │WhatsApp │        │
│  │   ✅    │  │   ⚙️    │  │   ⚙️    │  │   ⚙️    │        │
│  │Connected│  │Configure│  │Configure│  │Configure│        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Telegram Configuration                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Bot Token: ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●  [Show] [Test]││
│  │ Webhook URL: https://your-domain.com/api/telegram/webhook│
│  │ Secret Token: ●●●●●●●●●●●●●●●●  [Generate]              ││
│  │                                                          ││
│  │ Allowed Users: @user1, @user2  [Edit]                   ││
│  │ Allowed Chats: -100123456789   [Edit]                   ││
│  │                                                          ││
│  │ Status: ✅ Connected (latency: 45ms)                    ││
│  │ Bot: @YourGlinrBot                                      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Additions

```sql
-- Encrypted channel account storage
CREATE TABLE channel_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,           -- 'telegram', 'discord', 'whatsapp'
  name TEXT,
  enabled INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,

  -- Encrypted config (tokens, secrets)
  config_encrypted BLOB NOT NULL,
  config_iv BLOB NOT NULL,

  -- Metadata
  external_id TEXT,                 -- bot_id, guild_id, phone_number_id
  external_name TEXT,               -- bot username, guild name
  connected_at INTEGER,
  last_health_at INTEGER,
  health_status TEXT,

  created_at INTEGER DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now')),

  UNIQUE(user_id, provider, id)
);

-- Webhook event audit log
CREATE TABLE channel_webhooks (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  account_id TEXT REFERENCES channel_accounts(id),
  event_type TEXT,

  -- Security audit
  signature_valid INTEGER,
  timestamp_valid INTEGER,
  sender_allowed INTEGER,

  -- Processing
  status TEXT DEFAULT 'received',   -- received, processed, failed, rejected
  error TEXT,
  processing_ms INTEGER,

  -- Payload (may be redacted for privacy)
  payload_hash TEXT,                -- SHA-256 of payload for dedup

  created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE INDEX idx_channel_webhooks_provider ON channel_webhooks(provider, created_at DESC);
CREATE INDEX idx_channel_webhooks_status ON channel_webhooks(status, created_at DESC);

-- Allowlists for access control
CREATE TABLE channel_allowlists (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES channel_accounts(id),
  type TEXT NOT NULL,               -- 'user', 'chat', 'guild'
  external_id TEXT NOT NULL,
  name TEXT,
  added_by TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now')),

  UNIQUE(account_id, type, external_id)
);
```

---

## Environment Variables

```bash
# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_WEBHOOK_SECRET=random-secret-string
TELEGRAM_ALLOWED_USERS=123456789,987654321
TELEGRAM_ALLOWED_CHATS=-100123456789

# Discord
DISCORD_BOT_TOKEN=MTIz...
DISCORD_APPLICATION_ID=123456789
DISCORD_PUBLIC_KEY=abc123...
DISCORD_CLIENT_SECRET=xxx
DISCORD_ALLOWED_GUILDS=123456789

# WhatsApp
WHATSAPP_ACCESS_TOKEN=EAAx...
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ID=123456789
WHATSAPP_VERIFY_TOKEN=my-verify-token
WHATSAPP_APP_SECRET=abc123...

# Encryption key for stored tokens
CHANNEL_ENCRYPTION_KEY=32-byte-hex-string
```

---

## OpenClaw Comparison

| Feature | OpenClaw | GLINR |
|---------|----------|-------|
| Telegram | ✅ Full (polling + webhook) | ✅ Full (webhook) |
| Discord | ✅ Full (gateway + interactions) | ✅ Full (HTTP interactions) |
| WhatsApp | ❌ Not supported | ✅ Full (Cloud API) |
| Slack | ✅ Socket Mode | ✅ Full (HTTP + Socket Mode) |
| iMessage | ✅ Via BlueBubbles | ❌ Not planned |
| Matrix | ✅ Via bridges | ❌ Not planned |
| Multi-account | ❌ Single per channel | ✅ Multiple accounts |
| Encrypted storage | ❌ Plain text | ✅ AES-256-GCM |
| Webhook audit log | ❌ None | ✅ Full audit trail |
| Allowlists | ✅ Env vars only | ✅ DB + Env + UI |
| Settings UI | ❌ Config files only | ✅ Full web UI |

---

## Product Tiers & Monetization Strategy

### Why GLINR Can Be a Business

1. **New Category** - "AI-Native PM" doesn't exist yet. Jira/Linear are human-centric.
2. **Multi-Channel is Hard** - Each integration = real engineering effort = worth paying for
3. **Enterprise Needs Unified View** - Avg company uses 4+ messaging tools
4. **AI Cost Visibility** - AI bills add up fast; tracking = real value proposition
5. **OSS Core + Paid Premium** - Proven model (GitLab, Supabase, Cal.com)

### Channel Tiers

#### Tier 1: Open Source (Free Forever)
| Channel | Status | Rationale |
|---------|--------|-----------|
| Telegram | ✅ Complete | Developer-friendly, free API |
| Discord | ✅ Complete | Gaming/community, free API |
| WhatsApp | ✅ Complete | Global reach, free tier exists |
| Slack | ✅ Complete | Developer standard |

#### Tier 2: Pro ($29/user/mo)
| Channel | Status | Market Size | Effort |
|---------|--------|-------------|--------|
| Microsoft Teams | 📋 Planned | 300M+ users, enterprise standard | Medium |
| Google Chat | 📋 Planned | Workspace integration, enterprise | Medium |
| SMS/Twilio | 📋 Planned | Universal, no app required | Low |
| Mattermost | 📋 Planned | Self-hosted enterprise | Low |

#### Tier 3: Enterprise (Custom Pricing)
| Channel | Status | Market Size | Effort |
|---------|--------|-------------|--------|
| Matrix/Element | 📋 Planned | Government, privacy-focused | Medium |
| LINE | 📋 Planned | 300M users (Japan, Thailand, Taiwan) | Medium |
| Zalo | 📋 Planned | 75M users (Vietnam) | Medium |
| WeChat Work | 📋 Planned | 1B users (China enterprise) | High |
| Custom Webhook | 📋 Planned | Any internal system | Low |

### Pricing Matrix

| Feature | OSS | Pro | Enterprise |
|---------|-----|-----|------------|
| **Price** | Free | $29/user/mo | Custom |
| **Channels** | 4 (TG, DC, WA, Slack) | +4 (Teams, GChat, SMS, MM) | +All |
| **Users** | 1 | Unlimited | Unlimited |
| **AI Providers** | 3 | 15 | 15+ custom |
| **Cost Tracking** | Basic | Full analytics | Custom reports |
| **API Access** | Limited | Full | Full + webhooks |
| **Support** | Community | Email | Dedicated + SLA |
| **SSO/SAML** | ❌ | ❌ | ✅ |
| **Audit Logs** | 7 days | 90 days | Unlimited |
| **Self-hosted** | ✅ | ✅ | ✅ + support |

### Competitive Positioning

| vs | GLINR Advantage |
|----|-----------------|
| **Jira/Linear** | AI-native execution, not just organization |
| **OpenClaw** | 51 tools vs 15, full PM, better cost tracking |
| **Plane** | Multi-channel messaging, AI integration |
| **Monday.com** | Developer-focused, OSS core |
| **ClickUp** | Lightweight, API-first |

### Go-to-Market Strategy

1. **Phase 1: OSS Adoption** - Build community with free tier
2. **Phase 2: Pro Launch** - Teams/GChat for enterprise entry
3. **Phase 3: Enterprise** - Custom channels, SSO, support contracts

---

## Future Enhancements (TODO)

### Phase 5: Discord Gateway Mode (Real-time)

> **Purpose:** Add real-time message events for @mentions, presence, and direct messages

| Feature | HTTP Interactions (Current) | Gateway Mode (Future) |
|---------|----------------------------|----------------------|
| Slash commands | ✅ | ✅ |
| Button interactions | ✅ | ✅ |
| Message @mentions | ❌ | ✅ |
| Presence updates | ❌ | ✅ |
| Voice state | ❌ | ✅ |
| Direct messages | Limited | ✅ Full |

**Dependencies:** `discord.js` or `@discordjs/core`

### Phase 6: IoT/Device Integration

> **Purpose:** Enable GLINR to control and monitor IoT devices

#### Planned Integrations
- [ ] **MQTT Broker** - Generic IoT messaging protocol
- [ ] **Home Assistant** - Smart home control
- [ ] **Matter/Thread** - Modern IoT standard
- [ ] **Webhook receivers** - Generic device callbacks

#### Use Cases
1. **Smart Notifications** - Alert on sensor triggers
2. **Voice/Chat Control** - "Turn on office lights"
3. **Automated Tasks** - Cron jobs for device schedules
4. **Status Monitoring** - Device health in dashboard

#### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    GLINR Gateway                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   MQTT   │  │  Home    │  │  Matter  │  │ Webhook  │    │
│  │  Adapter │  │ Assistant│  │  Adapter │  │ Receiver │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│       │              │              │              │         │
│       └──────────────┴──────────────┴──────────────┘         │
│                              │                               │
│                    ┌─────────▼─────────┐                    │
│                    │  Device Registry   │                    │
│                    │  (state, commands) │                    │
│                    └───────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```
