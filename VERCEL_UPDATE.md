# 🚀 How to Update Your Site on Vercel

## Simple Answer: Yes, Just Commit and Push!

Vercel automatically deploys when you push to your `main` branch.

## Steps to Update:

1. **Make your changes** (edit files locally)

2. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Your update message"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin main
   ```

4. **Vercel automatically:**
   - Detects the push
   - Starts building your site
   - Deploys the new version
   - Your site is live in ~30-60 seconds!

## Check Deployment Status:

1. Go to your Vercel dashboard
2. Click on your project (`cycling-trip-2026`)
3. Go to **"Deployments"** tab
4. You'll see your new deployment with status:
   - 🟡 **Building** - In progress
   - 🟢 **Ready** - Live!

## Your Live URLs:

- **Production**: `cycling-trip-2026.vercel.app`
- **Custom domain** (if you set one up)

## Tips:

- ✅ Vercel shows a preview of each deployment
- ✅ You can rollback to previous versions if needed
- ✅ Each commit gets its own deployment URL
- ✅ No manual deployment needed!

## Troubleshooting:

**Build fails?**
- Check the **"Build Logs"** in Vercel dashboard
- Look for error messages
- Common issues: missing files, syntax errors

**Changes not showing?**
- Wait 30-60 seconds for deployment
- Hard refresh browser (Ctrl+F5)
- Check deployment status in Vercel

**Want to test before production?**
- Push to a different branch (e.g., `develop`)
- Vercel creates a preview deployment
- Merge to `main` when ready

---

**That's it!** Just commit and push - Vercel handles the rest! 🎉

