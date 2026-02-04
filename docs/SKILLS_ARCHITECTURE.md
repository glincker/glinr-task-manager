# GLINR Dynamic Skills & Knowledge System

> **Status**: Architecture Design
> **Inspired by**: OpenClaw's skills system
> **Goal**: Make AI a dynamic creator, not limited by hardcoded tools

## The Problem

Current approach hardcodes every tool:
```typescript
// This doesn't scale!
createTicketTool, updateTicketTool, moveTicketTool, assignTicketTool...
// Now multiply by: Jira, GitHub Projects, Linear, Plane, Monday...
```

**Issues**:
1. Every new operation = new code
2. Can't adapt to new platforms without deployment
3. AI is limited to what we explicitly build
4. No way to learn new capabilities at runtime

## The Solution: Dynamic Knowledge System

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GLINR AI Agent                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │
│  │ Skills Loader │  │ MCP Discovery │  │ Web Knowledge Fetcher │   │
│  └───────┬───────┘  └───────┬───────┘  └───────────┬───────────┘   │
│          │                  │                      │                │
│          ▼                  ▼                      ▼                │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Knowledge Registry                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │ GLINR    │  │ GitHub   │  │ Jira     │  │ Web APIs     │  │ │
│  │  │ Skills   │  │ MCP      │  │ MCP      │  │ (dynamic)    │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                 Context Builder (Prompt)                       │ │
│  │  "You have access to: GLINR tickets, GitHub issues,           │ │
│  │   Jira projects. Here's how to use each..."                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Components

### 1. Skills (Knowledge Files)

Skills are **Markdown files that teach the AI** about capabilities.

**Location**: `~/.glinr/skills/` or `<workspace>/skills/`

**Format** (`SKILL.md`):
```markdown
---
name: glinr-tickets
description: Manage tickets in GLINR task manager
version: 1.0.0
metadata:
  emoji: "🎫"
  category: "project-management"
  tools:
    - create_ticket
    - update_ticket
    - list_tickets
  mcp_server: null  # Built-in, no MCP needed
---

# GLINR Ticket Management

You can create, update, and manage tickets in GLINR.

## Creating Tickets

To create a ticket:
1. First list projects to get a valid projectKey
2. Then call create_ticket with the projectKey

Example workflow:
- User: "create a bug for the login issue"
- You: list_projects → get "GLINR" → create_ticket(projectKey="GLINR", title="Login issue", type="bug")

## Available Operations

| Operation | Tool | Required Params |
|-----------|------|-----------------|
| Create | create_ticket | projectKey, title |
| Update | update_ticket | ticketKey, (fields to update) |
| List | list_tickets | (optional filters) |
| Get | get_ticket | ticketKey |
| Comment | add_comment | ticketKey, content |
| Move | move_ticket | ticketKey, targetProjectKey |
| Assign | assign_ticket | ticketKey, assignee |

## Tips
- Always show clickable links: [GLINR-123](/tickets/abc)
- Flag AI-created tickets appropriately
- Use markdown in descriptions
```

### 2. MCP Server Discovery

Instead of hardcoding GitHub/Jira tools, **discover them from MCP servers**.

```typescript
// src/skills/mcp-discovery.ts

interface MCPServerCapabilities {
  name: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: object;
  }>;
  resources?: Array<{
    uri: string;
    name: string;
    description: string;
  }>;
}

async function discoverMCPCapabilities(): Promise<SkillKnowledge[]> {
  const connectedServers = await mcpClient.listServers();

  return connectedServers.map(server => ({
    name: server.name,
    source: 'mcp',
    capabilities: server.tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    })),
    // Auto-generate knowledge from tool descriptions
    knowledge: generateKnowledgeFromTools(server.tools),
  }));
}
```

**MCP Config** (`~/.glinr/mcp-servers.json`):
```json
{
  "servers": {
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    },
    "jira": {
      "command": "npx",
      "args": ["@anthropic/mcp-server-jira"],
      "env": { "JIRA_API_TOKEN": "${JIRA_API_TOKEN}" }
    },
    "linear": {
      "url": "https://mcp.linear.app",
      "headers": { "Authorization": "Bearer ${LINEAR_TOKEN}" }
    }
  }
}
```

### 3. Web Knowledge Fetcher

