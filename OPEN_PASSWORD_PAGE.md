# 🔓 How to Open change-password.html

## Method 1: Simple File Open (Try This First)

1. **Navigate to the file** in Windows Explorer:
   - Go to: `C:\Projects\CyclingTrip_2026\`
   - Find `change-password.html`
   - **Right-click** → **Open with** → **Choose your browser** (Chrome, Firefox, Edge)

2. **Or drag and drop**:
   - Open your browser
   - Drag `change-password.html` into the browser window

---

## Method 2: Use Local Web Server (Recommended)

If Method 1 doesn't work (Firebase might not load), use a local server:

### Option A: Python (if installed)
1. Open **Command Prompt** or **PowerShell**
2. Navigate to your project:
   ```bash
   cd C:\Projects\CyclingTrip_2026
   ```
3. Start a server:
   ```bash
   python -m http.server 8000
   ```
4. Open browser and go to:
   ```
   http://localhost:8000/change-password.html
   ```

### Option B: Node.js (if installed)
1. Install a simple server:
   ```bash
   npm install -g http-server
   ```
2. Navigate to project:
   ```bash
   cd C:\Projects\CyclingTrip_2026
   ```
3. Start server:
   ```bash
   http-server
   ```
4. Open: `http://localhost:8080/change-password.html`

### Option C: VS Code Live Server (Easiest!)
1. Install **"Live Server"** extension in VS Code
2. Right-click `change-password.html` in VS Code
3. Click **"Open with Live Server"**
4. Browser opens automatically!

---

## Method 3: Use Your Main Website

Since you're deploying the site anyway, you can:

1. **Deploy your site** (Vercel, Netlify, etc.)
2. **Navigate to**: `https://your-site.com/change-password.html`
3. **Use the page** to change the password

---

## Troubleshooting

**"Firebase not initialized" error:**
- Make sure `firebase-config.js` is in the same folder
- Make sure you're opening via a web server (not `file://`)

**"CORS error" or "Blocked by browser":**
- Use Method 2 (local web server) instead of opening file directly
- Browsers block some features when opening files directly

**File won't open:**
- Check file path: `C:\Projects\CyclingTrip_2026\change-password.html`
- Make sure the file exists
- Try a different browser

---

## Quick Test

If you just want to test if it works, you can also:
1. **Deploy your main site** first
2. **Upload `change-password.html`** to the same location
3. **Access it** via your live URL

