import { Context, Next } from 'hono';
import { Database } from '../db';
import { JWT } from './jwt';
import { Env, AuthContext } from '../types';

// Extend Hono context with auth
declare module 'hono' {
    interface ContextVariableMap {
        auth?: AuthContext & { scopes?: string[] };
        db: Database;
    }
}

// Middleware to inject database
export function dbMiddleware() {
    return async (c: Context<{ Bindings: Env }>, next: Next) => {
        c.set('db', new Database(c.env.DB));
        await next();
    };
}

// Middleware to authenticate requests
export function authMiddleware(required: boolean = true) {
    return async (c: Context<{ Bindings: Env }>, next: Next) => {
        const db = c.get('db');
        const jwt = new JWT(c.env.JWT_SECRET);

        // Try to get token from cookie or Authorization header
        let token: string | null = null;

        // 1. Check cookie (for web UI)
        const cookieToken = c.req.header('cookie')
            ?.split(';')
            .find(c => c.trim().startsWith('session='))
            ?.split('=')[1];

        if (cookieToken) {
            token = cookieToken;
        }

        // 2. Check Authorization header (for Docker CLI - Basic Auth or Bearer)
        const authHeader = c.req.header('authorization');
        if (authHeader) {
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            } else if (authHeader.startsWith('Basic ')) {
                // Docker uses Basic Auth - extract token from password field
                const base64 = authHeader.substring(6);
                const decoded = atob(base64);
                const [_, password] = decoded.split(':', 2);
                token = password; // Docker passes token as password
            }
        }

        if (!token) {
            if (required) {
                return c.json({ error: 'Unauthorized' }, 401);
            }
            await next();
            return;
        }

        // Check if token is a PAT (starts with 'cfr_' prefix)
        if (token.startsWith('cfr_')) {
            const patValidation = await db.validatePAT(token);
            if (!patValidation) {
                if (required) {
                    return c.json({ error: 'Invalid or expired token' }, 401);
                }
                await next();
                return;
            }

            // Set auth context with PAT user
            c.set('auth', { user: patValidation.user, sessionId: 'pat', scopes: patValidation.scopes });
            await next();
            return;
        }

        // Otherwise, validate as JWT session token
        const payload = await jwt.verify(token);
        if (!payload) {
            if (required) {
                return c.json({ error: 'Invalid or expired token' }, 401);
            }
            await next();
            return;
        }

        // Get session from database
        const session = await db.getSessionByToken(token);
        if (!session) {
            if (required) {
                return c.json({ error: 'Session not found' }, 401);
            }
            await next();
            return;
        }

        // Get user
        const user = await db.getUserById(session.user_id);
        if (!user) {
            if (required) {
                return c.json({ error: 'User not found' }, 401);
            }
            await next();
            return;
        }

        // Set auth context
        c.set('auth', { user, sessionId: session.id });
        await next();
    };
}

// Middleware to check repository permissions
export function requirePermission(permission: 'read' | 'write' | 'owner') {
    return async (c: Context<{ Bindings: Env }>, next: Next) => {
        const auth = c.get('auth');
        if (!auth) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const db = c.get('db');
        const repoName = c.req.param('name');

        if (!repoName) {
            return c.json({ error: 'Repository name required' }, 400);
        }

        const userPerm = await db.getUserPermission(repoName, auth.user.id);

        // Calculate permission hierarchy: owner > write > read
        const permLevels = { read: 1, write: 2, owner: 3 };
        const requiredLevel = permLevels[permission];
        const userLevel = userPerm ? permLevels[userPerm] : 0;

        if (userLevel >= requiredLevel) {
            await next();
            return;
        }

        // Check if repo is public for read access
        if (permission === 'read') {
            const canRead = await db.canRead(repoName);
            if (canRead) {
                await next();
                return;
            }
        }

        return c.json({ error: 'Forbidden' }, 403);
    };
}