AI can **fetch documentation dynamically** when it needs to learn.

```typescript
// src/skills/web-knowledge.ts

interface WebKnowledgeSource {
  name: string;
  type: 'api-docs' | 'openapi' | 'graphql-schema' | 'markdown';
  url: string;
  cacheTtl?: number; // seconds
}

const knowledgeSources: WebKnowledgeSource[] = [
  {
    name: 'github-api',
    type: 'openapi',
    url: 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json',
    cacheTtl: 86400, // 24 hours
  },
  {
    name: 'jira-api',
    type: 'openapi',
    url: 'https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json',
    cacheTtl: 86400,
  },
  {
    name: 'linear-graphql',
    type: 'graphql-schema',
    url: 'https://api.linear.app/graphql',
    cacheTtl: 86400,
  },
];

async function fetchApiKnowledge(source: WebKnowledgeSource): Promise<string> {
  // Check cache first
  const cached = await cache.get(`knowledge:${source.name}`);
  if (cached) return cached;

  const response = await fetch(source.url);
  const content = await response.text();

  // Parse and summarize for the AI
  const knowledge = summarizeApiDocs(content, source.type);

  await cache.set(`knowledge:${source.name}`, knowledge, source.cacheTtl);
  return knowledge;
}
```

### 4. Knowledge Registry

Central registry that aggregates all knowledge sources.

```typescript
// src/skills/registry.ts

interface KnowledgeEntry {
  id: string;
  name: string;
  source: 'skill' | 'mcp' | 'web' | 'plugin';
  priority: number; // Higher = preferred

  // What the AI can do
  capabilities: Capability[];

  // How to teach the AI
  knowledge: string; // Markdown content for prompt

  // Runtime execution
  executor?: 'tool' | 'mcp' | 'http';
  mcpServer?: string;

  // Gating (when is this available?)
  requires?: {
    env?: string[];
    config?: string[];
    mcpServer?: string;
  };
}

class KnowledgeRegistry {
  private entries: Map<string, KnowledgeEntry> = new Map();

  async loadAll(): Promise<void> {
    // 1. Load built-in skills
    await this.loadSkillFiles();

    // 2. Discover MCP servers
    await this.discoverMCPServers();

    // 3. Load plugin skills
    await this.loadPluginSkills();
  }

  getActiveKnowledge(): KnowledgeEntry[] {
    return Array.from(this.entries.values())
      .filter(e => this.checkRequirements(e))
      .sort((a, b) => b.priority - a.priority);
  }

  buildPromptContext(): string {
    const active = this.getActiveKnowledge();

    return `
# Available Capabilities

You have access to the following systems and tools:

${active.map(e => `
## ${e.name}
${e.knowledge}

### Available Tools
${e.capabilities.map(c => `- **${c.name}**: ${c.description}`).join('\n')}
`).join('\n---\n')}

## Dynamic Learning

If you need to interact with a system not listed above:
1. Check if there's an MCP server available using \`list_mcp_servers\`
2. Fetch API documentation using \`fetch_api_docs\`
3. Ask the user if they want to add the integration
`;
  }
}
```

### 5. Meta-Tools (AI Self-Service)

Give the AI tools to **discover and learn** new capabilities.

```typescript
// Built-in meta-tools that enable dynamic learning

