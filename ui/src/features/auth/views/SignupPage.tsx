/**
 * Signup Page
 *
 * Create new account with email/password or GitHub.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Github, AlertCircle, Check, Eye, EyeOff, ArrowRight, Sparkles, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '@/components/shared/Logo';

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
  { label: 'Contains a letter', test: (p: string) => /[a-zA-Z]/.test(p) },
];

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, loginWithGitHub, isAuthenticated, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const handleGitHubClick = () => {
    if (!githubConfigured) {
      navigate('/setup');
      return;
    }
    loginWithGitHub();
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    const allPassed = PASSWORD_REQUIREMENTS.every(req => req.test(password));
    if (!allPassed) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, name);
      toast.success('Account created successfully');
      navigate('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = PASSWORD_REQUIREMENTS.filter(req => req.test(password)).length;
  const passwordStrengthPercent = (passwordStrength / PASSWORD_REQUIREMENTS.length) * 100;

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
          <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
          <CardDescription className="text-[var(--muted-foreground)]">
            Get started with GLINR for free
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
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
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="John Doe"
                required
                autoComplete="name"
                className={cn(
                  "h-11 transition-all",
                  focusedField === 'name' && "ring-2 ring-[var(--primary)]/20 border-[var(--primary)]"
                )}
              />
            </div>

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
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
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

              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="space-y-2 mt-3">
                  <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300 rounded-full",
                        passwordStrengthPercent < 50 && "bg-red-500",
                        passwordStrengthPercent >= 50 && passwordStrengthPercent < 100 && "bg-yellow-500",
                        passwordStrengthPercent === 100 && "bg-green-500"
                      )}
                      style={{ width: `${passwordStrengthPercent}%` }}
                    />
                  </div>

                  {/* Password requirements */}
                  <div className="grid grid-cols-1 gap-1">
                    {PASSWORD_REQUIREMENTS.map((req, i) => {
                      const passed = req.test(password);
                      return (
                        <div
                          key={i}
                          className={cn(
                            'flex items-center gap-2 text-xs transition-all',
                            passed ? 'text-green-600' : 'text-[var(--muted-foreground)]'
                          )}
                        >
                          <div className={cn(
                            "h-4 w-4 rounded-full flex items-center justify-center transition-all",
                            passed ? "bg-green-500/20" : "bg-[var(--muted)]"
                          )}>
                            <Check className={cn('h-2.5 w-2.5', passed ? 'opacity-100' : 'opacity-0')} />
                          </div>
                          {req.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2 text-base font-medium mt-2"
              disabled={isLoading || passwordStrengthPercent < 100}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--primary)] hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <p className="text-center text-[11px] text-[var(--muted-foreground)]/70">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-[var(--foreground)]">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline hover:text-[var(--foreground)]">Privacy Policy</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
