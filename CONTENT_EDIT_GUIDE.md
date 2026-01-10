# 📝 How to Edit Website Content

## Easy Content Editing Guide

All website text content is now centralized in **`content.js`** for easy editing!

### Quick Start

1. Open `content.js` in any text editor
2. Find the section you want to edit
3. Change the text between the quotes
4. Save the file
5. Refresh your browser - changes appear automatically!

### Content Sections

#### 🎯 Hero Section (Top of Page)
```javascript
hero: {
    dateBadge: "3. Juni - 6. Juni, 2026",        // Date badge
    title: "Bestig Bjerge",                       // Main title
    titleAccent: "Sammen.",                       // Accent text (orange)
    subtitle: "8 Ryttere. 3 Legender. Le Bourg-d'Oisans.",  // Subtitle
    buttonPrimary: "Se Ruter",                    // Primary button
    buttonSecondary: "Tur Budget"                 // Secondary button
}
```

#### 🧭 Navigation
```javascript
nav: {
    logo: "ALPS 2026",                            // Logo text
    links: {
        updates: "Opdateringer",
        gallery: "Galleri",
        program: "Program",
        routes: "Ruter",
        forecast: "Prognose",
        budget: "Budget",
        logistics: "Logistik"
    }
}
```

#### 📍 Sections
All section titles and subtitles are in the `sections` object:
- `previousRides` - Gallery section
- `program` - Program section
- `routes` - Routes section
- `forecast` - Forecast section
- `budget` - Budget section
- `logistics` - Logistics section
- `blog` - Blog/Updates section

#### 🚴 Routes
Each route has:
- `name` - Route name
- `description` - Route description
- `distance` - Distance
- `elevation` - Elevation gain
- `difficulty` - Difficulty level

#### 📅 Program
Day-by-day program items in `program.day1`, `program.day2`, `program.day3`

### Examples

**Change Hero Title:**
```javascript
title: "Your New Title Here",
```

**Change Subtitle:**
```javascript
subtitle: "Your new subtitle text here",
```

**Change Navigation Link:**
```javascript
links: {
    routes: "My Routes",  // Changed from "Ruter"
}
```

### Important Notes

- ✅ Keep quotes around text: `"Your text here"`
- ✅ Use `<br>` for line breaks in HTML
- ✅ Use `\n` for line breaks in arrays
- ✅ Save the file after editing
- ✅ Refresh browser to see changes
- ⚠️ Don't delete commas between items
- ⚠️ Don't delete the closing braces `}`

### Need Help?

If something doesn't update:
1. Check browser console for errors (F12)
2. Make sure you saved `content.js`
3. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
4. Check that quotes are balanced

