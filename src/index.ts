import { Hono } from 'hono';
import { createRegistry } from './registry';
import { R2Bucket } from '@cloudflare/workers-types';

// Env interface for Cloudflare Workers
interface Env {
    REGISTRY_BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.text('Hello from Cloudflare Container Registry!'));

export default {
    fetch(request: Request, env: Env, ctx: ExecutionContext) {
        const registry = createRegistry(env);
        const mainApp = new Hono<{ Bindings: Env }>();

        mainApp.route('/', app);
        mainApp.route('/', registry);

        return mainApp.fetch(request, env, ctx);
    }
};