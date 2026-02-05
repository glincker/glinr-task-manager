/**
 * Messaging Section
 *
 * Configure messaging integrations:
 * - Telegram Bot
 * - Discord Bot
 * - WhatsApp Business
 * - Slack (links to existing integration)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  Send,
  Link2,
  Unlink,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SettingsCard } from '../components';
import { API_BASE } from '../constants';
import {
  TelegramLogo,
  DiscordLogo,
  WhatsAppLogo,
  SlackLogo,
} from '@/components/shared/ProviderLogos';

// =============================================================================
// TYPES
// =============================================================================

type MessagingProvider = 'telegram' | 'discord' | 'whatsapp' | 'slack';

interface ProviderInfo {
  id: MessagingProvider;
  name: string;
  description: string;
  Logo: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  docsUrl: string;
  setupUrl: string;
  status: 'available' | 'coming-soon' | 'external';
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Bot API with commands & inline keyboards',
    Logo: TelegramLogo,
    color: 'text-[#0088CC]',
    bgColor: 'bg-[#0088CC]/10',
    docsUrl: 'https://core.telegram.org/bots/api',
    setupUrl: 'https://t.me/BotFather',
    status: 'available',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Slash commands & interactions',
    Logo: DiscordLogo,
    color: 'text-[#5865F2]',
    bgColor: 'bg-[#5865F2]/10',
    docsUrl: 'https://discord.com/developers/docs',
    setupUrl: 'https://discord.com/developers/applications',
    status: 'available',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Business Cloud API',
    Logo: WhatsAppLogo,
    color: 'text-[#25D366]',
    bgColor: 'bg-[#25D366]/10',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp',
    setupUrl: 'https://business.facebook.com/wa/manage/',
    status: 'available',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Configured in Integrations',
    Logo: SlackLogo,
    color: 'text-[#4A154B]',
    bgColor: 'bg-[#4A154B]/10',
    docsUrl: 'https://api.slack.com/',
    setupUrl: 'https://api.slack.com/apps',
    status: 'external',
  },
];

interface TelegramStatus {
  configured: boolean;
  connected: boolean;
  latencyMs?: number;
  error?: string;
  bot?: {
    id: number;
    username: string;
    name: string;
  };
  allowlists?: {
    users: number;
    chats: number;
  };
}

interface WebhookInfo {
  url: string | null;
  pendingUpdateCount: number;
  hasCustomCertificate: boolean;
  lastError?: {
    date: number;
    message: string;
  } | null;
}

interface WhatsAppStatus {
  configured: boolean;
  connected: boolean;
  latencyMs?: number;
  error?: string;
  phone?: {
    verifiedName: string;
    displayPhoneNumber: string;
    qualityRating: string;
  };
  allowlist?: {
    phones: number;
  };
}

interface DiscordStatus {
  configured: boolean;
  connected: boolean;
  latencyMs?: number;
  error?: string;
  bot?: {
    id: string;
    username: string;
    discriminator: string;
    verified: boolean;
  };
  allowlists?: {
    guilds: number;
    channels: number;
    roles: number;
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MessagingSection() {
  const [activeProvider, setActiveProvider] = useState<MessagingProvider>('telegram');

  return (
    <div className="space-y-6">
      {/* Provider Tabs */}
      <div className="flex flex-wrap gap-2">
        {PROVIDERS.map((provider) => {
          const Logo = provider.Logo;
          const isActive = activeProvider === provider.id;
          const isExternal = provider.status === 'external';
          const isComingSoon = provider.status === 'coming-soon';

          return (
            <button
              key={provider.id}
              onClick={() => !isExternal && setActiveProvider(provider.id)}
              disabled={isExternal}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all',
                isActive && !isExternal
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50',
                isExternal && 'opacity-60 cursor-default',
                isComingSoon && 'opacity-80'
              )}
            >
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', provider.bgColor)}>
                <Logo className={cn('h-4 w-4', provider.color)} />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{provider.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {isComingSoon ? 'Coming soon' : isExternal ? 'See Integrations' : 'Configure'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Provider Content */}
      {activeProvider === 'telegram' && <TelegramConfig />}
      {activeProvider === 'discord' && <DiscordConfig />}
      {activeProvider === 'whatsapp' && <WhatsAppConfig />}
    </div>
  );
}

// =============================================================================
// TELEGRAM CONFIG
// =============================================================================

function TelegramConfig() {
  const queryClient = useQueryClient();
  const [showToken, setShowToken] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testChatId, setTestChatId] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from GLINR!');

  // Fetch Telegram status
  const { data: status, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery<TelegramStatus>({
    queryKey: ['telegram-status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/telegram/status`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch Telegram status');
      return res.json();
    },
    staleTime: 30000,
  });

  // Fetch webhook info
  const { data: webhookInfo, refetch: refetchWebhook } = useQuery<WebhookInfo>({
    queryKey: ['telegram-webhook'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/telegram/webhook`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch webhook info');
      return res.json();
    },
    staleTime: 30000,
    enabled: !!status?.configured,
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (botToken: string) => {
      const res = await fetch(`${API_BASE}/api/telegram/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ botToken }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save config');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Telegram bot configured!', {
        description: `Connected as @${data.account.botUsername}`,
      });
      setTokenInput('');
      if (data.webhookSecret) {
        navigator.clipboard.writeText(data.webhookSecret);
        toast.info('Webhook secret copied to clipboard');
      }
      queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
    },
    onError: (error) => {
      toast.error('Failed to configure Telegram', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Set webhook mutation
  const setWebhookMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch(`${API_BASE}/api/telegram/set-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to set webhook');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Webhook configured!');
      setWebhookUrl('');
      if (data.secretToken) {
        navigator.clipboard.writeText(data.secretToken);
        toast.info('Secret token copied to clipboard');
      }
      queryClient.invalidateQueries({ queryKey: ['telegram-webhook'] });
    },
    onError: (error) => {
      toast.error('Failed to set webhook', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/telegram/webhook`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete webhook');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Webhook removed');
      queryClient.invalidateQueries({ queryKey: ['telegram-webhook'] });
    },
    onError: (error) => {
      toast.error('Failed to remove webhook', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Test message mutation
  const testMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/telegram/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ chat_id: testChatId, text: testMessage }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Test message sent!');
    },
    onError: (error) => {
      toast.error('Failed to send message', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const handleRefreshAll = () => {
    refetchStatus();
    refetchWebhook();
  };

  return (
    <>
      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-muted-foreground">
          <p>
            Telegram is a trademark of Telegram FZC. This integration uses the official{' '}
            <a href="https://core.telegram.org/bots/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Telegram Bot API
            </a>. Your bot token is stored securely and never shared.
          </p>
        </div>
      </div>

      <SettingsCard
        title="Telegram Bot"
        description="Connect your Telegram bot for messaging and commands"
      >
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-start gap-4">
            <div className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center',
              status?.connected ? 'bg-[#0088CC]/10' : 'bg-muted'
            )}>
              <TelegramLogo className={cn(
                'h-6 w-6',
                status?.connected ? 'text-[#0088CC]' : 'text-muted-foreground'
              )} />
            </div>

            <div className="flex-1 min-w-0">
              {isLoadingStatus ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Checking connection...</span>
                </div>
              ) : status?.connected ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">@{status.bot?.username}</span>
                    {status.latencyMs && (
                      <span className="text-xs text-muted-foreground">({status.latencyMs}ms)</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{status.bot?.name}</p>

                  {status.allowlists && (status.allowlists.users > 0 || status.allowlists.chats > 0) && (
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                      <span>
                        {status.allowlists.users > 0 && `${status.allowlists.users} allowed users`}
                        {status.allowlists.users > 0 && status.allowlists.chats > 0 && ', '}
                        {status.allowlists.chats > 0 && `${status.allowlists.chats} allowed chats`}
                      </span>
                    </div>
                  )}
                </>
              ) : status?.configured ? (
                <>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">Configured but not connected</span>
                  </div>
                  {status.error && <p className="text-xs text-red-500 mt-1">{status.error}</p>}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Not configured</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a bot via{' '}
                    <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      @BotFather
                    </a>{' '}
                    to get started
                  </p>
                </>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={handleRefreshAll} disabled={isLoadingStatus} className="h-8 w-8 p-0">
              <RefreshCw className={cn('h-4 w-4', isLoadingStatus && 'animate-spin')} />
            </Button>
          </div>

          {/* Bot Token Configuration */}
          {!status?.connected && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Bot Token</p>
                  <p className="text-xs text-muted-foreground">From @BotFather</p>
                </div>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Open BotFather <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showToken ? 'text' : 'password'}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="123456789:ABCdefGHI..."
                    className="font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={() => saveConfigMutation.mutate(tokenInput.trim())} disabled={!tokenInput.trim() || saveConfigMutation.isPending}>
                  {saveConfigMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Webhook Configuration */}
      {status?.connected && (
        <SettingsCard title="Webhook" description="Configure how GLINR receives messages">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Link2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                {webhookInfo?.url ? (
                  <>
                    <p className="text-sm font-medium">Webhook Active</p>
                    <p className="text-xs text-muted-foreground truncate font-mono">{webhookInfo.url}</p>
                    {webhookInfo.pendingUpdateCount > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">{webhookInfo.pendingUpdateCount} pending updates</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">No Webhook Set</p>
                    <p className="text-xs text-muted-foreground">Set a webhook URL to receive messages</p>
                  </>
                )}
              </div>
              {webhookInfo?.url && (
                <Button variant="ghost" size="sm" onClick={() => deleteWebhookMutation.mutate()} disabled={deleteWebhookMutation.isPending} className="text-red-500 hover:text-red-600">
                  {deleteWebhookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook URL</label>
              <div className="flex items-center gap-2">
                <Input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-domain.com/api/telegram/webhook" />
                <Button onClick={() => setWebhookMutation.mutate(webhookUrl.trim())} disabled={!webhookUrl.trim() || setWebhookMutation.isPending}>
                  {setWebhookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set'}
                </Button>
              </div>
            </div>
          </div>
        </SettingsCard>
      )}

      {/* Test Message */}
      {status?.connected && (
        <SettingsCard title="Test Message" description="Verify the connection works">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chat ID</label>
                <Input type="text" value={testChatId} onChange={(e) => setTestChatId(e.target.value)} placeholder="-100123456789" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Input type="text" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="Hello from GLINR!" />
              </div>
            </div>
            <Button onClick={() => testMessageMutation.mutate()} disabled={!testChatId.trim() || !testMessage.trim() || testMessageMutation.isPending}>
              {testMessageMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Test Message
            </Button>
          </div>
        </SettingsCard>
      )}
    </>
  );
}

// =============================================================================
// DISCORD CONFIG (Coming Soon)
// =============================================================================

function DiscordConfig() {
  const queryClient = useQueryClient();
  const [showToken, setShowToken] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [appIdInput, setAppIdInput] = useState('');
  const [publicKeyInput, setPublicKeyInput] = useState('');
  const [testChannelId, setTestChannelId] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from GLINR!');

  // Fetch Discord status
  const { data: status, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery<DiscordStatus>({
    queryKey: ['discord-status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/discord/status`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch Discord status');
      return res.json();
    },
    staleTime: 30000,
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (config: { botToken: string; applicationId: string; publicKey: string }) => {
      const res = await fetch(`${API_BASE}/api/discord/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save config');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Discord bot configured!', {
        description: `Connected as ${data.account.botUsername}`,
      });
      setTokenInput('');
      setAppIdInput('');
      setPublicKeyInput('');
      queryClient.invalidateQueries({ queryKey: ['discord-status'] });
    },
    onError: (error) => {
      toast.error('Failed to configure Discord', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Test message mutation
  const sendTestMutation = useMutation({
    mutationFn: async ({ channelId, text }: { channelId: string; text: string }) => {
      const res = await fetch(`${API_BASE}/api/discord/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ channel_id: channelId, text }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Test message sent!');
    },
    onError: (error) => {
      toast.error('Failed to send message', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Get OAuth URL
  const getOAuthUrl = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/discord/oauth/url`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to get OAuth URL');
      const data = await res.json();
      window.open(data.url, '_blank');
    } catch (error) {
      toast.error('Failed to get OAuth URL');
    }
  };

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-sm">
        <Info className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="text-muted-foreground">
          <p>
            Create a Discord application at the{' '}
            <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Developer Portal
            </a>
            . You'll need the Bot Token, Application ID, and Public Key.
          </p>
        </div>
      </div>

      {/* Status Card */}
      <SettingsCard title="Connection Status" description="Current Discord bot status">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center',
              status?.connected ? 'bg-green-500/10' : 'bg-muted'
            )}>
              {isLoadingStatus ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : status?.connected ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : status?.configured ? (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {status?.connected
                  ? `Connected as ${status.bot?.username}`
                  : status?.configured
                  ? 'Configuration error'
                  : 'Not configured'}
              </p>
              {status?.connected && status.latencyMs && (
                <p className="text-sm text-muted-foreground">
                  Latency: {status.latencyMs}ms
                </p>
              )}
              {status?.error && (
                <p className="text-sm text-red-500">{status.error}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetchStatus()}>
            <RefreshCw className={cn('h-4 w-4', isLoadingStatus && 'animate-spin')} />
          </Button>
        </div>

        {status?.connected && status.allowlists && (
          <div className="mt-4 pt-4 border-t flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {status.allowlists.guilds} guilds, {status.allowlists.channels} channels, {status.allowlists.roles} roles allowed
              </span>
            </div>
          </div>
        )}
      </SettingsCard>

      {/* Configuration */}
      <SettingsCard title="Bot Configuration" description="Enter your Discord bot credentials">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Application ID</label>
            <Input
              type="text"
              placeholder="e.g., 1234567890123456789"
              value={appIdInput}
              onChange={(e) => setAppIdInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Found in General Information on the Developer Portal
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Public Key</label>
            <Input
              type="text"
              placeholder="Hex string from Developer Portal"
              value={publicKeyInput}
              onChange={(e) => setPublicKeyInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used for Ed25519 signature verification
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Bot Token</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showToken ? 'text' : 'password'}
                  placeholder="Your bot token from Discord"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                onClick={() => saveConfigMutation.mutate({
                  botToken: tokenInput,
                  applicationId: appIdInput,
                  publicKey: publicKeyInput,
                })}
                disabled={!tokenInput || !appIdInput || !publicKeyInput || saveConfigMutation.isPending}
              >
                {saveConfigMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Interactions Endpoint */}
      {status?.configured && (
        <SettingsCard title="Interactions Endpoint" description="Configure this URL in your Discord application">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Interactions Endpoint URL</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/api/discord/interactions`}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/discord/interactions`);
                    toast.success('URL copied!');
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paste this in your Discord application's "Interactions Endpoint URL" setting
              </p>
            </div>

            <Button variant="outline" onClick={getOAuthUrl}>
              Add Bot to Server <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </SettingsCard>
      )}

      {/* Test Message */}
      {status?.connected && (
        <SettingsCard title="Test Message" description="Send a test message to a channel">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Channel ID</label>
              <Input
                type="text"
                placeholder="e.g., 1234567890123456789"
                value={testChannelId}
                onChange={(e) => setTestChannelId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Right-click a channel → Copy Channel ID (enable Developer Mode in Discord settings)
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message</label>
              <Input
                type="text"
                placeholder="Hello from GLINR!"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>
            <Button
              onClick={() => sendTestMutation.mutate({ channelId: testChannelId, text: testMessage })}
              disabled={!testChannelId || !testMessage || sendTestMutation.isPending}
            >
              {sendTestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Test Message
            </Button>
          </div>
        </SettingsCard>
      )}

      {/* Resources */}
      <SettingsCard title="Resources" description="Helpful links for Discord bot setup">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">
              Developer Portal <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://discord.com/developers/docs/interactions/application-commands" target="_blank" rel="noopener noreferrer">
              Slash Commands Docs <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://discord.com/developers/docs/interactions/receiving-and-responding" target="_blank" rel="noopener noreferrer">
              Interactions Docs <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </SettingsCard>
    </>
  );
}

// =============================================================================
// WHATSAPP CONFIG
// =============================================================================

function WhatsAppConfig() {
  const queryClient = useQueryClient();
  const [showToken, setShowToken] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from GLINR!');

  // Fetch WhatsApp status
  const { data: status, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery<WhatsAppStatus>({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp/status`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
      return res.json();
    },
    staleTime: 30000,
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (data: { phoneNumberId: string; accessToken: string; appSecret?: string }) => {
      const res = await fetch(`${API_BASE}/api/whatsapp/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save config');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('WhatsApp configured!', {
        description: data.account.phoneNumber ? `Connected as ${data.account.phoneNumber}` : 'Connected successfully',
      });
      setPhoneNumberId('');
      setAccessToken('');
      setAppSecret('');
      if (data.webhookVerifyToken) {
        navigator.clipboard.writeText(data.webhookVerifyToken);
        toast.info('Webhook verify token copied to clipboard');
      }
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
    onError: (error) => {
      toast.error('Failed to configure WhatsApp', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Test message mutation
  const testMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/whatsapp/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to: testPhone, text: testMessage }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Test message sent!');
    },
    onError: (error) => {
      toast.error('Failed to send message', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const handleSaveConfig = () => {
    saveConfigMutation.mutate({
      phoneNumberId: phoneNumberId.trim(),
      accessToken: accessToken.trim(),
      appSecret: appSecret.trim() || undefined,
    });
  };

  return (
    <>
      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-sm">
        <Info className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
        <div className="text-muted-foreground">
          <p>
            WhatsApp is a trademark of Meta Platforms Inc. This integration uses the official{' '}
            <a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              WhatsApp Business Cloud API
            </a>. Your credentials are stored securely and never shared.
          </p>
        </div>
      </div>

      <SettingsCard
        title="WhatsApp Business"
        description="Connect your WhatsApp Business account for messaging"
      >
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-start gap-4">
            <div className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center',
              status?.connected ? 'bg-[#25D366]/10' : 'bg-muted'
            )}>
              <WhatsAppLogo className={cn(
                'h-6 w-6',
                status?.connected ? 'text-[#25D366]' : 'text-muted-foreground'
              )} />
            </div>

            <div className="flex-1 min-w-0">
              {isLoadingStatus ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Checking connection...</span>
                </div>
              ) : status?.connected ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{status.phone?.displayPhoneNumber}</span>
                    {status.latencyMs && (
                      <span className="text-xs text-muted-foreground">({status.latencyMs}ms)</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{status.phone?.verifiedName}</p>
                  {status.phone?.qualityRating && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Quality: {status.phone.qualityRating}
                    </p>
                  )}

                  {status.allowlist && status.allowlist.phones > 0 && (
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                      <span>{status.allowlist.phones} allowed phone numbers</span>
                    </div>
                  )}
                </>
              ) : status?.configured ? (
                <>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">Configured but not connected</span>
                  </div>
                  {status.error && <p className="text-xs text-red-500 mt-1">{status.error}</p>}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Not configured</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set up via{' '}
                    <a href="https://business.facebook.com/wa/manage/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Meta Business Suite
                    </a>{' '}
                    to get started
                  </p>
                </>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={() => refetchStatus()} disabled={isLoadingStatus} className="h-8 w-8 p-0">
              <RefreshCw className={cn('h-4 w-4', isLoadingStatus && 'animate-spin')} />
            </Button>
          </div>

          {/* Configuration Form */}
          {!status?.connected && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">API Credentials</p>
                  <p className="text-xs text-muted-foreground">From Meta Business Suite</p>
                </div>
                <a
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Setup Guide <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone Number ID</label>
                  <Input
                    type="text"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="1234567890..."
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Access Token</label>
                  <div className="relative">
                    <Input
                      type={showToken ? 'text' : 'password'}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="EAAxxxxxxxxx..."
                      className="font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    App Secret <span className="text-muted-foreground font-normal">(for webhook verification)</span>
                  </label>
                  <Input
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    placeholder="Optional but recommended"
                    className="font-mono"
                  />
                </div>

                <Button
                  onClick={handleSaveConfig}
                  disabled={!phoneNumberId.trim() || !accessToken.trim() || saveConfigMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {saveConfigMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Connect
                </Button>
              </div>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Webhook Info */}
      {status?.connected && (
        <SettingsCard title="Webhook Configuration" description="Configure Meta webhook for receiving messages">
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <p className="text-sm font-medium">Webhook URL</p>
              <code className="text-xs font-mono text-muted-foreground block break-all">
                {window.location.origin}/api/whatsapp/webhook
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Add this URL in your{' '}
              <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Meta App Dashboard
              </a>{' '}
              under WhatsApp {'>'} Configuration {'>'} Webhook. Subscribe to the &quot;messages&quot; field.
            </p>
          </div>
        </SettingsCard>
      )}

      {/* Test Message */}
      {status?.connected && (
        <SettingsCard title="Test Message" description="Verify the connection works">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Hello from GLINR!"
                />
              </div>
            </div>
            <Button
              onClick={() => testMessageMutation.mutate()}
              disabled={!testPhone.trim() || !testMessage.trim() || testMessageMutation.isPending}
            >
              {testMessageMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Test Message
            </Button>
          </div>
        </SettingsCard>
      )}
    </>
  );
}
