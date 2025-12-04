import { Hono } from 'hono';
import { createRegistry } from './registry';
import { RegistryStorage } from './storage';
import { R2Bucket, D1Database } from '@cloudflare/workers-types';
import { frontendHTML } from './frontend-html';
import { auth } from './auth/routes';
import { groups } from './api/groups';
import { permissions } from './api/permissions';
import { tokens } from './api/tokens';
import { dbMiddleware, authMiddleware } from './auth/middleware';

// Env interface for Cloudflare Workers
export interface Env {
    REGISTRY_BUCKET: R2Bucket;
    DB: D1Database;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    JWT_SECRET: string;
}

export default {
    fetch(request: Request, env: Env, ctx: ExecutionContext) {
        const app = new Hono<{ Bindings: Env }>();

        // Apply database middleware globally
        app.use('*', dbMiddleware());

        // Frontend route (no auth required)
        app.get('/', (c) => c.html(frontendHTML));

        // API endpoint to list repositories (optional auth)
        app.get('/api/repositories', authMiddleware(false), async (c) => {
            try {
                const db = c.get('db');
                const auth = c.get('auth');
                const repos = await db.listRepositories(auth?.user.id);
                return c.json(repos);
            } catch (err) {
                console.error('Error listing repositories:', err);
                return c.json({ error: 'Failed to list repositories' }, 500);
            }
        });

        // Mount auth routes
        app.route('/auth', auth);

        // Mount API routes (require auth)
        app.route('/api/groups', groups);
        app.route('/api/repositories', permissions);
        app.route('/api/tokens', tokens);

        // Mount registry routes
        const registry = createRegistry(env);
        app.route('/', registry);

        return app.fetch(request, env, ctx);
    }
};