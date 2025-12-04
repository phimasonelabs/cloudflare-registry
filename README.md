# Cloudflare Container Registry

A Docker/OCI compatible container registry running on Cloudflare Workers with R2 storage.

## Quick Start

### Local Development (Recommended for Testing)
```bash
bun run start:local
```
Runs on `http://localhost:3000` using **persistent** filesystem storage (`./.local-storage`).
✅ **Best for docker push/pull testing** - data persists across restarts.

### Cloudflare Workers Emulation
```bash
bun run dev
```
Runs using Wrangler with Bun runtime.
⚠️ **Note:** Preview R2 storage is in-memory and **does not persist** between wrangler restarts.
Use `start:local` for persistent local testing.

### Deploy to Cloudflare
```bash
# Login to Cloudflare
bunx wrangler login

# Create R2 bucket
bunx wrangler r2 bucket create container-registry-storage

# Deploy
bun run deploy
```

## Available Scripts
- `bun run start:local` - Local Bun server with persistent filesystem storage (recommended for testing)
- `bun run dev` - Wrangler dev (R2 is in-memory, not persistent)
- `bun run dev:debug` - Wrangler dev with debug logging
- `bun run test` - Run tests
- `bun run deploy` - Deploy to Cloudflare

## Tech Stack
- **Runtime**: Bun
- **Framework**: Hono (Cloudflare Workers optimized)
- **Platform**: Cloudflare Workers
- **Storage**: Cloudflare R2

## Testing with Docker

```bash
# Tag an image
docker tag nginx:latest localhost:3000/nginx:latest

# Push (use start:local, not wrangler dev)
docker push localhost:3000/nginx:latest

# Pull
docker pull localhost:3000/nginx:latest
```

See `context.md` for more details.
