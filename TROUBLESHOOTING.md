# Troubleshooting Guide

## Common Issues and Solutions

### 🔧 Installation Issues

#### Error: "Module not found"
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Error: "TypeScript compilation failed"
```bash
# Solution: Update TypeScript
npm install -D typescript@latest
npm run typecheck
```

---

### 🚀 Deployment Issues

#### Error: "Authentication error"
**Problem:** Invalid Cloudflare API token

**Solution:**
1. Verify API token in GitHub Secrets
2. Check token permissions (needs Workers edit)
3. Regenerate token if expired

#### Error: "Account ID not found"
**Problem:** Incorrect or missing account ID

**Solution:**
1. Go to Cloudflare Dashboard → Workers & Pages
2. Copy Account ID from right sidebar
3. Update `CLOUDFLARE_ACCOUNT_ID` secret

#### Error: "Binding not found: DB/HYPERDRIVE"
**Problem:** Database binding not configured

**Solution for D1:**
```bash
wrangler d1 create google-drive-index-db
# Copy database_id to wrangler.toml
```

**Solution for HyperDrive:**
```bash
wrangler hyperdrive create gdi --connection-string="..."
# Copy hyperdrive_id to wrangler.toml
```

---

### ⚙️ Configuration Issues

#### Setup wizard not appearing
**Symptoms:** Redirects to homepage instead of /setup

**Solutions:**
1. Check `configBackend` in `src/config.ts`:
   ```typescript
   configBackend: 'd1' // or 'hyperdrive'
   ```

2. Verify database binding in `wrangler.toml`

3. Check if setup already completed:
   ```sql
   -- D1 Console
   SELECT * FROM setup_state;
   ```

4. Reset setup if needed:
   ```sql
   UPDATE setup_state SET completed = 0, current_step = 1 WHERE id = 1;
   ```

#### Configuration not loading
**Symptoms:** Default values shown, changes not applied

**Solutions:**
1. **Static backend:** Redeploy after changes
   ```bash
   npm run deploy
   ```

2. **D1/HyperDrive:** Clear cache in admin panel

3. Check database connection:
   ```bash
   wrangler d1 execute google-drive-index-db --command="SELECT * FROM config"
   ```

---

### 🔐 Authentication Issues

#### Admin panel shows 404
**Symptoms:** `/admin` returns not found

**Solutions:**
1. Check `adminConfig.enabled`:
   ```typescript
   export const adminConfig = {
     enabled: true, // Must be true
     // ...
   };
   ```

2. Clear browser cache
3. Verify deployment was successful

#### Login fails with "Invalid credentials"
**Symptoms:** Correct password but login fails

**Solutions:**
1. **Static backend:** Check `users_list` in config
2. **D1/HyperDrive:** Check users table:
   ```sql
   SELECT username, enabled FROM users;
   ```

3. Reset password:
   ```sql
   -- Update password (hash it first!)
   UPDATE users SET password_hash = 'new_hash' WHERE username = 'admin';
   ```

#### Session expired immediately
**Symptoms:** Logged out after page refresh

**Solutions:**
1. Check `login_days` setting
2. Verify cookie settings (HttpOnly, Secure, SameSite)
3. Check browser cookie settings

---

### 📁 Google Drive Issues

#### Error: "File not found"
**Symptoms:** Files exist but show as not found

**Solutions:**
1. Verify folder ID in config
2. Check Google Drive sharing permissions
3. For service accounts: Share folder with service account email

#### Error: "Authorization failed"
**Symptoms:** 401/403 errors when accessing files

**Solutions:**
1. **OAuth2:** Regenerate refresh token
2. **Service Account:** 
   - Check service account email
   - Verify folder is shared with service account
   - Check API is enabled in Google Cloud Console

3. Test credentials:
   ```bash
   # Use Google's OAuth Playground
   https://developers.google.com/oauthplayground/
   ```

#### Files not listing
**Symptoms:** Empty folder but files exist

