import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createRegistry } from './registry';
import { RegistryStorage } from './storage';
import { FSR2Bucket } from './r2-fs';
import { frontendHTML } from './frontend-html';
import { mkdir } from 'fs/promises';

// Ensure local storage directory exists
const STORAGE_DIR = './.local-storage';
await mkdir(STORAGE_DIR, { recursive: true });

const bucket = new FSR2Bucket(STORAGE_DIR);
const storage = new RegistryStorage(bucket as any);

const app = new Hono();

app.get('/', (c) => c.html(frontendHTML));

// API endpoint to list repositories
app.get('/api/repositories', async (c) => {
    try {
        const repos = await storage.listRepositories();
        return c.json(repos);
    } catch (err) {
        console.error('Error listing repositories:', err);
        return c.json({ error: 'Failed to list repositories' }, 500);
    }
});

const registry = createRegistry({ REGISTRY_BUCKET: bucket as any } as any);

// Auth placeholder for local runner
app.all('/auth/*', (c) => {
    return c.text('Authentication is not supported in "start:local" mode.\nPlease run "npm run dev" (wrangler dev) to test authentication with D1 database support.', 501);
});

app.route('/', registry);

console.log(`🦊 Local Registry is running at http://localhost:3000`);
console.log(`📂 Storage: ${STORAGE_DIR}`);

serve({
    fetch: app.fetch,
    port: 3000
});
