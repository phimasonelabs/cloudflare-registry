# Cloudflare Registry

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)

🐳 A fully-featured **Docker Registry v2** implementation running entirely on **Cloudflare Workers** with OAuth authentication, teams, and a modern web UI.

**🌐 Live Demo:** [https://cfcr.phimasonelabs.com](https://cfcr.phimasonelabs.com)

## ✨ Features

- 🔐 **OAuth Authentication** - Google & GitHub login
- 👥 **Team Management** - Create teams, manage members, assign permissions
- 🎫 **Personal Access Tokens (PAT)** - Generate scoped tokens for CI/CD
- 🖥️ **Modern Web UI** - Browse images, manage settings, view repositories
- 🐳 **Docker Registry v2 API** - Full compatibility with Docker & containerd
- 🌍 **Serverless** - Runs on Cloudflare Workers (no servers to manage)
- 💾 **R2 Storage** - Unlimited storage with Cloudflare R2
- 🔒 **Secure** - JWT sessions, token hashing, permission-based access control

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) installed
- Cloudflare account (for deployment)
- Google/GitHub OAuth apps configured

### Local Development

```bash
# Clone the repository
git clone https://github.com/phimasonelabs/cloudflare-registry
cd cloudflare-registry

# Install dependencies
bun install

# Set up environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your OAuth credentials

# Start local development server (recommended for testing)
bun run start:local
```

Server runs on `http://localhost:3000` with **persistent** filesystem storage.

### Deploy to Cloudflare

```bash
# Login to Cloudflare
bunx wrangler login

# Create D1 database
bunx wrangler d1 create registry-db
# Update wrangler.toml with the database ID

# Create R2 bucket
bunx wrangler r2 bucket create container-registry-storage

# Apply database migrations
bunx wrangler d1 migrations apply registry-db --remote

# Set production secrets
bunx wrangler secret put GOOGLE_CLIENT_ID
bunx wrangler secret put GOOGLE_CLIENT_SECRET
bunx wrangler secret put GITHUB_CLIENT_ID
bunx wrangler secret put GITHUB_CLIENT_SECRET
bunx wrangler secret put JWT_SECRET

# Deploy
bun run deploy
```

## 🐳 Using with Docker

### 1. Generate a Personal Access Token
1. Visit your registry web UI: `https://your-worker.workers.dev`
2. Sign in with Google/GitHub
3. Go to Settings → Tokens
4. Create a new token with `registry:write` scope

### 2. Login to Registry

```bash
echo "YOUR_PAT_TOKEN" | docker login your-registry.com -u your-email --password-stdin
```

### 3. Push/Pull Images

```bash
# Tag an image
docker tag nginx:latest your-registry.com/nginx:latest

# Push
docker push your-registry.com/nginx:latest

# Pull
docker pull your-registry.com/nginx:latest
```

## 📁 Project Structure

```
cloudflare-registry/
├── src/
│   ├── auth/           # Authentication & authorization
│   ├── api/            # API routes (groups, permissions, tokens)
│   ├── db/             # Database layer (D1)
│   ├── registry.ts     # Docker Registry v2 implementation
│   ├── storage.ts      # R2 storage operations
│   └── index.ts        # Main entry point
├── frontend/           # React web UI
│   └── src/
│       ├── components/ # UI components
│       └── context/    # Auth context
├── migrations/         # D1 database migrations
└── wrangler.toml       # Cloudflare Workers configuration
```

## 🛠️ Available Scripts

- `bun run start:local` - Local server with persistent storage (recommended for testing)
- `bun run dev` - Wrangler dev (R2 is in-memory, not persistent)
- `bun run deploy` - Deploy to Cloudflare
- `bun run build:frontend` - Build the web UI
- `bun run db:migrate` - Apply database migrations (remote)
- `bun run db:migrate:local` - Apply migrations (local)

## 🔧 Configuration

### Environment Variables (`.dev.vars`)

```bash
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
JWT_SECRET=your-random-secret-key
```

### OAuth Setup

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-worker.workers.dev/auth/callback/google`

**GitHub:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `https://your-worker.workers.dev/auth/callback/github`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Hono](https://hono.dev/) framework
- Deployed on [Cloudflare Workers](https://workers.cloudflare.com/)
- Follows [Docker Registry HTTP API V2](https://docs.docker.com/registry/spec/api/) specification

---

**Made with ❤️ by [Phimasone Labs](https://phimasonelabs.com)**
