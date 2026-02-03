/**
 * Setup Routes
 *
 * Public routes for initial app setup and configuration status.
 * These routes are accessible without authentication to allow
 * first-time setup and configuration checks.
 */

import { Hono } from 'hono';
import { randomUUID, createHash, randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '../storage/index.js';
import { users, userPreferences } from '../storage/schema.js';
import { getSettings, updateSettings, isGitHubOAuthConfigured } from '../settings/index.js';
import { createSession } from '../auth/auth-service.js';

const setup = new Hono();

// =============================================================================
// HELPERS
// =============================================================================

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + useSalt)
    .digest('hex');
  return { hash, salt: useSalt };
}

function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

function hashRecoveryCodes(codes: string[]): string[] {
  return codes.map((code) => {
    const { hash } = hashPassword(code.replace('-', ''));
    return hash;
  });
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /api/setup/status
 * Check if the app is configured (GitHub OAuth, etc.)
 * This is a PUBLIC endpoint - no auth required
 */
setup.get('/status', async (c) => {
  try {
    const settings = await getSettings();
    const db = getDb();

    // Check if GitHub OAuth is configured (either via env or DB)
    const githubConfigured = await isGitHubOAuthConfigured();

    // Check if at least one AI provider is configured
    const aiConfigured = !!(
      settings.aiProvider?.defaultProvider &&
      (settings.aiProvider?.openaiKey ||
        settings.aiProvider?.anthropicKey ||
        settings.aiProvider?.ollamaBaseUrl)
    );

    // Check if there's an admin user
    let hasAdmin = false;
    if (db) {
      const adminUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'))
        .limit(1);
      hasAdmin = adminUsers.length > 0;
    }

    // App is ready if OAuth is configured and admin exists
    const ready = githubConfigured && hasAdmin;

    return c.json({
      configured: githubConfigured,
      isFirstTimeSetup: !ready,
      hasAdmin,
      ready,
      providers: {
        github: githubConfigured,
        jira: !!(process.env.JIRA_CLIENT_ID && process.env.JIRA_CLIENT_SECRET),
        linear: !!(process.env.LINEAR_CLIENT_ID && process.env.LINEAR_CLIENT_SECRET),
      },
      ai: {
        configured: aiConfigured,
        provider: settings.aiProvider?.defaultProvider || null,
      },
    });
  } catch (error) {
    console.error('[Setup] Status check error:', error);
    return c.json({
      configured: false,
      isFirstTimeSetup: true,
      hasAdmin: false,
      ready: false,
      providers: {
        github: false,
        jira: false,
        linear: false,
      },
      ai: {
        configured: false,
        provider: null,
      },
    });
  }
});

/**
 * POST /api/setup/github-oauth/validate
 * Validate GitHub OAuth credentials before saving
 * Tests if the credentials can successfully initiate an OAuth flow
 */
setup.post('/github-oauth/validate', async (c) => {
  try {
    const body = await c.req.json();
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return c.json({
        valid: false,
        error: 'Client ID and Client Secret are required',
      }, 400);
    }

    // Validate Client ID format
    // GitHub OAuth App Client IDs are typically 20 characters alphanumeric
    // GitHub App Client IDs start with "Iv1." or "Ov"
    const clientIdPattern = /^(Iv1\.[a-f0-9]{16}|Ov[a-zA-Z0-9]{18,20}|[a-f0-9]{20})$/i;
    if (!clientIdPattern.test(clientId)) {
      return c.json({
        valid: false,
        error: 'Invalid Client ID format. Please copy the exact Client ID from GitHub.',
        hint: 'OAuth App Client IDs are 20 hex characters. GitHub App Client IDs start with "Iv1."',
      }, 400);
    }

    // Validate Client Secret format
    // GitHub secrets are typically 40 hex characters
    const secretPattern = /^[a-f0-9]{40}$/i;
    if (!secretPattern.test(clientSecret)) {
      return c.json({
        valid: false,
        error: 'Invalid Client Secret format. Please copy the exact secret from GitHub.',
        hint: 'Client Secrets are 40 hex characters. Make sure you copied the full secret.',
      }, 400);
    }

    // Try to verify with GitHub by making a test request
    // We'll use the device flow to check if credentials are valid
    // This endpoint doesn't require a callback but validates the client_id
    try {
      const response = await fetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          scope: 'read:user',
        }),
      });

      const data = await response.json() as { error?: string; error_description?: string };

      if (data.error) {
        // "unauthorized_client" means the client_id is valid but device flow not enabled
        // This is actually a good sign - it means the credentials exist
        if (data.error === 'unauthorized_client') {
          return c.json({
            valid: true,
            message: 'Credentials appear valid. Device flow not enabled (normal for OAuth apps).',
            verified: 'format',
          });
        }

        return c.json({
          valid: false,
          error: data.error_description || data.error,
          hint: 'The Client ID may not exist or may be incorrect.',
        }, 400);
      }

      // If we get a successful response, credentials are valid
      return c.json({
        valid: true,
        message: 'GitHub OAuth credentials verified successfully!',
        verified: 'api',
      });
    } catch (fetchError) {
      // If GitHub API is unreachable, fall back to format validation only
      console.warn('[Setup] Could not verify credentials with GitHub API:', fetchError);
      return c.json({
        valid: true,
        message: 'Credentials format is valid. Could not verify with GitHub API.',
        verified: 'format',
        warning: 'Please ensure you copied the correct credentials from GitHub.',
      });
    }
  } catch (error) {
    console.error('[Setup] GitHub OAuth validation error:', error);
    return c.json({
      valid: false,
      error: 'Validation failed',
    }, 500);
  }
});

