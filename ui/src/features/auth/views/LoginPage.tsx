/**
 * Login Page
 *
 * Supports email/password and GitHub OAuth.
 * Checks if OAuth is configured before showing GitHub button.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Github, LogIn, AlertCircle, Eye, EyeOff, ArrowRight, Settings, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth, getLastUser, clearLastUser, type LastUser } from '../hooks/useAuth';
import { Logo } from '@/components/shared/Logo';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithGitHub, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [lastUser, setLastUser] = useState<LastUser | null>(null);

  // Load last logged-in user
  useEffect(() => {
    const stored = getLastUser();
    if (stored) {
      setLastUser(stored);
    }
  }, []);

  // Check if GitHub OAuth is configured
  const { data: setupStatus } = useQuery({
    queryKey: ['setup', 'status'],
    queryFn: async () => {
      const res = await fetch('/api/setup/status');
      if (!res.ok) return { configured: false, providers: { github: false } };
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });

  const githubConfigured = setupStatus?.providers?.github ?? false;

  // Check for error from OAuth callback
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        no_code: 'Authentication failed: no code received',
        invalid_state: 'Authentication failed: invalid state',
        auth_failed: 'GitHub authentication failed',
        callback_failed: 'Authentication callback failed',
      };
      setError(errorMessages[errorParam] || 'Authentication failed');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubClick = () => {
    if (!githubConfigured) {
      toast.error('GitHub OAuth is not configured. Please contact your administrator.');
      return;
    }
    loginWithGitHub();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 text-[var(--primary)] animate-pulse" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-pink-500/5 pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 border-[var(--border)] shadow-2xl">
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-[var(--primary)]/10 shadow-[0_0_30px_var(--primary-glow)]">
              <Logo className="h-10 w-10 text-[var(--primary)]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-[var(--muted-foreground)]">
            Sign in to your GLINR account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Continue as last user */}
          {lastUser && !lastUser.email.endsWith('@github.local') && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setEmail(lastUser.email);
                  // Focus the password field
                  setTimeout(() => {
                    document.getElementById('password')?.focus();
                  }, 100);
                }}
                className="w-full flex items-center gap-3 p-3 bg-[var(--accent)]/50 hover:bg-[var(--accent)] rounded-xl border border-[var(--border)] transition-colors text-left group"
              >
                {lastUser.avatarUrl ? (
                  <img
                    src={lastUser.avatarUrl}
                    alt={lastUser.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--primary)]/20"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-pink-500 flex items-center justify-center ring-2 ring-[var(--primary)]/20">
                    <span className="text-sm font-semibold text-white">
                      {lastUser.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--foreground)] truncate">
                    Continue as {lastUser.name}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">
                    {lastUser.email}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearLastUser();
                  setLastUser(null);
                }}
                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-[var(--muted)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors shadow-sm"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* GitHub OAuth - Primary CTA */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full gap-3 h-12 text-base font-medium transition-all",
                githubConfigured
                  ? "hover:bg-[var(--accent)] hover:border-[var(--primary)]/50"
                  : "opacity-60 cursor-not-allowed"
              )}
              onClick={handleGitHubClick}
              disabled={!githubConfigured}
            >
              <Github className="h-5 w-5" />
              Continue with GitHub
              {githubConfigured && <ArrowRight className="h-4 w-4 ml-auto opacity-50" />}
            </Button>
            {!githubConfigured && (
              <button
                onClick={() => navigate('/setup')}
                className="w-full text-xs text-center text-[var(--muted-foreground)] flex items-center justify-center gap-1.5 py-1.5 hover:text-[var(--primary)] transition-colors group"
              >
                <Settings className="h-3 w-3 group-hover:animate-spin" />
                <span>GitHub OAuth not configured.</span>
                <span className="text-[var(--primary)] underline underline-offset-2">Configure now</span>
              </button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--card)] px-3 text-[var(--muted-foreground)] font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={cn(
                  "h-11 transition-all",
                  focusedField === 'email' && "ring-2 ring-[var(--primary)]/20 border-[var(--primary)]"
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className={cn(
                    "h-11 pr-10 transition-all",
                    focusedField === 'password' && "ring-2 ring-[var(--primary)]/20 border-[var(--primary)]"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[var(--primary)] hover:underline font-medium">
              Sign up
            </Link>
          </p>

          {/* Legal Links */}
          <p className="text-center text-xs text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-[var(--primary)] hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[var(--primary)] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
