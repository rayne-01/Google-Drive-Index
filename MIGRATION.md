# Migration Guide

## Upgrading from v2.x to v3.0

### Breaking Changes
- File structure completely reorganized
- JavaScript → TypeScript
- Single worker.js → Multiple modules
- New configuration system

### Migration Steps

#### 1. Backup Your Config
Save your old `src/worker.js` configuration:
- Service accounts
- Drive IDs
- Auth settings
- UI customization

#### 2. Choose Backend

**Keep it Simple:** Use Static backend
```typescript
// src/config.ts
configBackend: 'static'
```

**Go Dynamic:** Use D1 backend
```bash
wrangler d1 create google-drive-index-db
# Update wrangler.toml
```

#### 3. Transfer Settings

**Static Backend:**
```typescript
// Edit src/config.ts
const driveRoots: DriveRoot[] = [
  { id: 'YOUR_OLD_DRIVE_ID', name: 'My Drive', protect_file_link: false }
];

export const config: AppConfig = {
  configBackend: 'static',
  auth: {
    siteName: 'YOUR_OLD_SITE_NAME',
    client_id: 'YOUR_CLIENT_ID',
    // ... transfer all settings
  }
};
```

**D1/HyperDrive Backend:**
1. Deploy with empty config
2. Visit `/setup`
3. Follow wizard
4. Manually enter drives

#### 4. Update Encryption Keys

Generate new keys (old keys won't work):
```javascript
const crypto = require('crypto');
console.log('crypto_base_key:', crypto.randomBytes(32).toString('hex'));
console.log('hmac_base_key:', crypto.randomBytes(32).toString('hex'));
console.log('encrypt_iv:', JSON.stringify(Array.from(crypto.randomBytes(16))));
```

Update in `src/config.ts`:
```typescript
const CRYPTO_BASE_KEY = 'your_new_key';
const HMAC_BASE_KEY = 'your_new_key';
const ENCRYPT_IV = new Uint8Array([...]); // your new IV
```

#### 5. Deploy
```bash
npm install
npm run deploy
```

#### 6. Test
- Visit homepage
- Test file listing
- Test downloads
- Test search
- Check admin panel

### Feature Mapping

| v2.x Feature | v3.0 Equivalent |
|--------------|-----------------|
| authConfig | config.auth |
| uiConfig | config.ui |
| player_config | config.player |
| service accounts | config.serviceaccounts |
| roots | config.auth.roots |
| worker.js | src/index.ts |
| app.js | src/router/index.ts |
| functions.js | src/utils/* |

### Configuration Changes

#### Old (v2.x)
```javascript
const authConfig = {
  "siteName": "My Site",
  "client_id": "...",
  "roots": [{ "id": "...", "name": "..." }]
};
```

#### New (v3.0 Static)
```typescript
export const config: AppConfig = {
  auth: {
    siteName: "My Site",
    client_id: "...",
    roots: [{ id: "...", name: "..." }]
  }
};
```

#### New (v3.0 D1)
```typescript
// Use setup wizard or admin panel
// No code changes needed after setup
```

### Admin Panel Changes

| Old | New |
|-----|-----|
| No admin panel | `/admin` with full UI |
| Edit code to change config | Edit in admin panel (D1/HyperDrive) |
| Redeploy for changes | Instant updates (D1/HyperDrive) |

### API Changes

#### Old Endpoints
```
POST /{drive}:/path/to/folder
GET /{drive}:/path/to/file
POST /{drive}:search
```

#### New Endpoints (Same + More)
```
POST /{drive}:/path/to/folder
GET /{drive}:/path/to/file  
POST /{drive}:search
GET /setup (new)
GET /admin (new)
POST /setup/step1 (new)
```

### Database Migration

If moving from KV to D1:

```bash
# Export KV data
wrangler kv:key list --namespace-id=YOUR_KV_ID

# Setup D1
wrangler d1 create google-drive-index-db

# Import users
# Use admin panel to recreate users
```

### Troubleshooting

**Old downloads not working:**
- Links use new encryption
- Users must get new links

**Config not loading:**
- Check configBackend setting
- Verify wrangler.toml bindings

**Setup wizard appearing:**
- Normal for D1/HyperDrive first run
- Complete wizard or switch to static

**Admin panel 404:**
- Check adminConfig.enabled = true
- Verify deployment successful

### Rollback Plan

Keep old deployment:
```bash
# Tag current version
git tag v2-backup

# Deploy v3
npm run deploy

# If issues, redeploy v2
git checkout v2-backup
wrangler deploy src/worker.js
```

### Benefits of Upgrading

✅ TypeScript type safety
✅ Modular code structure
✅ Dynamic configuration (D1/HyperDrive)
✅ Admin panel
✅ Better security
✅ Improved performance
✅ Active maintenance

### Support

- Check PROJECT-SUMMARY.md
- Review MULTI-BACKEND.md
- Open GitHub issue
- Join Telegram channel

## Quick Migration Checklist

- [ ] Backup old config
- [ ] Choose backend (static/d1/hyperdrive)
- [ ] Install dependencies
- [ ] Transfer drive IDs
- [ ] Generate new encryption keys
- [ ] Update wrangler.toml
- [ ] Deploy
- [ ] Run setup wizard (if D1/HyperDrive)
- [ ] Test all features
- [ ] Update bookmarks/links