/**
 * POST /api/setup/github-oauth
 * Save GitHub OAuth credentials to database
 * Works if not already configured (for first-time setup)
 */
setup.post('/github-oauth', async (c) => {
  try {
    // Check if already configured (either via env or DB)
    const alreadyConfigured = await isGitHubOAuthConfigured();

    if (alreadyConfigured) {
      return c.json(
        { error: 'GitHub OAuth is already configured. Use settings to update.' },
        403
      );
    }

    const body = await c.req.json();
    const { clientId, clientSecret, redirectUri } = body;

    if (!clientId || !clientSecret) {
      return c.json({ error: 'Client ID and Client Secret are required' }, 400);
    }

    // Calculate default redirect URI based on current origin
    const defaultRedirectUri = redirectUri || 'http://localhost:5173/api/auth/github/callback';

    // Save to database settings (persists across restarts)
    await updateSettings({
      oauth: {
        github: {
          clientId,
          clientSecret,
          redirectUri: defaultRedirectUri,
        },
      },
    });

    console.log('[Setup] GitHub OAuth credentials saved to database');

    return c.json({
      success: true,
      message: 'GitHub OAuth configured successfully.',
    });
  } catch (error) {
    console.error('[Setup] GitHub OAuth setup error:', error);
    return c.json({ error: 'Failed to configure GitHub OAuth' }, 500);
  }
});

/**
 * POST /api/setup/admin
 * Create the first admin user
 * Only works if no admin exists yet
 */
