import { Hono } from 'hono';
import { createRegistry } from './registry';
import { RegistryStorage } from './storage';
import { R2Bucket } from '@cloudflare/workers-types';
import { frontendHTML } from './frontend-html';

// Env interface for Cloudflare Workers
interface Env {
    REGISTRY_BUCKET: R2Bucket;
}

export default {
    fetch(request: Request, env: Env, ctx: ExecutionContext) {
        const app = new Hono<{ Bindings: Env }>();

        // Frontend route
        app.get('/', (c) => c.html(frontendHTML));

        // API endpoint to list repositories
        app.get('/api/repositories', async (c) => {
            try {
                const storage = new RegistryStorage(env.REGISTRY_BUCKET);
                const repos = await storage.listRepositories();
                return c.json(repos);
            } catch (err) {
                console.error('Error listing repositories:', err);
                return c.json({ error: 'Failed to list repositories' }, 500);
            }
        });

        // Mount registry routes
        const registry = createRegistry(env);
        app.route('/', registry);

        return app.fetch(request, env, ctx);
    }
};