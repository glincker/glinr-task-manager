# GLINR Browser Automation Design

> **Goal:** Add Playwright-based browser automation to GLINR for AI agents
> **Sources:** OpenClaw browser-tool, Microsoft Playwright MCP, Better Playwright MCP

---

## Research Summary

### OpenClaw Browser Tool
- **Pattern:** Single monolithic tool with `action` parameter
- **Strengths:** Profile management (Chrome extension relay), remote node proxying
- **Weaknesses:** Complex schema, harder for LLMs to understand all options

### Microsoft Playwright MCP
- **Pattern:** Separate tools per action (browser_click, browser_navigate, etc.)
- **Strengths:** Clean API, accessibility tree snapshots, shows Playwright code
- **Weaknesses:** No DOM compression, high token usage for complex pages

### Better Playwright MCP
- **Pattern:** HTTP server + SDK client
- **Strengths:** 91% DOM compression, list folding, regex content search
- **Weaknesses:** Extra server process needed

---

## Design Decision: Hybrid Approach

GLINR will use **separate tools** (Microsoft pattern) with **DOM compression** (Better Playwright):

| Feature | Source | Reason |
|---------|--------|--------|
| Separate tools | Microsoft MCP | Better LLM understanding |
| Accessibility snapshots | Microsoft MCP | No vision models needed |
| DOM compression | Better Playwright | Token efficiency |
| Content search | Better Playwright | Find elements quickly |
| Page management | Better Playwright | Multi-page workflows |
| Profile support | OpenClaw | Chrome extension compatibility |

---

## Tool Definitions

### 1. browser_navigate
Navigate to a URL in the browser.

```typescript
{
  name: 'glinr__browser_navigate',
  description: 'Navigate browser to a URL. Creates new page if needed.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to navigate to' },
      pageId: { type: 'string', description: 'Page ID (creates new if not provided)' },
      waitUntil: {
        type: 'string',
        enum: ['load', 'domcontentloaded', 'networkidle'],
        description: 'When to consider navigation complete'
      },
    },
    required: ['url'],
  },
}
```

### 2. browser_snapshot
Capture accessibility tree of the current page.

```typescript
{
  name: 'glinr__browser_snapshot',
  description: 'Get accessibility tree snapshot of page. Elements have refs like e1, e2 for interaction.',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: { type: 'string', description: 'Page ID to snapshot' },
      compress: { type: 'boolean', default: true, description: 'Apply intelligent DOM compression' },
      interactive: { type: 'boolean', default: true, description: 'Only include interactive elements' },
      selector: { type: 'string', description: 'CSS selector to scope snapshot' },
    },
  },
}
```

### 3. browser_click
Click an element on the page.

```typescript
{
  name: 'glinr__browser_click',
  description: 'Click an element identified by ref from snapshot.',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: { type: 'string', description: 'Page ID' },
      ref: { type: 'string', description: 'Element ref from snapshot (e.g., e5)' },
      element: { type: 'string', description: 'Element description for logging' },
      button: { type: 'string', enum: ['left', 'right', 'middle'], default: 'left' },
      doubleClick: { type: 'boolean', default: false },
      modifiers: { type: 'array', items: { type: 'string' } },
    },
    required: ['ref'],
  },
}
```

### 4. browser_type
Type text into an input field.

```typescript
{
  name: 'glinr__browser_type',
  description: 'Type text into an input element.',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: { type: 'string' },
      ref: { type: 'string', description: 'Element ref from snapshot' },
      text: { type: 'string', description: 'Text to type' },
      clear: { type: 'boolean', default: false, description: 'Clear existing text first' },
      submit: { type: 'boolean', default: false, description: 'Press Enter after typing' },
    },
    required: ['ref', 'text'],
  },
}
```

### 5. browser_search
Search page content with regex patterns.

```typescript
{
  name: 'glinr__browser_search',
  description: 'Search page snapshot for text/pattern. Returns matching elements with refs.',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: { type: 'string' },
      pattern: { type: 'string', description: 'Search pattern (regex supported)' },
      ignoreCase: { type: 'boolean', default: true },
      limit: { type: 'number', default: 20, description: 'Max results' },
    },
    required: ['pattern'],
  },
}
```

### 6. browser_screenshot
Take a screenshot of the page.

```typescript
{
  name: 'glinr__browser_screenshot',
  description: 'Take screenshot of page. Returns base64 image.',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: { type: 'string' },
      fullPage: { type: 'boolean', default: false },
      ref: { type: 'string', description: 'Screenshot specific element' },
      type: { type: 'string', enum: ['png', 'jpeg'], default: 'png' },
    },
  },
}
```

### 7. browser_pages
List all open pages.

```typescript
{
  name: 'glinr__browser_pages',
  description: 'List all open browser pages with their URLs and titles.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
}
```

### 8. browser_close
Close a page or the browser.

```typescript
{
  name: 'glinr__browser_close',
  description: 'Close a specific page or all pages.',
  inputSchema: {
    type: 'object',
    properties: {
      pageId: { type: 'string', description: 'Page to close (closes all if not specified)' },
    },
  },
}
```