**Solutions:**
1. Check folder ID is correct
2. Verify `files_list_page_size` setting
3. Check browser console for errors
4. Test API directly:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://www.googleapis.com/drive/v3/files?q='FOLDER_ID'+in+parents"
   ```

---

### 🔒 Security Issues

#### Download links not working
**Symptoms:** 401 error on download attempts

**Solutions:**
1. Check encryption keys are set
2. Verify `file_link_expiry` hasn't passed
3. Check HMAC integrity:
   - Ensure `hmac_base_key` hasn't changed
   - Regenerate links if keys were rotated

#### IP lock not working
**Symptoms:** Can access from different IP

**Solutions:**
1. Enable in config:
   ```typescript
   auth: {
     enable_ip_lock: true,
   }
   ```

2. Check CF-Connecting-IP header is available
3. Verify KV/D1 stores IP correctly

---

### 🗄️ Database Issues

#### D1 queries failing
**Symptoms:** Database errors in logs

**Solutions:**
1. Check D1 binding name matches:
   ```toml
   [[d1_databases]]
   binding = "DB" # Must match in code
   ```

2. Verify database exists:
   ```bash
   wrangler d1 list
   ```

3. Check table schema:
   ```bash
   wrangler d1 execute google-drive-index-db --command=".schema"
   ```

4. Reinitialize if needed:
   ```bash
   wrangler d1 execute google-drive-index-db --file=./schema.sql
   ```

#### HyperDrive connection timeout
**Symptoms:** Slow or failed database connections

**Solutions:**
1. Check connection string is correct
2. Verify database is accessible from Cloudflare
3. Check connection pool settings
4. Monitor HyperDrive dashboard for errors

---

### 🎨 UI Issues

#### Theme not applying
**Symptoms:** Default theme shown instead of selected

**Solutions:**
1. Check theme name is valid (see Bootswatch)
2. Clear browser cache
3. Check CDN availability:
   ```
   https://cdn.jsdelivr.net/npm/bootswatch@5.3.0/dist/THEME/bootstrap.min.css
   ```

#### Media player not loading
**Symptoms:** Video/audio files don't play

**Solutions:**
1. Check player configuration:
   ```typescript
   player: {
     player: 'videojs', // Must be valid
     videojs_version: '8.3.0'
   }
   ```

2. Check browser console for CDN errors
3. Verify file format is supported
4. Test with different player

---

### 📱 Mobile Issues

#### Layout broken on mobile
**Symptoms:** UI elements overlapping or cut off

**Solutions:**
1. Clear mobile browser cache
2. Check viewport meta tag exists
3. Test with different mobile browsers
4. Verify Bootstrap CSS loaded correctly

#### Touch events not working
**Symptoms:** Can't tap buttons or links

**Solutions:**
1. Check z-index of elements
2. Verify no transparent overlays
3. Test with different mobile devices

---

### 🔍 Search Issues

#### Search returns no results
**Symptoms:** Files exist but search finds nothing

**Solutions:**
1. Check `search_all_drives` setting
2. Verify search permissions
3. Test with simple filename
4. Check search query formatting

#### Search too slow
**Symptoms:** Search takes long time

**Solutions:**
1. Reduce `search_result_list_page_size`
2. Use more specific search terms
3. Consider indexing (future feature)

---

### 🚨 Performance Issues

#### Slow page loads
**Symptoms:** Pages take long to load

**Solutions:**
1. Enable caching:
   - LocalStorage for file structure
   - Config cache (5 minutes)

2. Reduce `files_list_page_size`

3. Check Cloudflare analytics for bottlenecks

4. Optimize queries:
   ```typescript
   // Use pagination
   // Cache frequently accessed data
   // Minimize API calls
   ```

#### High memory usage
**Symptoms:** Worker crashes or errors

**Solutions:**
1. Reduce page size settings
2. Clear caches regularly
3. Optimize file listing logic
4. Check for memory leaks in custom code

---

### 🔄 Migration Issues

#### v2 to v3 migration fails
**Symptoms:** Errors after upgrading

**Solutions:**
1. Follow [MIGRATION.md](./MIGRATION.md) guide
2. Generate new encryption keys (incompatible with v2)
3. Update all configuration to new format
4. Test in development first

#### Lost data after migration
**Symptoms:** Drives or settings missing

**Solutions:**
1. Restore from backup
2. Manually re-enter configuration
3. Check old config file for reference

---

## 🛠️ Debug Mode

### Enable Verbose Logging

```typescript
// src/config.ts
export const config: AppConfig = {
  environment: 'development', // Enable debug logs
  // ...
};
```

### Check Worker Logs

```bash
# Stream live logs
wrangler tail

# Filter by error
wrangler tail --status error

# Save to file
wrangler tail > logs.txt
```

### Browser Console

Open DevTools (F12) and check:
- Console for JavaScript errors
- Network tab for failed requests
- Application tab for localStorage/cookies

---

## 📞 Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Search existing [GitHub Issues](https://github.com/yourusername/google-drive-index/issues)
3. Review documentation files
4. Check Cloudflare Workers status
5. Test in incognito/private mode

### Creating an Issue

Include:
- Error messages (full text)
- Steps to reproduce
- Configuration (remove sensitive data!)
- Browser/device info
- Worker logs
- Screenshots if applicable

### Community Support

- **GitHub Discussions:** Ask questions
- **Telegram:** Real-time help
- **Discord:** Community chat

---

## 🔧 Advanced Debugging

### Test API Endpoints

```bash
# Test file listing
curl -X POST https://your-worker.workers.dev/0:/ \
  -H "Content-Type: application/json" \
  -d '{"page_index":0}'

# Test search
curl -X POST https://your-worker.workers.dev/0:search \
  -H "Content-Type: application/json" \
  -d '{"q":"test"}'

# Test admin panel
curl https://your-worker.workers.dev/admin
```

### Inspect Database

```bash
# D1
wrangler d1 execute google-drive-index-db \
  --command="SELECT * FROM config LIMIT 10"

# Check setup state
wrangler d1 execute google-drive-index-db \
  --command="SELECT * FROM setup_state"
```

### Test Locally

```bash
# Start local development server
npm run dev

# Test with local database
wrangler dev --local --persist
```

---

## ✅ Health Check Checklist

Run this checklist to verify everything works:

- [ ] Worker deploys successfully
- [ ] Homepage loads
- [ ] Admin panel accessible
- [ ] Login works (if enabled)
- [ ] Drives list correctly
- [ ] Files show in folders
- [ ] Search returns results
- [ ] Downloads work
- [ ] Video player works
- [ ] Mobile layout correct
- [ ] Setup wizard complete (if D1/HyperDrive)
- [ ] Configuration changes apply
- [ ] No console errors
- [ ] No worker errors in logs

---

## 🆘 Emergency Procedures

### Rollback Deployment

```bash
# Revert to previous version
git revert HEAD
git push origin main

# Or deploy specific version
git checkout v2.x.x
npm run deploy
```

### Reset Everything

```bash
# 1. Delete worker
wrangler delete

# 2. Delete database (if D1)
wrangler d1 delete google-drive-index-db

# 3. Fresh install
git clone https://github.com/yourusername/google-drive-index.git
cd google-drive-index
npm install
# Configure and redeploy
```

### Contact Maintainers

If all else fails:
- Open GitHub Issue with `[URGENT]` prefix
- Include full error details
- Mention if production is down
- Tag maintainers

---

**Still stuck? Open an issue: https://github.com/yourusername/google-drive-index/issues**
