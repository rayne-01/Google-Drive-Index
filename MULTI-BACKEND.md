# Multi-Backend Configuration Guide

## Overview

Google Drive Index v3.0 supports three configuration backends:

1. **Static** - Configuration in `src/config.ts` (default)
2. **D1** - Cloudflare D1 database
3. **HyperDrive** - External PostgreSQL/MySQL database

## Backend Selection

Edit `src/config.ts`:

```typescript
export const config: AppConfig = {
  configBackend: 'static', // or 'd1' or 'hyperdrive'
  // ...
};
```

## Setup Process

### 1. Static Backend (No Setup)

Just edit `src/config.ts` and deploy.

### 2. D1 Backend

```bash
# Create D1 database
wrangler d1 create google-drive-index-db

# Update wrangler.toml with database_id
# Uncomment D1 section in wrangler.toml

# Deploy
npm run deploy

# First visit will show setup wizard
# Visit: https://your-worker.workers.dev/setup
```

### 3. HyperDrive Backend

```bash
# Create HyperDrive connection
wrangler hyperdrive create my-db --connection-string="postgres://..."

# Update wrangler.toml with hyperdrive id
# Uncomment HyperDrive section

# Deploy
npm run deploy

# Visit setup wizard
```

## Setup Wizard Steps

### Step 1: Backend Selection
Choose your configuration backend.

### Step 2: Database Initialization
Automatically creates tables and default values.

### Step 3: Admin Account
- Set admin username
- Set admin password  
- Set site name

### Step 4: Drive Configuration
Add your Google Drive folder IDs.

### Step 5: Complete
Setup finished! Access your index.

## Managing Configuration

### With Static Backend
Edit `src/config.ts` and redeploy.

### With D1/HyperDrive
Use the admin panel at `/admin`:
- Manage drives
- Update settings
- Add users
- View stats

## Database Schema

Tables created automatically:
- `config` - Configuration key-value pairs
- `drives` - Google Drive roots
- `users` - User accounts
- `service_accounts` - Service account credentials
- `setup_state` - Setup wizard state
- `sessions` - User sessions

## Migration

### Static → D1
1. Change `configBackend` to `'d1'`
2. Setup D1 database
3. Run setup wizard
4. Manually transfer drives from config.ts

### D1 → HyperDrive
1. Export D1 data
2. Setup HyperDrive
3. Import data to external database
4. Change `configBackend` to `'hyperdrive'`

## Benefits by Backend

### Static
✅ Simple, no database
✅ Fast (no DB queries)
✅ Version controlled
❌ Requires redeployment for changes

### D1
✅ Dynamic configuration
✅ No external dependencies
✅ Free tier available
✅ Admin panel management
❌ Cloudflare-specific

### HyperDrive
✅ Use existing database
✅ Advanced querying
✅ Backup/restore tools
✅ Multi-region support
❌ External dependency
❌ Connection overhead

## Security Notes

- Setup wizard requires one-time password
- Admin credentials stored securely
- Service account keys encrypted
- Session management built-in

## Troubleshooting

**Setup wizard not appearing:**
- Check `configBackend` setting
- Verify database bindings in wrangler.toml
- Check setup_state table

**Database connection errors:**
- Verify binding names match
- Check database credentials
- Review Cloudflare dashboard logs

**Configuration not updating:**
- Clear cache in admin panel
- Check database write permissions
- Verify setup completed
