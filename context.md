# Project Context: Cloudflare Container Registry

## Overview
Docker/OCI compatible container registry running on **Cloudflare Workers** using **Bun** runtime, **Hono** framework, and **R2** storage.

## Tech Stack
- **Runtime**: Bun (TypeScript native)
- **Framework**: Hono (Cloudflare Workers optimized)
- **Platform**: Cloudflare Workers (Edge)
- **Storage**: Cloudflare R2 (Object Storage)
- **Language**: TypeScript

## Project Structure
```
/src
  ├── index.ts      # Cloudflare Worker entry (exports fetch handler)
  ├── local.ts      # Local Bun server (filesystem storage)
  ├── registry.ts   # OCI Distribution API v2 (Hono routes)
  ├── storage.ts    # R2 Storage Adapter
  ├── r2-fs.ts      # FileSystem-backed R2 mock
  ├── digest.ts     # SHA256 digest helper
  └── utils.ts      # Error handling
/test
  ├── registry.test.ts
  └── mocks.ts
```

## Key Implementation Details

### 1. OCI Distribution API
Implements OCI Distribution Specification v2:
- **Base**: `/v2/` (Version check)
- **Blobs**: `/v2/<name>/blobs/<digest>` (Upload/Download)
- **Manifests**: `/v2/<name>/manifests/<reference>` (Push/Pull)

### 2. Storage Abstraction
- `RegistryStorage` wraps `R2Bucket`
- `FSR2Bucket` mimics R2 using local filesystem
- Paths: `v2/<name>/blobs/<digest>`, `v2/<name>/manifests/<reference>`

### 3. Dual Execution Mode
- **Production**: `src/index.ts` (Cloudflare Workers with R2)
- **Local**: `src/local.ts` (Bun server with filesystem)

### 4. Framework: Hono
- Lightweight, edge-optimized
- `c.req.param()` for path params
- `c.req.query()` for query params
- `c.header()` to set headers
- `.on('HEAD', ...)` for HEAD requests

## Commands
- `bun run start:local` - Local Bun server (port 3000)
- `bun run dev` - Wrangler dev (Cloudflare emulation)
- `bun run test` - Run tests
- `bun run deploy` - Deploy to Cloudflare

## Recent Changes
- **Migrated from Elysia to Hono** for better Cloudflare Workers compatibility
- Resolved miniflare/youch ESM issues

## Future Todo
- Authentication (Basic/Bearer)
- Garbage collection
- Tag listing endpoint
