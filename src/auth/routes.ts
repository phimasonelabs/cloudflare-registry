import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { GoogleOAuthProvider, GitHubOAuthProvider } from './oauth';
import { JWT } from './jwt';
import { Database } from '../db';
import { Env } from '../types';
import { authMiddleware, dbMiddleware } from './middleware';

const auth = new Hono<{ Bindings: Env }>();

// Apply database middleware to all routes
auth.use('*', dbMiddleware());

// OAuth state management (simple in-memory for now, should use KV in production)
const oauthStates = new Map<string, { provider: string; timestamp: number }>();

// Clean up old states (older than 10 minutes)
function cleanupOAuthStates() {
    const now = Date.now();
    for (const [state, data] of oauthStates.entries()) {
        if (now - data.timestamp > 10 * 60 * 1000) {
            oauthStates.delete(state);
        }
    }
}

// GET /auth/me - Get current user
auth.get('/me', authMiddleware(false), async (c) => {
    const authCtx = c.get('auth');
    if (!authCtx) {
        return c.json({ authenticated: false }, 401);
    }

    return c.json({
        authenticated: true,
        user: {
            id: authCtx.user.id,
            email: authCtx.user.email,
            name: authCtx.user.full_name,
            avatar: authCtx.user.avatar_url
        }
    });
});

// GET /auth/google - Initiate Google OAuth
auth.get('/google', (c) => {
    const redirectUri = `${new URL(c.req.url).origin}/auth/callback/google`;
    const state = crypto.randomUUID();

    cleanupOAuthStates();
    oauthStates.set(state, { provider: 'google', timestamp: Date.now() });

    const provider = new GoogleOAuthProvider(
        c.env.GOOGLE_CLIENT_ID,
        c.env.GOOGLE_CLIENT_SECRET
    );

    const authUrl = provider.getAuthUrl(state, redirectUri);
    return c.redirect(authUrl);
});

// GET /auth/github - Initiate GitHub OAuth
auth.get('/github', (c) => {
    const redirectUri = `${new URL(c.req.url).origin}/auth/callback/github`;
    const state = crypto.randomUUID();

    cleanupOAuthStates();
    oauthStates.set(state, { provider: 'github', timestamp: Date.now() });

    const provider = new GitHubOAuthProvider(
        c.env.GITHUB_CLIENT_ID,
        c.env.GITHUB_CLIENT_SECRET
    );

    const authUrl = provider.getAuthUrl(state, redirectUri);
    return c.redirect(authUrl);
});

// GET /auth/callback/google - Google OAuth callback
auth.get('/callback/google', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');

    if (!code || !state) {
        return c.text('Missing code or state', 400);
    }

    // Verify state
    const storedState = oauthStates.get(state);
    if (!storedState || storedState.provider !== 'google') {
        return c.text('Invalid state', 400);
    }
    oauthStates.delete(state);

    try {
        const redirectUri = `${new URL(c.req.url).origin}/auth/callback/google`;
        const provider = new GoogleOAuthProvider(
            c.env.GOOGLE_CLIENT_ID,
            c.env.GOOGLE_CLIENT_SECRET
        );

        const profile = await provider.getUserProfile(code, redirectUri);
        const token = await handleOAuthCallback(c, profile);

        // Set cookie and redirect to home
        setCookie(c, 'session', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/'
        });

        return c.redirect('/');
    } catch (error) {
        console.error('Google OAuth error:', error);
        return c.html(authErrorHtml('Failed to authenticate with Google. Please try again.'));
    }
});

// GET /auth/callback/github - GitHub OAuth callback
auth.get('/callback/github', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');

    if (!code || !state) {
        return c.text('Missing code or state', 400);
    }

    // Verify state
    const storedState = oauthStates.get(state);
    if (!storedState || storedState.provider !== 'github') {
        return c.text('Invalid state', 400);
    }
    oauthStates.delete(state);

    try {
        const redirectUri = `${new URL(c.req.url).origin}/auth/callback/github`;
        const provider = new GitHubOAuthProvider(
            c.env.GITHUB_CLIENT_ID,
            c.env.GITHUB_CLIENT_SECRET
        );

        const profile = await provider.getUserProfile(code, redirectUri);
        const token = await handleOAuthCallback(c, profile);

        // Set cookie and redirect to home
        setCookie(c, 'session', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/'
        });

        return c.redirect('/');
    } catch (error) {
        console.error('GitHub OAuth error:', error);
        return c.html(authErrorHtml('Failed to authenticate with GitHub. Please try again.'));
    }
});

// POST /auth/logout - Logout
auth.post('/logout', authMiddleware(false), async (c) => {
    const authCtx = c.get('auth');
    if (authCtx) {
        const db = c.get('db');
        const token = c.req.header('cookie')
            ?.split(';')
            .find(c => c.trim().startsWith('session='))
            ?.split('=')[1];

        if (token) {
            await db.deleteSession(token);
        }
    }

    deleteCookie(c, 'session');
    return c.json({ success: true });
});

// Helper function to handle OAuth callbacks
async function handleOAuthCallback(c: any, profile: any): Promise<string> {
    const db: Database = c.get('db');
    const jwt = new JWT(c.env.JWT_SECRET);

    // Find or create user
    let user = await db.getUserByOAuth(profile.provider, profile.providerId);

    if (!user) {
        user = await db.createUser({
            email: profile.email,
            full_name: profile.name,
            avatar_url: profile.avatar,
            oauth_provider: profile.provider,
            oauth_id: profile.providerId
        });
    }

    // Generate JWT token
    const token = await jwt.sign(user.id, user.email);

    // Create session in database
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
    await db.createSession(user.id, token, expiresAt);

    return token;
}

export { auth };
function authErrorHtml(message: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Authentication Failed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {
                background: #0f172a;
                color: #f1f5f9;
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            .card {
                background: #1e293b;
                padding: 2rem;
                border-radius: 1rem;
                border: 1px solid #334155;
                text-align: center;
                max-width: 400px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            }
            h1 { color: #ef4444; margin-bottom: 1rem; }
            p { color: #94a3b8; margin-bottom: 2rem; line-height: 1.5; }
            .btn {
                background: #4f46e5;
                color: white;
                text-decoration: none;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                font-weight: 600;
                transition: background 0.2s;
                display: inline-block;
            }
            .btn:hover { background: #4338ca; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Authentication Failed</h1>
            <p>${message}</p>
            <a href="/" class="btn">Back to Home</a>
        </div>
    </body>
    </html>
    `;
}

