import { Hono } from 'hono';
import { Env, PatScope } from '../types';
import { authMiddleware, dbMiddleware } from '../auth/middleware';

const tokens = new Hono<{ Bindings: Env }>();

// Apply middleware
tokens.use('*', dbMiddleware());
tokens.use('*', authMiddleware(true));

// POST /api/tokens - Create new PAT
tokens.post('/', async (c) => {
    const auth = c.get('auth');
    if (!auth) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { name, scopes, expiresIn } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.length === 0) {
        return c.json({ error: 'Name is required' }, 400);
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
        return c.json({ error: 'At least one scope is required' }, 400);
    }

    // Validate scopes
    const validScopes: PatScope[] = ['registry:read', 'registry:write', 'registry:admin'];
    for (const scope of scopes) {
        if (!validScopes.includes(scope)) {
            return c.json({ error: `Invalid scope: ${scope}` }, 400);
        }
    }

    // Calculate expiration
    let expiresAt: number | null = null;
    if (expiresIn && typeof expiresIn === 'number' && expiresIn > 0) {
        expiresAt = Date.now() + expiresIn;
    }

    try {
        const db = c.get('db');
        const result = await db.createPAT(auth.user.id, name, scopes, expiresAt);

        return c.json({
            token: result.token, // Only time the token is shown!
            id: result.pat.id,
            name: result.pat.name,
            scopes: result.pat.scopes,
            expires_at: result.pat.expires_at,
            created_at: result.pat.created_at
        });
    } catch (error) {
        console.error('PAT creation error:', error);
        return c.json({ error: 'Failed to create token' }, 500);
    }
});

// GET /api/tokens - List user's PATs
tokens.get('/', async (c) => {
    const auth = c.get('auth');
    if (!auth) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const db = c.get('db');
        const pats = await db.listUserPATs(auth.user.id);
        return c.json(pats);
    } catch (error) {
        console.error('PAT list error:', error);
        return c.json({ error: 'Failed to list tokens' }, 500);
    }
});

// DELETE /api/tokens/:id - Revoke a PAT
tokens.delete('/:id', async (c) => {
    const auth = c.get('auth');
    if (!auth) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const tokenId = c.req.param('id');
    if (!tokenId) {
        return c.json({ error: 'Token ID required' }, 400);
    }

    try {
        const db = c.get('db');
        await db.revokePAT(tokenId, auth.user.id);
        return c.json({ success: true });
    } catch (error) {
        console.error('PAT revocation error:', error);
        return c.json({ error: 'Failed to revoke token' }, 500);
    }
});

export { tokens };
