# 🔐 How to Change the Password

The password is stored in **Firebase Firestore** at: `alps-2026/config/password`

## Method 1: Change via Firebase Console (Easiest)

1. **Go to Firebase Console**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. **Select your project** (cyclingtrip2026)
3. **Go to Firestore Database**
4. **Navigate to**: `alps-2026` collection → `config` document
5. **Find the `password` field** - it contains a hashed password (a number)
6. **Delete the `password` field** (or the entire `config` document)
7. **The next time someone logs in**, the system will create a new password with the default: `alps2026`

**To set a custom password:**
- Use the browser console method below (Method 2)
- Or use the helper function in `change-password.html` (Method 3)

---

## Method 2: Change via Browser Console

1. **Open your website** in a browser
2. **Open Developer Console** (F12 or Right-click → Inspect → Console)
3. **Make sure you're logged in** (password modal should not appear)
4. **Paste and run this code**:

```javascript
// Change password function
async function changePassword(newPassword) {
    if (!window.db) {
        console.error('Firebase not initialized');
        return;
    }
    
    // Hash function (same as in script.js)
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    const hashedPassword = hashPassword(newPassword);
    
    try {
        await window.db.collection('alps-2026').doc('config').set({
            password: hashedPassword
        }, { merge: true });
        console.log('✅ Password changed successfully!');
        console.log('New password:', newPassword);
        console.log('Hashed value:', hashedPassword);
    } catch (error) {
        console.error('❌ Error changing password:', error);
    }
}

// Use it like this:
changePassword('your-new-password-here');
```

5. **Replace `'your-new-password-here'`** with your desired password
6. **Press Enter** to run
7. **Done!** The password is now changed

---

## Method 3: Use the Helper Page (Recommended)

I've created a simple helper page `change-password.html` that you can use:

1. **Open `change-password.html`** in your browser
2. **Enter your new password**
3. **Click "Change Password"**
4. **Done!**

This is the easiest method if you're not comfortable with the console.

---

## Default Password

The default password is: **`alps2026`**

This is set in `script.js` line 47. You can change this default, but it only applies when the config document doesn't exist yet (first-time setup).

---

## Security Notes

⚠️ **Important**: 
- The password is hashed (not encrypted) - it's basic protection, not military-grade security
- Anyone with access to Firebase Console can see/change the password
- This is suitable for basic access control, not for sensitive data
- For production use, consider implementing proper authentication

---

## Troubleshooting

**"Firebase not initialized"**
- Make sure Firebase is set up correctly
- Check `firebase-config.js` has correct values
- Make sure you're logged in to the website first

**"Permission denied"**
- Check Firestore security rules in Firebase Console
- Temporarily set rules to: `allow read, write: if true;` for testing

**Password not working after change**
- Clear browser cache and cookies
- Try logging in again
- Check browser console for errors

