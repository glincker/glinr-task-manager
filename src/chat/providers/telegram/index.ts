/**
 * Telegram Provider (Stub)
 *
 * Placeholder implementation for Telegram Bot integration.
 * TODO: Implement full Telegram bot support with commands.
 */

import { z } from 'zod';
import type {
  ChatProvider,
  TelegramAccountConfig,
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

const TelegramAccountConfigSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().optional(),
  provider: z.literal('telegram'),
  botToken: z.string().optional(),
  webhookUrl: z.string().optional(),
  webhookSecret: z.string().optional(),
}) satisfies z.ZodType<TelegramAccountConfig>;

// =============================================================================
// METADATA
// =============================================================================

const meta: ChatProviderMeta = {
  id: 'telegram',
  name: 'Telegram',
  description: 'Telegram Bot integration with commands and inline keyboards',
  icon: '✈️',
  docsUrl: 'https://core.telegram.org/bots/api',
  order: 3,
  color: '#0088CC',
};

// =============================================================================
// CAPABILITIES
// =============================================================================

const capabilities: ChatProviderCapabilities = {
  chatTypes: ['direct', 'group', 'channel'],
  send: true,
  receive: true,
  slashCommands: true, // Bot commands
  interactiveComponents: true, // Inline keyboards
  reactions: true,
  edit: true,
  delete: true,
  threads: false, // Telegram uses reply-to
  media: true,
  richBlocks: false, // Uses HTML/Markdown formatting
  oauth: false, // Bot token based
  webhooks: true,
  realtime: true, // Long polling
};

// =============================================================================
// STUB ADAPTERS
// =============================================================================

const outboundAdapter: OutboundAdapter = {
  async send(): Promise<SendResult> {
    return { success: false, error: 'Telegram provider not yet implemented' };
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
    return { text: response.text };
  },
};

const statusAdapter: StatusAdapter = {
  isConfigured(config: TelegramAccountConfig): boolean {
    return !!config.botToken;
  },
  async checkHealth() {
    return { connected: false, error: 'Telegram provider not yet implemented' };
  },
};

// =============================================================================
// PROVIDER EXPORT
// =============================================================================

export const telegramProvider: ChatProvider<TelegramAccountConfig> = {
  meta,
  capabilities,
  defaultConfig: {
    provider: 'telegram',
    enabled: true,
  },
  configSchema: TelegramAccountConfigSchema,
  outbound: outboundAdapter,
  inbound: inboundAdapter,
  status: statusAdapter,
};

export { TelegramAccountConfigSchema };
export type { TelegramAccountConfig };
