# GitHub Deployment Guide

## 🚀 Deploy Directly from GitHub

This guide shows you how to set up automatic deployment from GitHub to Cloudflare Workers.

---

## Prerequisites

- GitHub account
- Cloudflare account (free tier works)
- Repository forked/cloned

---

## Step-by-Step Setup

### 1. Get Cloudflare API Token

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click on your profile icon (top right) → **My Profile**
3. Select **API Tokens** from the left sidebar
4. Click **Create Token**
5. Use template: **Edit Cloudflare Workers**
6. Configure:
   - **Permissions:** Account → Cloudflare Workers Scripts → Edit
   - **Account Resources:** Include → Your Account
   - **Zone Resources:** All zones (or specific zone)
7. Click **Continue to summary** → **Create Token**
8. **Copy the token** (you won't see it again!)

### 2. Get Cloudflare Account ID

1. In [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages**
3. Look at the right sidebar
4. Copy your **Account ID**

### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add two secrets:

**Secret 1:**
- Name: `CLOUDFLARE_API_TOKEN`
- Value: [paste your API token from step 1]
- Click **Add secret**

**Secret 2:**
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Value: [paste your account ID from step 2]
- Click **Add secret**

### 4. Configure Your Project

Edit `wrangler.toml`:

```toml
name = "google-drive-index"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Your configuration here
```

Edit `src/config.ts`:

```typescript
export const config: AppConfig = {
  configBackend: 'static', // or 'd1' or 'hyperdrive'
  
  auth: {
    roots: [
      {
        id: 'YOUR_GOOGLE_DRIVE_FOLDER_ID',
        name: 'My Drive',
        protect_file_link: false
      }
    ],
    // Add your credentials
  }
};
```

### 5. Push to GitHub

```bash
git add .
git commit -m "Configure for deployment"
git push origin main
```

### 6. Watch Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. You'll see "Deploy to Cloudflare Workers" running
4. Wait for green checkmark ✓
5. Your worker is live!

---

## Automatic Deployments

Now, every time you push to `main` branch:
- GitHub Actions automatically deploys to Cloudflare
- No manual deployment needed
- Check Actions tab for deployment status

---

## Manual Deployment Trigger

You can also manually trigger deployment:

1. Go to **Actions** tab
2. Click **Deploy to Cloudflare Workers**
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow**

---

## Setting Up D1 Database (Optional)

If using D1 backend:

```bash
# Create D1 database locally
wrangler d1 create google-drive-index-db

# Copy the database_id from output
# Add to wrangler.toml:
[[d1_databases]]
binding = "DB"
database_name = "google-drive-index-db"
database_id = "YOUR_DATABASE_ID"

# Push to GitHub
git add wrangler.toml
git commit -m "Add D1 database"
git push origin main
```

---

## Setting Up HyperDrive (Optional)

If using HyperDrive backend:

```bash
# Create HyperDrive connection locally
wrangler hyperdrive create gdi-db --connection-string="postgresql://..."

# Copy the hyperdrive_id from output
# Add to wrangler.toml:
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "YOUR_HYPERDRIVE_ID"

# Push to GitHub
git add wrangler.toml
git commit -m "Add HyperDrive connection"
git push origin main
```

---

## Environment Variables (Optional)

For sensitive data, use Cloudflare secrets:

```bash
# Set secrets via Wrangler
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put ADMIN_PASSWORD

# Access in code:
const secret = env.GOOGLE_CLIENT_SECRET;
```

---

## Troubleshooting

### Deployment Fails

**Check:**
- API token has correct permissions
- Account ID is correct
- Secrets are added to GitHub
- `wrangler.toml` is valid

**View logs:**
- GitHub Actions tab → Click on failed workflow
- Check error messages

### Worker Not Accessible

**Check:**
- Deployment completed successfully (green checkmark)
- Visit: `https://google-drive-index.YOUR_SUBDOMAIN.workers.dev`
- Check Cloudflare dashboard for worker status

### Secrets Not Working

**Verify:**
- Secret names match exactly (case-sensitive)
- No extra spaces in secret values
- Secrets are in correct repository (not organization)

---

## Advanced: Multiple Environments

Create separate workflows for staging/production:

**.github/workflows/deploy-staging.yml:**
```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          environment: 'staging'
```

**.github/workflows/deploy-production.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          environment: 'production'
```

---

## Security Best Practices

1. **Never commit secrets** to Git
2. **Rotate API tokens** regularly
3. **Use environment-specific** secrets
4. **Enable branch protection** on main
5. **Review deployment logs** regularly
6. **Use least-privilege** API tokens

---

## Monitoring Deployments

### GitHub Actions Dashboard
- View all deployments
- Check success/failure status
- Review deployment logs
- Re-run failed deployments

### Cloudflare Dashboard
- Monitor worker analytics
- View error logs
- Check request metrics
- Manage worker settings

---

## Quick Reference

| Action | Command/Location |
|--------|------------------|
| View deployments | GitHub → Actions tab |
| Trigger manual deploy | Actions → Run workflow |
| Check worker status | Cloudflare → Workers & Pages |
| View logs | Actions → Click workflow → View logs |
| Update secrets | Settings → Secrets → Actions |
| Worker URL | `https://[name].[subdomain].workers.dev` |

---

## Need Help?

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/
- **Wrangler Action:** https://github.com/cloudflare/wrangler-action
- **Project Issues:** https://github.com/yourusername/google-drive-index/issues

---

## Success Checklist

- [ ] Cloudflare API token created
- [ ] Account ID copied
- [ ] Secrets added to GitHub
- [ ] Configuration files updated
- [ ] Code pushed to main branch
- [ ] GitHub Actions workflow passed
- [ ] Worker is accessible
- [ ] Setup wizard completed (if D1/HyperDrive)
- [ ] Admin panel accessible
- [ ] All features tested

🎉 **Deployment Complete!**
