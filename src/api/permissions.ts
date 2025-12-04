import { Hono } from 'hono';
import { Env, Permission } from '../types';
import { authMiddleware, dbMiddleware } from '../auth/middleware';

const permissions = new Hono<{ Bindings: Env }>();

// Apply middleware
permissions.use('*', dbMiddleware());
permissions.use('*', authMiddleware(true));

// GET /api/repositories/:name/permissions - List all permissions
permissions.get('/:name/permissions', async (c) => {
    const auth = c.get('auth')!;
    const db = c.get('db');
    const repoName = c.req.param('name');

    const repo = await db.getRepositoryByName(repoName);
    if (!repo) {
        return c.json({ error: 'Repository not found' }, 404);
    }

    // Only owner can view permissions
    const userPerm = await db.getUserPermission(repoName, auth.user.id);
    if (userPerm !== 'owner') {
        return c.json({ error: 'Forbidden - Owner only' }, 403);
    }

    // This would require additional DB queries - simplified for now
    return c.json({
        repository: repoName,
        owner: repo.owner_id,
        is_public: repo.is_public
    });
});

// POST /api/repositories/:name/permissions - Grant permission
permissions.post('/:name/permissions', async (c) => {
    const auth = c.get('auth')!;
    const db = c.get('db');
    const repoName = c.req.param('name');

    const repo = await db.getRepositoryByName(repoName);
    if (!repo) {
        return c.json({ error: 'Repository not found' }, 404);
    }

    // Only owner can grant permissions
    const userPerm = await db.getUserPermission(repoName, auth.user.id);
    if (userPerm !== 'owner') {
        return c.json({ error: 'Forbidden - Owner only' }, 403);
    }

    const body = await c.req.json();
    const { type, targetId, permission } = body;

    if (!type || !targetId || !permission) {
        return c.json({ error: 'type, targetId, and permission are required' }, 400);
    }

    if (type === 'user') {
        // Verify user exists
        const user = await db.getUserById(targetId);
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }

        await db.grantUserPermission(repo.id, targetId, permission as Permission, auth.user.id);
    } else if (type === 'group') {
        // Verify group exists
        const group = await db.getGroupById(targetId);
        if (!group) {
            return c.json({ error: 'Group not found' }, 404);
        }

        if (permission === 'owner') {
            return c.json({ error: 'Groups cannot have owner permission' }, 400);
        }

        await db.grantGroupPermission(repo.id, targetId, permission as 'read' | 'write', auth.user.id);
    } else {
        return c.json({ error: 'Invalid type. Must be "user" or "group"' }, 400);
    }

    return c.json({ success: true });
});

// DELETE /api/repositories/:name/permissions/:type/:id - Revoke permission
permissions.delete('/:name/permissions/:type/:id', async (c) => {
    const auth = c.get('auth')!;
    const db = c.get('db');
    const repoName = c.req.param('name');
    const type = c.req.param('type');
    const targetId = c.req.param('id');

    const repo = await db.getRepositoryByName(repoName);
    if (!repo) {
        return c.json({ error: 'Repository not found' }, 404);
    }

    // Only owner can revoke permissions
    const userPerm = await db.getUserPermission(repoName, auth.user.id);
    if (userPerm !== 'owner') {
        return c.json({ error: 'Forbidden - Owner only' }, 403);
    }

    if (type === 'user') {
        await db.revokeUserPermission(repo.id, targetId);
    } else if (type === 'group') {
        await db.revokeGroupPermission(repo.id, targetId);
    } else {
        return c.json({ error: 'Invalid type. Must be "user" or "group"' }, 400);
    }

    return c.json({ success: true });
});

export { permissions };
