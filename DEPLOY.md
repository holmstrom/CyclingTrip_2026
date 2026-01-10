# Deployment Guide

To share this website with your team, you can host it for free using one of these methods:

## Changing the Password

The password is stored in Firebase Firestore. See **`PASSWORD_GUIDE.md`** for detailed instructions.

**Quick method**: Open `change-password.html` in your browser and follow the instructions.

**Default password**: `Baddi`

---

## Updating Content After Publishing

**Yes, you can edit `content.js` after publishing!**

1. Edit `content.js` locally with your changes
2. Save the file
3. Upload the updated `content.js` to your web server
4. **Optional**: Update the version number in `index.html` (line 19) from `?v=1.0` to `?v=1.1` to force browsers to reload the new content

The website will automatically use the new content - no database or backend needed!

---

## Hosting Options

### Option 1: Netlify (Free, Easy)

**Fix the "main branch not found" error:**

1. **In Netlify Dashboard:**
   - Go to your site settings
   - Click **"Build & deploy"** → **"Continuous Deployment"**
   - Check **"Production branch"** - make sure it says `main` (not `master`)
   - If it says `master`, change it to `main` and save

2. **If still not working:**
   - Go to **"Build & deploy"** → **"Deploy settings"**
   - Under **"Branch deploys"**, make sure `main` is listed
   - Click **"Trigger deploy"** → **"Clear cache and deploy site"**

3. **Check Repository Connection:**
   - Go to **"Site settings"** → **"Build & deploy"** → **"Link to Git provider"**
   - Make sure your repository is properly connected
   - Reconnect if needed

**Deploy Steps:**
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect repository to Netlify
3. Netlify will auto-deploy on every push
4. Your site will be live at `your-site-name.netlify.app`

---

### Option 2: Vercel (Free, Very Easy) ⭐ Recommended

**Why Vercel:**
- Automatic deployments from Git
- Better error messages
- Free SSL certificate
- Global CDN
- No build configuration needed for static sites

**Steps:**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub/GitLab/Bitbucket
3. Click **"Add New Project"**
4. Import your repository
5. Click **"Deploy"** (no configuration needed!)
6. Done! Your site is live

**Update content:**
- Just push to your `main` branch
- Vercel auto-deploys in ~30 seconds

---

### Option 3: GitHub Pages (Free, Simple)

**Steps:**
1. Push your code to GitHub
2. Go to repository **Settings** → **Pages**
3. Under **"Source"**, select **"Deploy from a branch"**
4. Select branch: `main` and folder: `/ (root)`
5. Click **"Save"**
6. Your site will be at `username.github.io/repository-name`

**Note:** GitHub Pages doesn't support Firebase Hosting features, but your Firebase Firestore will still work.

---

### Option 4: Firebase Hosting (Free, Best for Firebase)

**Why Firebase Hosting:**
- Perfect integration with Firebase services
- Free SSL
- Global CDN
- Easy deployment

**Steps:**
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy --only hosting`
5. Your site will be at `your-project-id.web.app`

**Update content:**
- Run `firebase deploy --only hosting` after editing files
- Or set up GitHub Actions for auto-deploy

---

### Option 5: Cloudflare Pages (Free, Fast)

**Steps:**
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Sign up with GitHub/GitLab
3. Connect your repository
4. Click **"Begin setup"**
5. Build settings: Leave default (no build needed for static site)
6. Click **"Save and Deploy"**
7. Done!

---

## Quick Comparison

| Platform | Ease | Auto-Deploy | Firebase Support | Best For |
|----------|------|-------------|------------------|----------|
| **Vercel** | ⭐⭐⭐⭐⭐ | ✅ Yes | ✅ Yes | Easiest option |
| **Netlify** | ⭐⭐⭐⭐ | ✅ Yes | ✅ Yes | Good alternative |
| **Firebase Hosting** | ⭐⭐⭐ | ⚠️ Manual | ✅✅ Perfect | Firebase users |
| **GitHub Pages** | ⭐⭐⭐ | ⚠️ Manual | ✅ Yes | Simple static sites |
| **Cloudflare Pages** | ⭐⭐⭐⭐ | ✅ Yes | ✅ Yes | Fast global CDN |

**My Recommendation:** Try **Vercel** first - it's the easiest and works great with Firebase!

---

## Firebase Setup (Required for Collaborative Features)

Before deploying, you need to set up Firebase for collaborative features (shared budget, packing list, riders, and GPX routes):

1. **Create a Firebase Project**:
   - Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Click "Add project" or select an existing project
   - Follow the setup wizard

2. **Enable Firestore Database**:
   - In Firebase Console, go to **Firestore Database**
   - Click "Create database"
   - Start in **test mode** (for development) or **production mode** (with security rules)
   - Choose a location (e.g., `europe-west1` for European users)

3. **Get Your Firebase Config**:
   - Go to **Project Settings** (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (`</>`) to add a web app
   - Register the app (name it "Alps 2026")
   - Copy the `firebaseConfig` object

4. **Update firebase-config.js**:
   - Open `firebase-config.js` in this project
   - Replace the placeholder values with your actual Firebase config:
     ```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBH4fhgT5pmYpsTo7aLNddRBZuAGpr-uFg",
  authDomain: "cyclingtrip2026.firebaseapp.com",
  projectId: "cyclingtrip2026",
  storageBucket: "cyclingtrip2026.firebasestorage.app",
  messagingSenderId: "753177810906",
  appId: "1:753177810906:web:32af42ae9078ca53fad2e3",
  measurementId: "G-W2PRSY0PXV"
};
     ```

5. **Set Up Security Rules** (Optional but Recommended):
   - In Firestore Database, go to **Rules** tab
   - Add these rules for basic password protection:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /alps-2026/{document=**} {
           allow read, write: if true; // For development - restrict in production
         }
       }
     }
     ```
   - **Note**: For production, implement proper authentication. The current setup uses client-side password validation.

6. **Set Default Password**:
   - The first time someone accesses the site, a default password will be created
   - Default password: `Baddi` (change this in `script.js` if needed)
   - Users will be prompted to enter this password on first visit

## Option 1: Netlify Drop (Easiest)
1. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the entire `CyclingTrip_2026` folder onto the page.
3. Netlify will instantly generate a public URL (e.g., `https://random-name.netlify.app`).
4. Click "Site settings" to change the site name to something like `alps-2026`.

## Option 2: GitHub Pages
1. Create a new repository on GitHub.
2. Push this project code to the repository.
3. Go to **Settings** -> **Pages**.
4. Select the `main` branch and `/root` folder.
5. GitHub will provide a URL (e.g., `https://username.github.io/repo-name`).

## Sharing
Once deployed, click the **"Del" (Share)** button in the top navigation bar to copy the link or share it directly via mobile apps.

**Important**: All team members will need to enter the password on their first visit. The password is stored in sessionStorage, so they'll need to re-enter it if they clear their browser data or use a different device.

## Features Enabled by Firebase
- **Shared Budget**: All team members can add/edit expenses, and changes sync across devices
- **Shared Packing List**: Collaborative checklist that everyone can update
- **Shared Rider Forecasts**: Everyone's FTP/weight predictions are synced
- **Shared GPX Routes**: Uploaded routes are available to all team members
- **Alternative Routes**: Uploaded alternative routes are shared with the team

## Troubleshooting
- If Firebase is not configured, the site will fall back to localStorage (data won't be shared)
- Check browser console for Firebase errors
- Ensure Firebase config values are correct in `firebase-config.js`
- Make sure Firestore Database is enabled in Firebase Console

