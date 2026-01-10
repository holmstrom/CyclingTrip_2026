# Deployment Guide

To share this website with your team, you can host it for free using one of these methods:

## Changing the Password

The password is stored in Firebase Firestore. See **`PASSWORD_GUIDE.md`** for detailed instructions.

**Quick method**: Open `change-password.html` in your browser and follow the instructions.

**Default password**: `alps2026`

---

## Updating Content After Publishing

**Yes, you can edit `content.js` after publishing!**

1. Edit `content.js` locally with your changes
2. Save the file
3. Upload the updated `content.js` to your web server
4. **Optional**: Update the version number in `index.html` (line 19) from `?v=1.0` to `?v=1.1` to force browsers to reload the new content

The website will automatically use the new content - no database or backend needed!

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
   - Default password: `alps2026` (change this in `script.js` if needed)
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