const metaTools = [
  {
    name: 'list_mcp_servers',
    description: 'List connected MCP servers and their capabilities',
    execute: async () => {
      const servers = await mcpClient.listServers();
      return servers.map(s => ({
        name: s.name,
        tools: s.tools.map(t => t.name),
        resources: s.resources?.length || 0,
      }));
    },
  },

  {
    name: 'describe_mcp_tool',
    description: 'Get detailed info about an MCP tool',
    parameters: { server: 'string', tool: 'string' },
    execute: async ({ server, tool }) => {
      const info = await mcpClient.getToolInfo(server, tool);
      return {
        name: info.name,
        description: info.description,
        parameters: info.inputSchema,
        examples: info.examples,
      };
    },
  },

  {
    name: 'fetch_api_docs',
    description: 'Fetch and learn from API documentation',
    parameters: {
      url: 'string',
      type: 'openapi | graphql | rest',
    },
    execute: async ({ url, type }) => {
      const docs = await fetchApiKnowledge({ name: 'dynamic', url, type });
      return { learned: true, summary: docs.substring(0, 2000) };
    },
  },

  {
    name: 'create_skill',
    description: 'Create a new skill file for future use',
    parameters: {
      name: 'string',
      description: 'string',
      knowledge: 'string',
    },
    execute: async ({ name, description, knowledge }) => {
      const skillPath = `~/.glinr/skills/${name}/SKILL.md`;
      await writeSkillFile(skillPath, { name, description, knowledge });
      return { created: true, path: skillPath };
    },
  },
];
```

---

## Implementation Phases

### Phase 1: Skills Loader (Foundation)
- [ ] Create `src/skills/` directory structure
- [ ] Implement `loadSkillFiles()` function
- [ ] Create `SKILL.md` parser with frontmatter
- [ ] Build knowledge registry
- [ ] Integrate into chat system prompt

### Phase 2: MCP Discovery
- [ ] Implement MCP server discovery
- [ ] Auto-generate knowledge from tool descriptions
- [ ] Add `list_mcp_servers` meta-tool
- [ ] Add `describe_mcp_tool` meta-tool

### Phase 3: Web Knowledge
- [ ] Implement API docs fetcher
- [ ] Add OpenAPI/GraphQL schema parsers
- [ ] Create knowledge cache (Redis/SQLite)
- [ ] Add `fetch_api_docs` meta-tool

### Phase 4: Dynamic Creation
- [ ] Add `create_skill` meta-tool
- [ ] Implement skill validation
- [ ] Add skill hot-reloading
- [ ] Plugin system for external skills

---

## Example: How AI Learns GitHub Projects

**Before** (Hardcoded):
```typescript
// We had to build every tool manually
const createGitHubProjectTool = { ... };
const addProjectItemTool = { ... };
const updateProjectFieldTool = { ... };
// 50+ tools for full coverage!
```

**After** (Dynamic):
```
User: "Create a GitHub project for the mobile app"

AI: (Checks knowledge registry)
    → GitHub MCP server connected
    → Has tools: github_create_project, github_add_item, ...

AI: (Uses MCP tool directly)
    → Calls github_create_project via MCP
    → Returns result to user

User: "Now sync it with Jira"

AI: (Checks knowledge registry)
    → Jira MCP server connected
    → Has tools: jira_create_project, jira_search_issues, ...

AI: (Orchestrates both)
    → Lists GitHub project items
    → Creates corresponding Jira issues
    → Links them together
```

---

## Directory Structure

```
~/.glinr/
├── skills/
│   ├── glinr-tickets/
│   │   └── SKILL.md
│   ├── github-projects/
│   │   └── SKILL.md
│   └── jira-integration/
│       └── SKILL.md
├── mcp-servers.json
├── knowledge-cache/
│   └── github-api.json
└── config.json

src/skills/
├── index.ts           # Barrel exports
├── types.ts           # TypeScript types
├── loader.ts          # Load SKILL.md files
├── registry.ts        # Knowledge registry
├── mcp-discovery.ts   # MCP server discovery
├── web-knowledge.ts   # API docs fetcher
├── meta-tools.ts      # Self-service tools
└── prompt-builder.ts  # Build context for AI
```

---

## Benefits

| Aspect | Before (Hardcoded) | After (Dynamic) |
|--------|-------------------|-----------------|
| **New Platform** | Write code, deploy | Add MCP server or skill file |
| **Learning** | Limited to coded tools | Fetches docs, creates skills |
| **Scalability** | O(n) code per operation | O(1) - same system scales |
| **User Customization** | None | Add custom skills |
| **AI Autonomy** | Follows script | Discovers & adapts |

---

## Security Considerations

1. **Skill Validation**: Verify skill files before loading
2. **MCP Sandboxing**: Run MCP servers with limited permissions
3. **API Rate Limiting**: Cache knowledge, respect rate limits
4. **User Approval**: Require approval for new skill creation
5. **Audit Trail**: Log all dynamic capability usage

---

## Next Steps

1. Start with Phase 1 (Skills Loader)
2. Create initial SKILL.md files for GLINR operations
3. Integrate with existing chat system
4. Gradually migrate hardcoded tools to skills
5. Add MCP discovery in Phase 2
