/**
 * AI Provider Logo Components
 *
 * Actual brand logos for AI providers.
 * Uses SVG for crisp rendering at any size.
 */

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function AnthropicLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 46 32"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="Anthropic"
    >
      <path d="M32.73 0h-6.945L38.45 32h6.945L32.73 0ZM13.27 0 0 32h7.082l2.79-7.103h13.25l2.79 7.103h7.082L19.727 0h-6.458Zm-.636 18.747 4.323-11.138 4.323 11.138h-8.646Z" />
    </svg>
  );
}

export function OpenAILogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="OpenAI"
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

export function GoogleLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-6 w-6', className)}
      aria-label="Google"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function OpenRouterLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="OpenRouter"
    >
      <path d="M16.778 1.844v1.919q-.569-.026-1.138-.032-.708-.008-1.415.037c-1.93.126-4.023.728-6.149 2.237-2.911 2.066-2.731 1.95-4.14 2.75-.396.223-1.342.574-2.185.798-.841.225-1.753.333-1.751.333v4.229s.768.108 1.61.333c.842.224 1.789.575 2.185.799 1.41.798 1.228.683 4.14 2.75 2.126 1.509 4.22 2.11 6.148 2.236.88.058 1.716.041 2.555.005v1.918l7.222-4.168-7.222-4.17v2.176c-.86.038-1.611.065-2.278.021-1.364-.09-2.417-.357-3.979-1.465-2.244-1.593-2.866-2.027-3.68-2.508.889-.518 1.449-.906 3.822-2.59 1.56-1.109 2.614-1.377 3.978-1.466.667-.044 1.418-.017 2.278.02v2.176L24 6.014Z" />
    </svg>
  );
}

export function OllamaLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="Ollama"
    >
      <path d="M12.002 2C6.479 2 2.002 6.477 2.002 12s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm4.5 14.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-9 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm4.5-3c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

export function AzureLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('h-6 w-6', className)}
      aria-label="Azure"
    >
      <path
        fill="#00ABEC"
        d="M3.65 14.2H16L9.35 2.68 7.33 8.24l3.88 4.63-7.56 1.33zM8.82 1.8L4.07 5.79 0 12.84h3.67v.01L8.82 1.8z"
      />
    </svg>
  );
}

export function GroqLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 210 305"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="Groq"
    >
      <path d="M105.3 0C47.7-.5.5 45.8 0 103.4c-.5 57.6 45.8 104.8 103.4 105.3h36.2v-39.1h-34.3c-36 .4-65.6-28.4-66-64.5-.4-36.1 28.4-65.6 64.5-66h1.5c36 0 65.2 29.2 65.4 65.2v96.1c0 35.7-29.1 64.8-64.7 65.2-17.1-.1-33.4-7-45.4-19.1l-27.7 27.7c19.2 19.3 45.2 30.3 72.4 30.5h1.4c56.9-.8 102.6-47 102.9-103.9v-99.1C208.2 45.2 161.9.1 105.3 0Z" />
    </svg>
  );
}

// xAI (Grok) Logo
export function XAILogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="xAI"
    >
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
}

// Perplexity Logo
export function PerplexityLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="Perplexity"
    >
      <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" />
    </svg>
  );
}

// Mistral Logo - stylized M
export function MistralLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="Mistral"
    >
      <rect x="1" y="3" width="5" height="5" fill="#F7D046"/>
      <rect x="9.5" y="3" width="5" height="5" fill="#F7D046"/>
      <rect x="18" y="3" width="5" height="5" fill="#F7D046"/>
      <rect x="1" y="8" width="5" height="5" fill="#F2A73B"/>
      <rect x="5.5" y="8" width="5" height="5" fill="#F2A73B"/>
      <rect x="13" y="8" width="5" height="5" fill="#F2A73B"/>
      <rect x="18" y="8" width="5" height="5" fill="#F2A73B"/>
      <rect x="1" y="13" width="5" height="5" fill="#EE792F"/>
      <rect x="9.5" y="13" width="5" height="5" fill="#EE792F"/>
      <rect x="18" y="13" width="5" height="5" fill="#EE792F"/>
      <rect x="1" y="16" width="5" height="5" fill="currentColor"/>
      <rect x="18" y="16" width="5" height="5" fill="currentColor"/>
    </svg>
  );
}

// Cohere Logo
export function CohereLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="Cohere"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-10c-1.1 0-2 .9-2 2s.9 2 2 2h4c1.1 0 2-.9 2-2s-.9-2-2-2h-4z" />
    </svg>
  );
}

// DeepSeek Logo
export function DeepSeekLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="DeepSeek"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
    </svg>
  );
}

// Together AI Logo
export function TogetherLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="Together AI"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      <circle cx="17" cy="6" r="2" />
      <circle cx="7" cy="6" r="2" />
    </svg>
  );
}

// Cerebras Logo
export function CerebrasLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="Cerebras"
    >
      <path d="M12 2l10 6v8l-10 6-10-6V8l10-6zm0 2.47L4.5 8.97v6.06L12 19.53l7.5-4.5V8.97L12 4.47z" />
      <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z" />
    </svg>
  );
}

// Fireworks Logo
export function FireworksLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="Fireworks"
    >
      <path d="M12 2l1.5 6L18 5l-3 4.5 6 1.5-6 1.5 3 4.5-4.5-3L12 22l-1.5-6L6 19l3-4.5-6-1.5 6-1.5-3-4.5 4.5 3L12 2z" />
    </svg>
  );
}

// GitHub Copilot logo
export function CopilotLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6', className)}
      aria-label="GitHub Copilot"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577v-2.234c-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.997.108-.776.42-1.305.763-1.605-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.624-5.48 5.92.432.372.816 1.102.816 2.222v3.293c0 .32.218.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z"/>
      <path d="M9.5 15.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5c0-.52-.16-1-.43-1.4l-.07.04c-.35.2-.75.36-1.18.36h-1.64c-.43 0-.83-.16-1.18-.36l-.07-.04c-.27.4-.43.88-.43 1.4z" fill="var(--background)"/>
    </svg>
  );
}

// Provider logo map for easy access
export const PROVIDER_LOGOS: Record<string, React.ComponentType<LogoProps>> = {
  anthropic: AnthropicLogo,
  openai: OpenAILogo,
  google: GoogleLogo,
  azure: AzureLogo,
  groq: GroqLogo,
  openrouter: OpenRouterLogo,
  ollama: OllamaLogo,
  xai: XAILogo,
  grok: XAILogo, // Alias for xAI
  perplexity: PerplexityLogo,
  mistral: MistralLogo,
  cohere: CohereLogo,
  deepseek: DeepSeekLogo,
  together: TogetherLogo,
  cerebras: CerebrasLogo,
  fireworks: FireworksLogo,
  copilot: CopilotLogo, // GitHub Copilot proxy
};

// Get logo component by provider type
export function getProviderLogo(providerType: string) {
  return PROVIDER_LOGOS[providerType.toLowerCase()] || OpenRouterLogo;
}
