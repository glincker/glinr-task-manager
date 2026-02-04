/**
 * Discord Provider (Stub)
 *
 * Placeholder implementation for Discord integration.
 * TODO: Implement full Discord bot support with slash commands.
 */

import { z } from 'zod';
import type {
  ChatProvider,
  DiscordAccountConfig,
  ChatProviderMeta,
  ChatProviderCapabilities,
  OutboundAdapter,
  InboundAdapter,
  StatusAdapter,
  SendResult,
  IncomingMessage,
  SlashCommand,
  InteractiveAction,
  CommandResponse,
} from '../types.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DiscordAccountConfigSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().optional(),
  provider: z.literal('discord'),
  botToken: z.string().optional(),
  applicationId: z.string().optional(),
  publicKey: z.string().optional(),
  guildId: z.string().optional(),
}) satisfies z.ZodType<DiscordAccountConfig>;

// =============================================================================
// METADATA
// =============================================================================

const meta: ChatProviderMeta = {
  id: 'discord',
  name: 'Discord',
  description: 'Discord server integration with slash commands and bot interactions',
  icon: '🎮',
  docsUrl: 'https://discord.com/developers/docs',
  order: 2,
  color: '#5865F2',
};

// =============================================================================
// CAPABILITIES
// =============================================================================

const capabilities: ChatProviderCapabilities = {
  chatTypes: ['direct', 'channel', 'thread'],
  send: true,
  receive: true,
  slashCommands: true,
  interactiveComponents: true,
  reactions: true,
  edit: true,
  delete: true,
  threads: true,
  media: true,
  richBlocks: true, // Embeds
  oauth: true,
  webhooks: true,
  realtime: true, // Gateway
};

// =============================================================================
// STUB ADAPTERS
// =============================================================================

const outboundAdapter: OutboundAdapter = {
  async send(): Promise<SendResult> {
    return { success: false, error: 'Discord provider not yet implemented' };
  },
};

const inboundAdapter: InboundAdapter = {
  parseMessage(): IncomingMessage | null {
    return null;
  },
  parseCommand(): SlashCommand | null {
    return null;
  },
  parseAction(): InteractiveAction | null {
    return null;
  },
  buildCommandResponse(response: CommandResponse): unknown {
    return { type: 4, data: { content: response.text } };
  },
};

const statusAdapter: StatusAdapter = {
  isConfigured(config: DiscordAccountConfig): boolean {
    return !!config.botToken;
  },
  async checkHealth() {
    return { connected: false, error: 'Discord provider not yet implemented' };
  },
};

// =============================================================================
// PROVIDER EXPORT
// =============================================================================

export const discordProvider: ChatProvider<DiscordAccountConfig> = {
  meta,
  capabilities,
  defaultConfig: {
    provider: 'discord',
    enabled: true,
  },
  configSchema: DiscordAccountConfigSchema,
  outbound: outboundAdapter,
  inbound: inboundAdapter,
  status: statusAdapter,
};

export { DiscordAccountConfigSchema };
export type { DiscordAccountConfig };
