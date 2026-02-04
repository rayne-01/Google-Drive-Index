# Configuration Options

## Backend Types

```typescript
configBackend: 'static' | 'd1' | 'hyperdrive'
```

## Static Configuration

All settings in `src/config.ts`:

```typescript
const driveRoots: DriveRoot[] = [
  { id: 'folder_id', name: 'My Drive', protect_file_link: false }
];

export const config: AppConfig = {
  configBackend: 'static',
  auth: { /* ... */ },
  ui: { /* ... */ }
};
```

## D1 Configuration

Settings stored in Cloudflare D1:

```bash
wrangler d1 create google-drive-index-db
wrangler d1 execute google-drive-index-db --file=./schema.sql
```

## HyperDrive Configuration

Connect to external database:

```bash
wrangler hyperdrive create gdi-db \
  --connection-string="postgresql://user:pass@host:5432/db"
```

## Configuration Keys

### System
- `system.backend` - Backend type
- `system.version` - App version
- `system.environment` - production/development

### Authentication
- `auth.siteName` - Site name
- `auth.enable_login` - Enable login system
- `auth.login_days` - Session duration
- `auth.files_list_page_size` - Pagination size

### Security
- `security.crypto_base_key` - Encryption key
- `security.hmac_base_key` - HMAC key
- `security.file_link_expiry` - Link expiry (days)
- `security.enable_ip_lock` - IP locking

### UI
- `ui.theme` - Bootstrap theme
- `ui.logo_image` - Use image logo
- `ui.display_size` - Show file sizes
- `ui.display_time` - Show timestamps

### Player
- `player.player` - Video player (videojs/plyr/dplayer)
- `player.videojs_version` - VideoJS version

## Admin Panel

Access at `/admin` to manage:
- Configuration values
- Drive list
- User accounts
- Service accounts
- System status

## Setup Wizard

First-time setup at `/setup`:
1. Choose backend
2. Initialize database
3. Create admin account
4. Add drives
5. Complete setup

## API Access

Get config programmatically:

```typescript
const manager = getConfigManager(backend, env);
const siteName = await manager.getConfig('auth.siteName');
await manager.setConfig('ui.theme', 'darkly', 'ui');
```

## Best Practices

1. **Static** - For simple deployments
2. **D1** - For dynamic config without external DB
3. **HyperDrive** - For enterprise with existing DB

Always:
- Generate unique encryption keys
- Change default passwords
- Backup database regularly (D1/HyperDrive)
- Use environment variables for secrets
