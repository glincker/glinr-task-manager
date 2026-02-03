import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Tasks Table
 */
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  prompt: text('prompt').notNull(),
  status: text('status').notNull().default('pending'),
  priority: integer('priority').notNull().default(3),
  source: text('source').notNull(),
  sourceId: text('source_id'),
  sourceUrl: text('source_url'),
  repository: text('repository'),
  branch: text('branch'),
  labels: text('labels', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  assignedAgent: text('assigned_agent'),
  assignedAgentId: text('assigned_agent_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>().notNull().default(sql`'{}'`),
  result: text('result', { mode: 'json' }).$type<any>(),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
});

/**
 * Summaries Table
 */
export const summaries = sqliteTable('summaries', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id),
  sessionId: text('session_id'),
  agent: text('agent').notNull(),
  model: text('model'),
  title: text('title').notNull(),
  whatChanged: text('what_changed').notNull(),
  whyChanged: text('why_changed'),
  howChanged: text('how_changed'),
  filesChanged: text('files_changed', { mode: 'json' }).$type<any[]>().notNull().default(sql`'[]'`),
  decisions: text('decisions', { mode: 'json' }).$type<any[]>().notNull().default(sql`'[]'`),
  blockers: text('blockers', { mode: 'json' }).$type<any[]>().notNull().default(sql`'[]'`),
  artifacts: text('artifacts', { mode: 'json' }).$type<any[]>().notNull().default(sql`'[]'`),
  tokensUsed: text('tokens_used', { mode: 'json' }).$type<any>(),
  cost: text('cost', { mode: 'json' }).$type<any>(),
  taskType: text('task_type'),
  component: text('component'),
  labels: text('labels', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  linkedIssue: text('linked_issue'),
  linkedPr: text('linked_pr'),
  repository: text('repository'),
  branch: text('branch'),
  rawOutput: text('raw_output'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
});

/**
 * Embeddings Table (for sqlite-vec)
 */
