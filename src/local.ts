import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createRegistry } from './registry';
import { FSR2Bucket } from './r2-fs';
import { mkdir } from 'fs/promises';

// Ensure local storage directory exists
const STORAGE_DIR = './.local-storage';
await mkdir(STORAGE_DIR, { recursive: true });

const bucket = new FSR2Bucket(STORAGE_DIR);

const app = new Hono();

app.get('/', (c) => c.text('Hello from Local Bun Registry!'));

const registry = createRegistry({ REGISTRY_BUCKET: bucket as any });
app.route('/', registry);

console.log(`🦊 Local Registry is running at http://localhost:3000`);
console.log(`📂 Storage: ${STORAGE_DIR}`);

serve({
    fetch: app.fetch,
    port: 3000
});
