# Database Setup Guide

## 1. Create D1 Database

```bash
bun run db:create
```

This will output something like:
```
✅ Successfully created DB 'registry-db'
database_id = "abc123-def456-ghi789"
```

## 2. Update wrangler.toml

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "registry-db"
database_id = "abc123-def456-ghi789"  # ← Replace with your actual ID
```

## 3. Run Migrations

### For local development:
```bash
bun run db:migrate:local
```

### For production:
```bash
bun run db:migrate
```

## 4. Verify Database

```bash
# List all databases
bun run db:list

# Query the database
bun run db:query "SELECT name FROM sqlite_master WHERE type='table'"
```

## 5. Set Up OAuth Secrets

You'll need to create OAuth apps and set secrets:

```bash
# Google OAuth
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

# GitHub OAuth
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET

# JWT Secret (generate a random string)
wrangler secret put JWT_SECRET
```

## Next Steps

After database setup:
1. Continue with OAuth implementation
2. Test authentication flow
3. Deploy to production