---

## DOM Compression Algorithm

From Better Playwright MCP - reduces token usage by 91%:

### 1. List Folding
```yaml
# Before (48 items):
- list "Products" [ref=e3]
  - listitem "Product 1" [ref=e4]
  - listitem "Product 2" [ref=e5]
  # ... 48 more items

# After (compressed):
- list "Products" [ref=e3]
  - listitem "Product 1" [ref=e4]
  - listitem (... and 47 more similar) [refs: e5, e6, ...]
```

### 2. Text Truncation
```yaml
# Before:
- paragraph "This is a very long paragraph that contains detailed information about the product including its features, specifications, and usage instructions..." [ref=e10]

# After:
- paragraph "This is a very long paragraph that contains..." [ref=e10]
```

### 3. Interactive-Only Mode
Only include elements that can be interacted with:
- Buttons, links, inputs
- Checkboxes, radio buttons, selects
- Focusable elements

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GLINR MCP Server                        │
│  src/mcp/server.ts                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Browser Tools                                       │   │
│  │  - glinr__browser_navigate                          │   │
│  │  - glinr__browser_snapshot                          │   │
│  │  - glinr__browser_click                             │   │
│  │  - glinr__browser_type                              │   │
│  │  - glinr__browser_search                            │   │
│  │  - glinr__browser_screenshot                        │   │
│  │  - glinr__browser_pages                             │   │
│  │  - glinr__browser_close                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Browser Service (src/browser/service.ts)           │   │
│  │  - Page management                                   │   │
│  │  - Ref tracking (e1, e2, etc.)                      │   │
│  │  - DOM compression                                   │   │
│  │  - Content search                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Playwright Core                                     │   │
│  │  - playwright-core (no bundled browsers)            │   │
│  │  - Chromium download on first use                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/browser/service.ts` | Browser management, Playwright wrapper |
| `src/browser/snapshot.ts` | Accessibility tree capture |
| `src/browser/compression.ts` | DOM compression algorithm |
| `src/browser/refs.ts` | Element reference tracking |
| `src/browser/search.ts` | Content search with regex |
| `src/browser/types.ts` | TypeScript types |
| `src/mcp/browser-tools.ts` | MCP tool definitions for browser |

---

## Implementation Order

1. **Browser Service** - Core Playwright management
   - Launch/close browser
   - Page management with IDs
   - Element ref tracking

2. **Snapshot & Compression** - Accessibility tree
   - Capture accessibility tree
   - Apply compression (list folding, truncation)
   - Generate element refs

3. **Interaction Tools** - Click, type, etc.
   - Ref to locator resolution
   - Click, type, select, hover
   - Wait utilities

4. **MCP Integration** - Wire to server
   - Add browser tools to MCP server
   - Response formatting
   - Error handling

5. **Content Search** - Find elements
   - Regex search in snapshot
   - Return matching refs

---

## Example Session

```
User: Go to GitHub and search for "playwright"

AI: Let me navigate to GitHub and search for playwright.

[Tool: glinr__browser_navigate]
{url: "https://github.com"}

[Tool: glinr__browser_snapshot]
{}

Response:
- Page URL: https://github.com
- Page Title: GitHub
- Snapshot:
```yaml
- banner [ref=e1]
  - link "GitHub" [ref=e2]
  - textbox "Search or jump to..." [ref=e3]
  - button "Sign in" [ref=e4]
  - button "Sign up" [ref=e5]
- main [ref=e6]
  - heading "Let's build from here" [ref=e7]
```

[Tool: glinr__browser_click]
{ref: "e3", element: "Search input"}

[Tool: glinr__browser_type]
{ref: "e3", text: "playwright", submit: true}

AI: I've navigated to GitHub and searched for "playwright". Let me show you the results...
```

---

## Dependencies

```bash
# Add to package.json
pnpm add playwright-core
```

Using `playwright-core` instead of `playwright` because:
- Smaller package (no bundled browsers)
- Can use system Chrome or download on first use
- Better for server environments

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BROWSER_HEADLESS` | `true` | Run browser in headless mode |
| `BROWSER_TIMEOUT_MS` | `30000` | Default action timeout |
| `BROWSER_MAX_PAGES` | `5` | Max concurrent pages |
| `BROWSER_EXECUTABLE` | auto | Path to browser executable |

---

## Security Considerations

1. **Sandboxing** - Run in headless mode by default
2. **URL Allowlist** - Optional domain restrictions
3. **No Credentials** - Don't store browser passwords
4. **Session Isolation** - Clear cookies between sessions
5. **Resource Limits** - Max pages, timeouts

---

## Future Enhancements

1. **Chrome Extension Relay** - Like OpenClaw, control user's Chrome
2. **Profile Management** - Persistent browser sessions
3. **Network Interception** - Mock APIs, block resources
4. **Visual Regression** - Compare screenshots
5. **Multi-browser Support** - Firefox, WebKit

