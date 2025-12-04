#!/usr/bin/env bash

# Cloudflare Registry - Database Setup Script

set -e

echo "🚀 Setting up Cloudflare D1 Database for Container Registry"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

# Step 1: Create D1 database
echo "📦 Creating D1 database..."
OUTPUT=$(wrangler d1 create registry-db 2>&1)

if echo "$OUTPUT" | grep -q "already exists"; then
    echo "✅ Database 'registry-db' already exists"
    DATABASE_ID=$(echo "$OUTPUT" | grep "database_id" | awk '{print $3}' | tr -d '"')
else
    echo "✅ Database created successfully"
    DATABASE_ID=$(echo "$OUTPUT" | grep "database_id" | awk '{print $3}' | tr -d '"')
fi

echo "   Database ID: $DATABASE_ID"
echo ""

# Step 2: Update wrangler.toml
echo "📝 Updating wrangler.toml with database ID..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/database_id = \"preview\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
else
    # Linux
    sed -i "s/database_id = \"preview\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
fi
echo "✅ wrangler.toml updated"
echo ""

# Step 3: Run migrations locally
echo "🔄 Running migrations locally..."
wrangler d1 migrations apply registry-db --local
echo "✅ Local migrations applied"
echo ""

# Step 4: Run migrations in production
read -p "❓ Apply migrations to production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Running migrations in production..."
    wrangler d1 migrations apply registry-db
    echo "✅ Production migrations applied"
else
    echo "⚠️  Skipped production migrations. Run manually with: bun run db:migrate"
fi
echo ""

# Step 5: Verify database
echo "🔍 Verifying database tables..."
wrangler d1 execute registry-db --command "SELECT name FROM sqlite_master WHERE type='table'" --local
echo ""

echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Set up OAuth applications (Google and GitHub)"
echo "   2. Configure secrets:"
echo "      wrangler secret put GOOGLE_CLIENT_ID"
echo "      wrangler secret put GOOGLE_CLIENT_SECRET"
echo "      wrangler secret put GITHUB_CLIENT_ID"
echo "      wrangler secret put GITHUB_CLIENT_SECRET"
echo "      wrangler secret put JWT_SECRET"
echo "   3. Deploy: bun run deploy"
