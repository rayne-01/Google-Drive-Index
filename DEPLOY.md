# Deployment Guide

## Prerequisites

1. Cloudflare Workers account
2. Google Drive API credentials
3. Node.js 18+

## Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create KV Namespace

```bash
wrangler kv:namespace create "ENV"
wrangler kv:namespace create "ENV" --preview
```

Copy the IDs to `wrangler.toml`.

### 3. Configure Google Drive

Edit `src/config.ts`:

```typescript
const driveRoots: DriveRoot[] = [
  {
    id: 'YOUR_DRIVE_FOLDER_ID',
    name: 'My Drive',
    protect_file_link: false
  }
];
```

### 4. Generate Keys

```javascript
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('hex')); // crypto_base_key
console.log(crypto.randomBytes(32).toString('hex')); // hmac_base_key
console.log(JSON.stringify(Array.from(crypto.randomBytes(16)))); // encrypt_iv
```

### 5. Deploy

```bash
npm run deploy
```

Done! Your index is live.
