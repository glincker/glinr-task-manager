/**
 * WhatsApp Provider (Stub)
 *
 * Placeholder implementation for WhatsApp Business API integration.
 * TODO: Implement full WhatsApp Cloud API support.
 */

import { z } from 'zod';
import type {
  ChatProvider,
  WhatsAppAccountConfig,
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

const WhatsAppAccountConfigSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().optional(),
  provider: z.literal('whatsapp'),
  phoneNumberId: z.string().optional(),
  businessAccountId: z.string().optional(),
  accessToken: z.string().optional(),
  webhookVerifyToken: z.string().optional(),
}) satisfies z.ZodType<WhatsAppAccountConfig>;

// =============================================================================
// METADATA
// =============================================================================

const meta: ChatProviderMeta = {
  id: 'whatsapp',
  name: 'WhatsApp',
  description: 'WhatsApp Business API integration for customer communication',
  icon: '📱',
  docsUrl: 'https://developers.facebook.com/docs/whatsapp',
  order: 4,
  color: '#25D366',
};

// =============================================================================
// CAPABILITIES
// =============================================================================

const capabilities: ChatProviderCapabilities = {
  chatTypes: ['direct', 'group'],
  send: true,
  receive: true,
  slashCommands: false, // WhatsApp doesn't have slash commands
  interactiveComponents: true, // Buttons, lists
  reactions: true,
  edit: false, // WhatsApp doesn't support editing
  delete: true, // Can delete within time window
  threads: false,
  media: true,
  richBlocks: true, // Interactive message templates
  oauth: false, // Access token based
  webhooks: true,
  realtime: false, // Webhook only
};

// =============================================================================
// STUB ADAPTERS
// =============================================================================

const outboundAdapter: OutboundAdapter = {
  async send(): Promise<SendResult> {
    return { success: false, error: 'WhatsApp provider not yet implemented' };
  },
};

const inboundAdapter: InboundAdapter = {
  parseMessage(): IncomingMessage | null {
    return null;
  },
  parseCommand(): SlashCommand | null {
    return null; // WhatsApp doesn't have commands
  },
  parseAction(): InteractiveAction | null {
    return null;
  },
  buildCommandResponse(response: CommandResponse): unknown {
    return { text: response.text };
  },
};

const statusAdapter: StatusAdapter = {
  isConfigured(config: WhatsAppAccountConfig): boolean {
    return !!(config.phoneNumberId && config.accessToken);
  },
  async checkHealth() {
    return { connected: false, error: 'WhatsApp provider not yet implemented' };
  },
};

// =============================================================================
// PROVIDER EXPORT
// =============================================================================

export const whatsappProvider: ChatProvider<WhatsAppAccountConfig> = {
  meta,
  capabilities,
  defaultConfig: {
    provider: 'whatsapp',
    enabled: true,
  },
  configSchema: WhatsAppAccountConfigSchema,
  outbound: outboundAdapter,
  inbound: inboundAdapter,
  status: statusAdapter,
};

export { WhatsAppAccountConfigSchema };
export type { WhatsAppAccountConfig };