setup.post('/admin', async (c) => {
  try {
    const db = getDb();
    if (!db) {
      return c.json({ error: 'Database not initialized' }, 500);
    }

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    if (existingAdmin.length > 0) {
      return c.json(
        { error: 'Admin user already exists. Use password reset to recover access.' },
        403
      );
    }

    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Validate password
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes(8);
    const hashedRecoveryCodes = hashRecoveryCodes(recoveryCodes);

    // Hash password
    const { hash, salt } = hashPassword(password);
    const passwordHash = `${salt}:${hash}`;

    // Create admin user
    const userId = randomUUID();
    const now = new Date();

    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'admin',
      status: 'active',
      recoveryCodes: JSON.stringify(hashedRecoveryCodes),
      createdAt: now,
      updatedAt: now,
    });

    // Create default preferences
    await db.insert(userPreferences).values({
      id: randomUUID(),
      userId,
      updatedAt: now,
    });

    // Create session
    const session = await createSession(userId);

    console.log(`[Setup] Admin user created: ${email}`);

    return c.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name,
        role: 'admin',
      },
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
      },
      // Return recovery codes ONLY ONCE during setup
      recoveryCodes,
      message: 'Admin account created. Save your recovery codes - they will not be shown again!',
    });
  } catch (error) {
    console.error('[Setup] Admin creation error:', error);
    console.error('[Setup] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return c.json({
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

/**
 * POST /api/setup/verify-recovery-code
 * Verify a recovery code (for password reset)
 */
setup.post('/verify-recovery-code', async (c) => {
  try {
    const db = getDb();
    if (!db) {
      return c.json({ error: 'Database not initialized' }, 500);
    }

    const body = await c.req.json();
    const { email, code } = body;

    if (!email || !code) {
      return c.json({ error: 'Email and recovery code are required' }, 400);
    }

    // Find user
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!result.length) {
      return c.json({ error: 'Invalid email or recovery code' }, 401);
    }

    const user = result[0];

    if (!user.recoveryCodes) {
      return c.json({ error: 'No recovery codes configured' }, 400);
    }

    const storedHashes: string[] = JSON.parse(user.recoveryCodes);
    const normalizedCode = code.replace('-', '').toUpperCase();
    const { hash: codeHash } = hashPassword(normalizedCode);

    // Check if code matches any stored hash
    const codeIndex = storedHashes.findIndex((h) => h === codeHash);

    if (codeIndex === -1) {
      return c.json({ error: 'Invalid email or recovery code' }, 401);
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Remove used recovery code
    storedHashes.splice(codeIndex, 1);

    // Update user with reset token and remaining codes
    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpiry,
        recoveryCodes: JSON.stringify(storedHashes),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return c.json({
      success: true,
      resetToken,
      expiresAt: resetExpiry,
      remainingCodes: storedHashes.length,
      message: 'Recovery code verified. Use the reset token to set a new password.',
    });
  } catch (error) {
    console.error('[Setup] Recovery code verification error:', error);
    return c.json({ error: 'Failed to verify recovery code' }, 500);
  }
});

/**
 * POST /api/setup/reset-password
 * Reset password using reset token
 */
setup.post('/reset-password', async (c) => {
  try {
    const db = getDb();
    if (!db) {
      return c.json({ error: 'Database not initialized' }, 500);
    }

    const body = await c.req.json();
    const { resetToken, newPassword } = body;

    if (!resetToken || !newPassword) {
      return c.json({ error: 'Reset token and new password are required' }, 400);
    }

    if (newPassword.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Find user with valid reset token
    const result = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, resetToken))
      .limit(1);

    if (!result.length) {
      return c.json({ error: 'Invalid or expired reset token' }, 401);
    }

    const user = result[0];

    // Check if token expired
    if (user.passwordResetExpires && new Date() > new Date(user.passwordResetExpires)) {
      return c.json({ error: 'Reset token has expired' }, 401);
    }

    // Hash new password
    const { hash, salt } = hashPassword(newPassword);
    const passwordHash = `${salt}:${hash}`;

    // Update password and clear reset token
    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`[Setup] Password reset for user: ${user.email}`);

    return c.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in.',
    });
  } catch (error) {
    console.error('[Setup] Password reset error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

/**
 * GET /api/setup/env-template
 * Get environment variable template for manual setup
 */
setup.get('/env-template', (c) => {
  const template = `# GLINR Task Manager Configuration
# Copy this to .env and fill in your values

# GitHub OAuth (Required for authentication)
# Create at: https://github.com/settings/applications/new
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:5173/api/auth/github/callback

# Optional: Jira OAuth
JIRA_CLIENT_ID=
JIRA_CLIENT_SECRET=

# Optional: Linear OAuth
LINEAR_CLIENT_ID=
LINEAR_CLIENT_SECRET=

# AI Providers (at least one required for chat)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# Database
DATABASE_URL=file:./data/glinr.db

# Server
PORT=3000
NODE_ENV=development
`;

  return c.text(template, 200, {
    'Content-Type': 'text/plain',
  });
});

export { setup as setupRoutes };
