# RAISE - Railway Asset Issue Escalation System

**Scan • Report • Resolve**

A comprehensive complaint management system for Indian Railways, built with HTML, CSS, JavaScript, and Google Sheets backend.

---

## 📋 Table of Contents

- [Features](#features)
- [File Structure](#file-structure)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [Usage](#usage)
- [Admin Access](#admin-access)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Public Complaint Form (`index.html`)
- ✅ QR code integration (auto-fill Asset ID from URL)
- ✅ Auto-location detection (GPS coordinates)
- ✅ Photo upload (max 5MB)
- ✅ Mobile number validation
- ✅ WhatsApp sharing with pre-filled message
- ✅ Responsive design for all devices

### Admin Portal
- ✅ Secure login page (`admin.html`)
- ✅ Comprehensive dashboard (`complaints.html`)
- ✅ Real-time statistics (Total, Pending, In Progress, Resolved)
- ✅ Search and filter functionality
- ✅ Status update capability
- ✅ Photo viewing

### Backend (Google Sheets + Apps Script)
- ✅ Automatic data storage
- ✅ Photo upload to Google Drive (optional)
- ✅ JSON API for data retrieval
- ✅ Status update functionality

---

## 📁 File Structure

```
RAISE/
├── index.html          # Public complaint form
├── admin.html          # Admin login page
├── complaints.html     # Admin dashboard
├── style.css           # Unified styling
├── script.js           # Application logic
└── README.md           # This file
```

---

## 🚀 Setup Instructions

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "RAISE Complaints" (or any name you prefer)
4. The script will automatically create a sheet named "Complaints" with proper headers

### Step 2: Set Up Google Drive Folder (Optional)

For photo storage:

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder named "RAISE Photos"
3. Right-click the folder → Share → Change to "Anyone with the link"
4. Copy the folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/YOUR_FOLDER_ID_HERE
   ```

### Step 3: Deploy Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Copy and paste the entire code from `Google Apps Script - Backend Code`
4. **Configuration (in the script):**
   ```javascript
   const SHEET_NAME = 'Complaints'; // Name of your sheet tab
   const DRIVE_FOLDER_ID = 'YOUR_FOLDER_ID_HERE'; // Optional: For photo upload
   ```
5. Click **Save** (💾 icon)
6. Click **Deploy → New Deployment**
7. Settings:
   - Click the gear icon ⚙️ next to "Select type"
   - Choose **Web app**
   - Description: "RAISE Complaint System"
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy**
9. Authorize the script (you may need to click "Advanced" and "Go to [Project Name] (unsafe)")
10. **Copy the Web App URL** - it looks like:
    ```
    https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
    ```

### Step 4: Configure Your HTML Files

1. Open `script.js`
2. Replace the configuration at the top:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';
   ```
   With your actual URL:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```

### Step 5: Test the Setup

1. Open `index.html` in a browser
2. Fill out the form
3. Click Submit
4. Check your Google Sheet - you should see the new entry
5. Test admin login:
   - Username: `admin`
   - Password: `admin123`

---

## ⚙️ Configuration

### Admin Credentials

Edit in `script.js`:
```javascript
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};
```

**⚠️ Important:** For production, implement proper backend authentication!

### Photo Upload Options

**Option 1: Google Drive (Recommended)**
- Set `DRIVE_FOLDER_ID` in Google Apps Script
- Photos stored as files with public links
- Best for production use

**Option 2: Base64 Storage**
- Leave `DRIVE_FOLDER_ID` empty
- Photos stored as Base64 strings in sheet
- Not recommended for many/large images

### Demo Mode

For testing without Google Sheets:
```javascript
// In script.js
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
// Leave as-is to use localStorage demo mode
```

---

## 📱 Usage

### For Passengers

1. **Scan QR Code:**
   ```
   https://your-domain.com/index.html?assetcode=ASSET-ID
   ```

2. **Fill Form:**
   - Name (optional)
   - Mobile (optional)
   - Complaint Type (required)
   - Description (required)
   - Location (auto-detected)
   - Photo (optional)

3. **Submit & Share:**
   - Click "Submit Complaint"
   - Share on WhatsApp if needed

### For Admins

1. **Login:**
   - Navigate to `admin.html`
   - Enter credentials (default: admin/admin123)

2. **View Dashboard:**
   - See real-time statistics
   - Search/filter complaints
   - Update complaint status

3. **Manage Complaints:**
   - Click "Update" button on any complaint
   - Change status: Pending → In Progress → Resolved

---

## 🔐 Admin Access

### Default Credentials
- **Username:** `admin`
- **Password:** `admin123`

### Session Management
- Login creates a session (sessionStorage)
- Automatically logs out when closing browser
- Manual logout button in dashboard

### Security Notes
⚠️ **Important:** Current implementation uses client-side authentication for demo purposes.

**For Production:**
- Implement server-side authentication
- Use JWT tokens or session cookies
- Add password hashing (bcrypt)
- Implement rate limiting
- Add CAPTCHA for login attempts

---

## 🎨 Customization

### Branding

**Logo:** Replace the `IR` text in `.logo` class:
```css
.logo {
    /* Add background-image with your logo */
    background-image: url('path/to/logo.png');
    background-size: cover;
}
```

**Colors:** Edit in `style.css`:
```css
/* Navy Blue */
#003366

/* Saffron */
#FF9933

/* White */
#FFFFFF
```

### Form Fields

Add custom fields in `index.html`:
```html
<div class="form-group">
    <label>Custom Field <span class="required">*</span></label>
    <input type="text" id="customField" required>
</div>
```

Update Google Sheets columns accordingly.

---

## 🐛 Troubleshooting

### Issue: "Failed to submit complaint"

**Solutions:**
1. Check `GOOGLE_SCRIPT_URL` is correct
2. Verify Apps Script is deployed with "Anyone" access
3. Check browser console for errors (F12 → Console)
4. Test with demo mode first (leave URL as default)

### Issue: "Failed to load complaints"

**Solutions:**
1. Verify GET request is enabled in Apps Script
2. Check `doGet()` function exists
3. Ensure sheet has data
4. Test the URL directly in browser: `YOUR_URL?action=get`

### Issue: Photos not uploading

**Solutions:**
1. Set `DRIVE_FOLDER_ID` in Apps Script
2. Verify folder permissions (Anyone with link)
3. Check file size (max 5MB)
4. Review Apps Script logs: Apps Script → View → Logs

### Issue: Admin login not working

**Solutions:**
1. Clear browser cache and localStorage
2. Check credentials in `script.js`
3. Open browser console (F12) for errors
4. Try incognito/private browsing mode

### Issue: WhatsApp share not working

**Solutions:**
1. Test on mobile device
2. Ensure WhatsApp is installed
3. Check message encoding
4. Try shorter messages

---

## 🚀 Deployment

### Option 1: GitHub Pages

1. Create GitHub repository
2. Upload all files
3. Go to Settings → Pages
4. Select branch: main
5. Your site: `https://username.github.io/raise/`

### Option 2: Netlify

1. Sign up at [Netlify](https://netlify.com)
2. Drag and drop your folder
3. Get instant URL

### Option 3: Your Own Server

1. Upload files via FTP
2. Ensure server supports HTTPS
3. No special server requirements (static files)

---

## 📊 Google Sheet Structure

| Column | Description | Example |
|--------|-------------|---------|
| Timestamp | Submission date/time | 31/10/2025, 10:30:00 AM |
| Name | Passenger name | John Doe |
| Mobile | Contact number | 9876543210 |
| Complaint Type | Category | Cleanliness |
| Description | Detailed complaint | Toilet not cleaned |
| Location | GPS coordinates | 13.0827, 80.2707 |
| Asset ID | QR code asset ID | MAS-RR-023 |
| Photo | Drive link or Base64 | https://drive.google.com/... |
| Status | Current status | Pending/In Progress/Resolved |

---

## 🔗 Creating QR Codes

### Using Online Generator

1. Go to [QR Code Generator](https://www.qr-code-generator.com/)
2. URL: `https://your-domain.com/index.html?assetcode=ASSET-001`
3. Download QR code
4. Print and place at asset location

### Bulk Generation

Use the existing QR code generator from your previous files to generate multiple codes at once.

---

## 📈 Future Enhancements

- [ ] Email notifications for new complaints
- [ ] SMS alerts for status updates
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Export to PDF/Excel
- [ ] Mobile app version
- [ ] Automated response system
- [ ] Integration with Railway CRM

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review browser console for errors
- Test with demo mode first
- Verify Google Apps Script permissions

---

## 📄 License

This project is created for Indian Railways - Southern Railway, Chennai Division.

**Commercial Branch Initiative**

---

## 🙏 Credits

**Developed for:**
Commercial Branch, Southern Railway – Chennai Division

**Technology Stack:**
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Backend: Google Apps Script
- Storage: Google Sheets + Google Drive
- Styling: Custom CSS (Railway theme)

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Status:** Production Ready

---

## Quick Start Checklist

- [ ] Create Google Sheet
- [ ] Create Google Drive folder (optional)
- [ ] Set up Google Apps Script
- [ ] Deploy as Web App
- [ ] Copy deployment URL
- [ ] Update `script.js` with URL
- [ ] Test complaint submission
- [ ] Test admin login
- [ ] Create QR codes
- [ ] Deploy to hosting platform

**Ready to go! 🚀**