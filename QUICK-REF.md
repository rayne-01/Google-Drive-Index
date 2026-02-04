# Quick Reference Card

## 🚀 Deploy Commands

```bash
# Static
npm install && npm run deploy

# D1
wrangler d1 create google-drive-index-db
npm run deploy

# HyperDrive
wrangler hyperdrive create gdi --connection-string="..."
npm run deploy
```

## 🔧 Configuration

```typescript
// src/config.ts
configBackend: 'static' | 'd1' | 'hyperdrive'
```

## 📍 Key URLs

- Homepage: `/`
- Setup: `/setup`
- Admin: `/admin`
- Logout: `/logout`

## 🗄️ Database Tables

- `config` - Settings
- `drives` - Drive roots
- `users` - Accounts
- `service_accounts` - SA keys
- `setup_state` - Setup progress
- `sessions` - User sessions

## ⚙️ Config Keys

```
system.backend
auth.siteName
security.crypto_base_key
ui.theme
player.player
```

## 🎯 Features by Backend

### Static
- ✅ Simple
- ✅ Fast
- ❌ Requires redeploy

### D1
- ✅ Dynamic
- ✅ Admin panel
- ✅ Free tier

### HyperDrive
- ✅ External DB
- ✅ Enterprise
- ✅ Advanced

## 📝 Quick Setup

1. Choose backend
2. Update config.ts
3. Deploy
4. Visit /setup (D1/HD)
5. Done!

## 🔐 Default Credentials

Admin: `admin` / `changeme123`
Setup: Set in config.ts

## 📚 Docs

- PROJECT-SUMMARY.md
- MULTI-BACKEND.md
- CONFIG-OPTIONS.md
- MIGRATION.md
