import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware, dbMiddleware } from '../auth/middleware';

const groups = new Hono<{ Bindings: Env }>();

// Apply middleware
groups.use('*', dbMiddleware());
groups.use('*', authMiddleware(true));

// POST /api/groups - Create group
groups.post('/', async (c) => {
    const auth = c.get('auth')!;
    const db = c.get('db');

    const body = await c.req.json();
    const { name, description } = body;

    if (!name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    const group = await db.createGroup(name, description || null, auth.user.id);
    return c.json(group, 201);
});

// GET /api/groups - List user's groups
groups.get('/', async (c) => {
    const auth = c.get('auth')!;
    const db = c.get('db');

    const userGroups = await db.getGroupsByUser(auth.user.id);
    return c.json(userGroups);
});

// GET /api/groups/:id - Get group details
groups.get('/:id', async (c) => {
    const auth = c.get('auth')!;
    const db = c.get('db');
    const groupId = c.req.param('id');

    const group = await db.getGroupById(groupId);
    if (!group) {
        return c.json({ error: 'Group not found' }, 404);
    }

    // Check if user is a member
    const members = await db.getGroupMembers(groupId);
    const isMember = members.some(m => m.user_id === auth.user.id);

    if (!isMember) {
        return c.json({ error: 'Forbidden' }, 403);
    }

    return c.json({ ...group, members });
});

// PUT /api/groups/:id - Update group
groups.put('/:id', async (c) => {
    const auth = c.get('auth')!;
    const db = c.get('db');
    const groupId = c.req.param('id');

    // Check if user is admin
    const isAdmin = await db.isGroupAdmin(groupId, auth.user.id);
    if (!isAdmin) {
        return c.json({ error: 'Forbidden - Admin only' }, 403);
    }

    const body = await c.req.json();
    const { name, description } = body;

    await db.updateGroup(groupId, name, description || null);
    return c.json({ success: true });
});

// DELETE /api/groups/:id - Delete group
groups.delete('/:id', async (c) => {
    const auth = c.get('auth')!;
    const db = c.get('db');
    const groupId = c.req.param('id');

    const group = await db.getGroupById(groupId);
    if (!group) {
        return c.json({ error: 'Group not found' }, 404);
    }

    // Only creator can delete
    if (group.created_by !== auth.user.id) {
        return c.json({ error: 'Forbidden - Creator only' }, 403);
    }

    await db.deleteGroup(groupId);
    return c.json({ success: true });
});

// POST /api/groups/:id/members - Add member to group
groups.post('/:id/members', async (c) => {
    const auth = c.get('auth')!;
    const db = c.get('db');
    const groupId = c.req.param('id');

    // Check if user is admin
    const isAdmin = await db.isGroupAdmin(groupId, auth.user.id);
    if (!isAdmin) {
        return c.json({ error: 'Forbidden - Admin only' }, 403);
    }

    const body = await c.req.json();
    const { userId, role } = body;

    if (!userId) {
        return c.json({ error: 'userId is required' }, 400);
    }

    // Verify user exists
    const user = await db.getUserById(userId);
    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }

    await db.addGroupMember(groupId, userId, role || 'member');
    return c.json({ success: true });
});

// DELETE /api/groups/:id/members/:userId - Remove member
groups.delete('/:id/members/:userId', async (c) => {
    const auth = c.get('auth')!;
    const db = c.get('db');
    const groupId = c.req.param('id');
    const userId = c.req.param('userId');

    // Check if user is admin
    const isAdmin = await db.isGroupAdmin(groupId, auth.user.id);
    if (!isAdmin) {
        return c.json({ error: 'Forbidden - Admin only' }, 403);
    }

    await db.removeGroupMember(groupId, userId);
    return c.json({ success: true });
});

export { groups };