export const embeddings = sqliteTable('embeddings', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(), // 'task' | 'summary'
  entityId: text('entity_id').notNull(),
  embedding: blob('embedding').notNull(), // Float32 vector blob
  model: text('model').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Settings Table - Key-value store for application settings
 */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<any>().notNull(),
  category: text('category').notNull(), // 'appearance' | 'integrations' | 'notifications' | 'system'
  isSecret: integer('is_secret', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * API Tokens Table - For CLI/API authentication
 */
export const apiTokens = sqliteTable('api_tokens', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull(), // Hashed token for security
  scopes: text('scopes', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * GitHub Tokens Table - Store GitHub access tokens for import/sync
 */
export const githubTokens = sqliteTable('github_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default('default'), // Future: real user auth
  accessToken: text('access_token').notNull(),          // Encrypted in production
  tokenType: text('token_type').notNull().default('pat'), // 'pat' | 'oauth'
  scopes: text('scopes'),                               // Comma-separated scopes
  githubUsername: text('github_username'),              // For display
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Task Events Table - Audit log for task lifecycle events
 */
export const taskEvents = sqliteTable('task_events', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id),
  type: text('type').notNull(), // 'created' | 'queued' | 'assigned' | 'started' | 'progress' | 'completed' | 'failed' | 'cancelled' | 'retried'
  agentId: text('agent_id'),
  message: text('message'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Task Archives Table - Archived completed/failed tasks
 */
export const taskArchives = sqliteTable('task_archives', {
  id: text('id').primaryKey(),
  originalId: text('original_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  prompt: text('prompt').notNull(),
  status: text('status').notNull(),
  priority: integer('priority').notNull(),
  source: text('source').notNull(),
  sourceId: text('source_id'),
  sourceUrl: text('source_url'),
  repository: text('repository'),
  branch: text('branch'),
  labels: text('labels', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  assignedAgent: text('assigned_agent'),
  assignedAgentId: text('assigned_agent_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  archivedAt: integer('archived_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  result: text('result', { mode: 'json' }).$type<any>(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  durationMs: integer('duration_ms'), // Pre-computed for analytics
});

// =============================================================================
// TICKET SYSTEM (AI-Native Tickets - Phase 16)
// =============================================================================

/**
 * Tickets Table - AI-native ticket system
 */
export const tickets = sqliteTable('tickets', {
  id: text('id').primaryKey(),
  sequence: integer('sequence').notNull(), // Human-readable: GLINR-123
  workspaceId: text('workspace_id'),
  projectId: text('project_id').references(() => projects.id), // For multi-project support

  // Content
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  descriptionHtml: text('description_html'),

  // Classification
  type: text('type').notNull().default('task'), // task, bug, feature, epic, story, subtask
  priority: text('priority').notNull().default('medium'), // critical, high, medium, low, none
  status: text('status').notNull().default('backlog'), // backlog, todo, in_progress, in_review, done, cancelled
  labels: text('labels', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),

  // Assignment
  assignee: text('assignee'),
  assigneeAgent: text('assignee_agent'), // AI agent: claude, openclaw, ollama

  // Relationships
  parentId: text('parent_id').references((): any => tickets.id),
  linkedPRs: text('linked_prs', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  linkedCommits: text('linked_commits', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  linkedBranch: text('linked_branch'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  dueDate: integer('due_date', { mode: 'timestamp' }),

  // AI Metadata
  createdBy: text('created_by').notNull().default('human'), // human, ai
  aiAgent: text('ai_agent'),
  aiSessionId: text('ai_session_id'),
  aiTaskId: text('ai_task_id').references(() => tasks.id),

  // Estimation
  estimate: integer('estimate'),
  estimateUnit: text('estimate_unit'), // points, hours, days
});

/**
 * External Links Table - 1 ticket -> N external platforms
 */
export const ticketExternalLinks = sqliteTable('ticket_external_links', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull().references(() => tickets.id),
  platform: text('platform').notNull(), // github, linear, jira, plane, monday
  externalId: text('external_id').notNull(), // PROJ-123, LIN-456, #789
  externalUrl: text('external_url'),
  syncEnabled: integer('sync_enabled', { mode: 'boolean' }).notNull().default(true),
  syncDirection: text('sync_direction').notNull().default('bidirectional'), // push, pull, bidirectional
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
  syncError: text('sync_error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Ticket Comments Table - Unified comments from all platforms
 */
export const ticketComments = sqliteTable('ticket_comments', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull().references(() => tickets.id),
  content: text('content').notNull(),
  contentHtml: text('content_html'),

  // Author info
  authorType: text('author_type').notNull().default('human'), // human, ai
  authorName: text('author_name').notNull(),
  authorPlatform: text('author_platform').notNull(), // glinr, github, linear, jira
  authorAvatarUrl: text('author_avatar_url'),

  // Source tracking
  source: text('source').notNull().default('glinr'), // glinr, github, linear, jira, plane
  externalId: text('external_id'), // ID in source system

  // AI response features
  isAiResponse: integer('is_ai_response', { mode: 'boolean' }).notNull().default(false),
  respondingTo: text('responding_to').references((): any => ticketComments.id),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

/**
 * Ticket History Table - Full audit trail
 */
export const ticketHistory = sqliteTable('ticket_history', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull().references(() => tickets.id),
  field: text('field').notNull(), // status, assignee, title, priority, etc.
  oldValue: text('old_value'),
  newValue: text('new_value'),

  // Who made the change
  changedByType: text('changed_by_type').notNull().default('human'), // human, ai
  changedByName: text('changed_by_name').notNull(),
  changedByPlatform: text('changed_by_platform').notNull().default('glinr'),

  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Ticket Sequence Counter - For generating GLINR-123 style IDs
 */
export const ticketSequence = sqliteTable('ticket_sequence', {
  workspaceId: text('workspace_id').primaryKey().default('default'),
  lastSequence: integer('last_sequence').notNull().default(0),
});

// =============================================================================
// PROJECTS & SPRINTS (Phase 17 - Multi-Project Support)
// =============================================================================

/**
 * Projects Table - Multi-project support with custom prefixes
 */
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  sequence: integer('sequence').notNull(),
  workspaceId: text('workspace_id').default('default'),

  // Identity
  key: text('key').notNull().unique(),           // "GLINR", "MOBILE", "API" - ticket prefix
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').default('📋'),
  color: text('color').default('#6366f1'),

  // Settings
  defaultAssignee: text('default_assignee'),
  defaultAgent: text('default_agent'),
  defaultLabels: text('default_labels', { mode: 'json' }).$type<string[]>().default(sql`'[]'`),

  // Features enabled
  cycleView: integer('cycle_view', { mode: 'boolean' }).default(true),
  boardView: integer('board_view', { mode: 'boolean' }).default(true),

  // Metadata
  lead: text('lead'),
  status: text('status').notNull().default('active'), // active, archived

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),
});

/**
 * Project External Links - Sync with Linear Teams, Jira Projects, GitHub Repos
 */
export const projectExternalLinks = sqliteTable('project_external_links', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  platform: text('platform').notNull(), // github, linear, jira, plane
  externalId: text('external_id').notNull(), // Team/Project ID in external system
  externalUrl: text('external_url'),
  syncEnabled: integer('sync_enabled', { mode: 'boolean' }).notNull().default(true),
  syncDirection: text('sync_direction').notNull().default('bidirectional'),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
  syncError: text('sync_error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Project Sequence Counter - For generating PROJECT-1, PROJECT-2 style IDs
 */
export const projectSequence = sqliteTable('project_sequence', {
  workspaceId: text('workspace_id').primaryKey().default('default'),
  lastSequence: integer('last_sequence').notNull().default(0),
});

/**
 * Sprints Table - Time-boxed iterations within projects
 */
export const sprints = sqliteTable('sprints', {
  id: text('id').primaryKey(),
  sequence: integer('sequence').notNull(),       // Sprint 1, Sprint 2, etc.
  projectId: text('project_id').notNull().references(() => projects.id),

  // Content
  name: text('name').notNull(),
  goal: text('goal'),
  description: text('description'),

  // Status: planning -> active -> completed | cancelled
  status: text('status').notNull().default('planning'),

  // Timeline
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),

  // Capacity planning
  capacity: integer('capacity'),                 // Story points

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

/**
 * Sprint Sequence Counter - Per-project sprint numbering
 */
export const sprintSequence = sqliteTable('sprint_sequence', {
  projectId: text('project_id').primaryKey(),
  lastSequence: integer('last_sequence').notNull().default(0),
});

/**
 * Sprint-Ticket Junction Table - N:N relationship
 */
export const sprintTickets = sqliteTable('sprint_tickets', {
  id: text('id').primaryKey(),
  sprintId: text('sprint_id').notNull().references(() => sprints.id),
  ticketId: text('ticket_id').notNull().references(() => tickets.id),
  sortOrder: integer('sort_order').default(0),
  addedAt: integer('added_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// =============================================================================
// USER AUTHENTICATION SYSTEM (Phase 20)
// =============================================================================

/**
 * Users Table - Central user identity
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),

  // Identity
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  passwordHash: text('password_hash'), // null for OAuth-only users

  // Profile
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  timezone: text('timezone').default('UTC'),
  locale: text('locale').default('en'),

  // Role & Status
  role: text('role').notNull().default('user'), // user, admin
  status: text('status').notNull().default('active'), // active, suspended, deleted

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),

  // Onboarding
  onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' }).default(false),

  // Password Recovery
  recoveryCodes: text('recovery_codes'), // JSON array of hashed codes
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: integer('password_reset_expires', { mode: 'timestamp' }),
});

/**
 * OAuth Accounts Table - Link users to OAuth providers
 */
export const oauthAccounts = sqliteTable('oauth_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Provider info
  provider: text('provider').notNull(), // github, google, gitlab
  providerAccountId: text('provider_account_id').notNull(), // GitHub user ID
  providerUsername: text('provider_username'), // @username on platform

  // Tokens
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenType: text('token_type').default('bearer'),
  scope: text('scope'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),

  // Metadata from provider
  providerData: text('provider_data', { mode: 'json' }).$type<Record<string, any>>(),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Sessions Table - User sessions for auth
 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Session token
  token: text('token').notNull().unique(),

  // Device info
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  deviceName: text('device_name'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

/**
 * User Preferences Table - Extended user settings
 */
export const userPreferences = sqliteTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),

  // Appearance
  theme: text('theme').default('system'), // light, dark, system
  accentColor: text('accent_color').default('#6366f1'),
  fontSize: text('font_size').default('medium'), // small, medium, large

  // Notifications
  emailNotifications: integer('email_notifications', { mode: 'boolean' }).default(true),
  pushNotifications: integer('push_notifications', { mode: 'boolean' }).default(true),
  notifyOnMention: integer('notify_on_mention', { mode: 'boolean' }).default(true),
  notifyOnAssign: integer('notify_on_assign', { mode: 'boolean' }).default(true),
  notifyOnComment: integer('notify_on_comment', { mode: 'boolean' }).default(false),

  // AI Preferences
  defaultAgent: text('default_agent').default('claude'),
  aiAutoSuggest: integer('ai_auto_suggest', { mode: 'boolean' }).default(true),
  aiResponseLength: text('ai_response_length').default('balanced'), // brief, balanced, detailed

  // Editor
  editorMode: text('editor_mode').default('markdown'), // markdown, wysiwyg
  tabSize: integer('tab_size').default(2),

  // Extra JSON settings
  extraSettings: text('extra_settings', { mode: 'json' }).$type<Record<string, any>>().default(sql`'{}'`),

  // Timestamps
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * User API Keys Table - For external integrations
 */
export const userApiKeys = sqliteTable('user_api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Key info
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(), // Hashed for security
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for display: glinr_abc12345...

  // Permissions
  scopes: text('scopes', { mode: 'json' }).$type<string[]>().default(sql`'["read"]'`),

  // Usage tracking
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  usageCount: integer('usage_count').default(0),

  // Timestamps
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
});

// =============================================================================
// LABELS SYSTEM (Phase 21 - Labels for GitHub/Linear sync)
// =============================================================================

/**
 * Labels Table - Workspace/Project-scoped labels
 */
export const labels = sqliteTable('labels', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id), // null = workspace-level

  // Content
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#6B7280'),

  // Hierarchy
  parentId: text('parent_id').references((): any => labels.id),

  // Ordering
  sortOrder: integer('sort_order').notNull().default(65535),

  // External sync tracking
  externalSource: text('external_source'), // 'github', 'linear', 'jira'
  externalId: text('external_id'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Ticket Labels Junction Table - N:N relationship
 */
export const ticketLabels = sqliteTable('ticket_labels', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  labelId: text('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' }),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// =============================================================================
// GITHUB SYNC TRACKING (Phase 21 - Complete bidirectional sync)
// =============================================================================

/**
 * GitHub Repository Syncs - Track sync state per repository
 */
export const githubRepositorySyncs = sqliteTable('github_repository_syncs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),

  // GitHub repository info
  repositoryId: integer('repository_id').notNull(),
  repositoryName: text('repository_name').notNull(),
  owner: text('owner').notNull(),
  defaultBranch: text('default_branch').default('main'),

  // Sync configuration
  syncIssues: integer('sync_issues', { mode: 'boolean' }).notNull().default(true),
  syncPRs: integer('sync_prs', { mode: 'boolean' }).notNull().default(false),
  autoLabelId: text('auto_label_id').references(() => labels.id),

  // Sync state
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  lastSyncStatus: text('last_sync_status').notNull().default('idle'), // idle, syncing, success, error
  lastSyncError: text('last_sync_error'),
  itemsSynced: integer('items_synced').notNull().default(0),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * GitHub Comment Syncs - Track comment mapping between GLINR and GitHub
 */
export const githubCommentSyncs = sqliteTable('github_comment_syncs', {
  id: text('id').primaryKey(),

  // Links
  ticketExternalLinkId: text('ticket_external_link_id').notNull().references(() => ticketExternalLinks.id),
  commentId: text('comment_id').notNull().references(() => ticketComments.id),

  // GitHub IDs
  githubCommentId: integer('github_comment_id').notNull(),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
