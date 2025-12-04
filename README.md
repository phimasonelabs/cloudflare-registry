# Cloudflare Container Registry

A Docker/OCI compatible container registry running on Cloudflare Workers with R2 storage.

## Quick Start

### Local Development (Recommended)
```bash
bun run start:local
```
Runs on `http://localhost:3000` using filesystem storage (`./.local-storage`).

### Cloudflare Workers Emulation
```bash
bun run dev:bun
```
Runs using Wrangler with Bun runtime. **Note:** Use `dev:bun` instead of `dev` to avoid Node.js ESM compatibility issues.

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
- `bun run start:local` - Local Bun server (filesystem storage)
- `bun run dev:bun` - Wrangler dev with Bun runtime (recommended)
- `bun run dev` - Wrangler dev with Node.js (may have ESM issues)
- `bun run dev:debug` - Wrangler dev with debug logging
- `bun run test` - Run tests
- `bun run deploy` - Deploy to Cloudflare

## Tech Stack
- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Platform**: Cloudflare Workers
- **Storage**: Cloudflare R2

See `context.md` for more details.
