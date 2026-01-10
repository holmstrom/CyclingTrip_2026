# 🔧 Fix Netlify "main branch not found" Error

## Quick Fix

### Method 1: Check Branch Settings (Most Common Fix)

1. **Go to Netlify Dashboard** → Your site
2. **Site settings** → **Build & deploy** → **Continuous Deployment**
3. **Check "Production branch"**:
   - Should be: `main`
   - If it says `master`, change it to `main`
   - Click **"Save"**

4. **Trigger a new deploy:**
   - Go to **"Deploys"** tab
   - Click **"Trigger deploy"** → **"Clear cache and deploy site"**

---

### Method 2: Reconnect Repository

1. **Site settings** → **Build & deploy** → **Link to Git provider**
2. Click **"Change provider"** or **"Disconnect"**
3. Reconnect your repository
4. Make sure to select the correct branch (`main`)

---

### Method 3: Check Repository Permissions

1. Make sure Netlify has access to your repository
2. Go to your Git provider (GitHub/GitLab/Bitbucket)
3. Check repository settings → **Integrations** or **Applications**
4. Make sure Netlify has **read** access

---

### Method 4: Manual Deploy (Quick Test)

If automatic deploy isn't working, you can deploy manually:

1. **In Netlify Dashboard:**
   - Go to **"Deploys"** tab
   - Click **"Add deploy"** → **"Deploy site"**
   - Drag and drop your project folder
   - Or use Netlify CLI: `netlify deploy --prod`

---

## Still Not Working?

**Check these:**
- ✅ Is your repository public? (Or Netlify has access if private)
- ✅ Does the `main` branch exist in your remote repository?
- ✅ Have you pushed your latest code? (`git push origin main`)
- ✅ Is your repository connected to Netlify?

**Verify your branch:**
```bash
git branch -a  # Should show 'main' and 'remotes/origin/main'
git push origin main  # Make sure it's pushed
```

---

## Alternative: Use Vercel Instead

If Netlify keeps giving you trouble, **Vercel** is often easier:
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository
4. Click "Deploy"
5. Done! (Usually works without any configuration)

