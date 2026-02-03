/**
 * Authentication Routes
 *
 * Handles user authentication:
 * - Email/Password signup & signin
 * - GitHub OAuth login
 * - Session management (logout)
 * - Current user info
 */

import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGitHub,
  validateSession,
  deleteSession,
  getGitHubAuthUrl,
  getUserById,
  updateUser,
  getUserConnectedAccounts,
  getUserGitHubToken,
} from '../auth/auth-service.js';
import {
  redirectToJira,
  handleJiraCallback,
} from '../auth/jira-oauth.js';
import {
  redirectToLinear,
  handleLinearCallback,
} from '../auth/linear-oauth.js';

export const authRoutes = new Hono();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60, // 30 days
  path: '/',
};

// =============================================================================
// EMAIL/PASSWORD AUTH
// =============================================================================

/**
 * POST /api/auth/signup
 * Create new account with email/password
 */
authRoutes.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const result = await signUpWithEmail(email, password, name);

    if (!result.success || !result.session) {
      return c.json({ error: result.error || 'Signup failed' }, 400);
    }

    // Set session cookie
    setCookie(c, 'glinr_session', result.session.token, COOKIE_OPTIONS);

    return c.json({
      user: result.user,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

/**
 * POST /api/auth/login
 * Sign in with email/password
 */
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const result = await signInWithEmail(email, password);

    if (!result.success || !result.session) {
      return c.json({ error: result.error || 'Login failed' }, 401);
    }

    // Set session cookie
    setCookie(c, 'glinr_session', result.session.token, COOKIE_OPTIONS);

    return c.json({
      user: result.user,
      message: 'Logged in successfully',
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

/**
 * POST /api/auth/logout
 * Sign out and invalidate session
 */
authRoutes.post('/logout', async (c) => {
  try {
    const token = getCookie(c, 'glinr_session');

    if (token) {
      await deleteSession(token);
      deleteCookie(c, 'glinr_session', { path: '/' });
    }

    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// =============================================================================
// GITHUB OAUTH
// =============================================================================

/**
 * GET /api/auth/github
 * Redirect to GitHub OAuth
 */
authRoutes.get('/github', async (c) => {
  const state = Math.random().toString(36).substring(7);
  const url = await getGitHubAuthUrl(state);

  if (!url) {
    return c.json({ error: 'GitHub OAuth not configured' }, 500);
  }

  // Store state for CSRF protection (in production, use a more secure method)
  setCookie(c, 'github_oauth_state', state, {
    ...COOKIE_OPTIONS,
    maxAge: 600, // 10 minutes
  });

  return c.redirect(url);
});

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback
 */
authRoutes.get('/github/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const storedState = getCookie(c, 'github_oauth_state');

    // Clean up state cookie
    deleteCookie(c, 'github_oauth_state', { path: '/' });

    if (!code) {
      return c.redirect('/login?error=no_code');
    }

    // CSRF check
    if (state !== storedState) {
      return c.redirect('/login?error=invalid_state');
    }

    const result = await signInWithGitHub(code);

    if (!result.success || !result.session) {
      return c.redirect(`/login?error=${encodeURIComponent(result.error || 'auth_failed')}`);
    }

    // Set session cookie
    setCookie(c, 'glinr_session', result.session.token, COOKIE_OPTIONS);

    // Redirect to dashboard or onboarding
    if (!result.user?.onboardingCompleted) {
      return c.redirect('/onboarding');
    }

    return c.redirect('/');
  } catch (error) {
    console.error('[Auth] GitHub callback error:', error);
    return c.redirect('/login?error=callback_failed');
  }
});

/**
 * GET /api/auth/github/url
 * Get GitHub OAuth URL (for SPA apps)
 */
authRoutes.get('/github/url', async (c) => {
  const state = Math.random().toString(36).substring(7);
  const url = await getGitHubAuthUrl(state);

  if (!url) {
    return c.json({ error: 'GitHub OAuth not configured' }, 500);
  }

  return c.json({ url, state });
});

/**
 * POST /api/auth/github/token
 * Exchange code for session (for SPA apps)
 */
authRoutes.post('/github/token', async (c) => {
  try {
    const body = await c.req.json();
    const { code } = body;

    if (!code) {
      return c.json({ error: 'Code is required' }, 400);
    }

    const result = await signInWithGitHub(code);

    if (!result.success || !result.session) {
      return c.json({ error: result.error || 'Authentication failed' }, 401);
    }

    // Set session cookie
    setCookie(c, 'glinr_session', result.session.token, COOKIE_OPTIONS);

    return c.json({
      user: result.user,
      message: 'Logged in with GitHub successfully',
    });
  } catch (error) {
    console.error('[Auth] GitHub token exchange error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// =============================================================================
// SESSION & USER
// =============================================================================

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
authRoutes.get('/me', async (c) => {
  try {
    const token = getCookie(c, 'glinr_session');

    if (!token) {
      return c.json({ authenticated: false }, 401);
    }

    const user = await validateSession(token);

    if (!user) {
      deleteCookie(c, 'glinr_session', { path: '/' });
      return c.json({ authenticated: false }, 401);
    }

    // Get connected accounts
    const connectedAccounts = await getUserConnectedAccounts(user.id);

    // Check if has GitHub token
    const hasGitHubToken = !!(await getUserGitHubToken(user.id));

    return c.json({
      authenticated: true,
      user: {
        ...user,
        connectedAccounts,
        hasGitHubToken,
      },
    });
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    return c.json({ authenticated: false }, 500);
  }
});

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
authRoutes.patch('/me', async (c) => {
  try {
    const token = getCookie(c, 'glinr_session');

    if (!token) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    const user = await validateSession(token);

    if (!user) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const body = await c.req.json();
    const { name, avatarUrl, bio, timezone, locale, onboardingCompleted } = body;

    const updatedUser = await updateUser(user.id, {
      name,
      avatarUrl,
      bio,
      timezone,
      locale,
      onboardingCompleted,
    });

    return c.json({ user: updatedUser });
  } catch (error) {
    console.error('[Auth] Update user error:', error);
    return c.json({ error: 'Update failed' }, 500);
  }
});

// =============================================================================
// OTHER OAUTH PROVIDERS (preserved from original)
// =============================================================================

// Jira OAuth
authRoutes.get('/jira', (c) => redirectToJira(c));
authRoutes.get('/jira/callback', (c) => handleJiraCallback(c));

// Linear OAuth
authRoutes.get('/linear', (c) => redirectToLinear(c));
authRoutes.get('/linear/callback', (c) => handleLinearCallback(c));
