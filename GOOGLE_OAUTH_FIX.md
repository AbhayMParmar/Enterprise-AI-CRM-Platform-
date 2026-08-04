# Google OAuth Fix - Specific to Your Client ID

## Your Google Client ID
```
430228513739-cpmej2dicbr46bq1bmngkc42uo1m8rfr.apps.googleusercontent.com
```

## Immediate Fix Required

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project (the one with the above Client ID)
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Edit Your OAuth 2.0 Client ID
1. Find the client ID: `430228513739-cpmej2dicbr46bq1bmngkc42uo1m8rfr.apps.googleusercontent.com`
2. Click the **Edit** (pencil) icon

### Step 3: Add Authorized JavaScript Origins
**Add these exact origins:**
```
http://localhost:5173
http://localhost:3000
```

**Important:**
- Do NOT include trailing slashes
- Must be exact match (case-sensitive)
- Port numbers must be included

### Step 4: Add Authorized Redirect URIs
**Add these exact URIs:**
```
http://localhost:5000/api/auth/google/callback
```

### Step 5: Save Changes
1. Click **Save**
2. **Wait 5-10 minutes** for changes to propagate
3. Clear your browser cache
4. Restart your development server

### Step 6: Verify
After waiting, refresh your browser and check:
- Browser console should show: `[Google OAuth Debug]` with your client ID
- No more 403 errors in console
- Google Login button should load

## Current Server Status
✅ Backend server running on port 5000
✅ MongoDB connected successfully
✅ Google OAuth backend configured correctly
✅ SMTP configured (but needs SMTP_FROM fix)

## Forgot Password 500 Error Fix

The server logs show `SMTP_FROM` is set to 'NOT_SET'. Add this to your `server/.env`:

```bash
SMTP_FROM=your-email@gmail.com
```

Then restart the server:
```bash
# Stop the current server (Ctrl+C)
# Then restart
cd server && npm run dev
```

## Quick Test After Fixes

1. **Google OAuth:**
   - Refresh browser
   - Check console for `[Google OAuth Debug]`
   - Try Google Login button

2. **Forgot Password:**
   - Go to Forgot Password page
   - Enter an email
   - Check server terminal for `[Forgot Password]` logs
   - Should return 200 with `devModeCode` in development

## If Issues Persist

Check browser console for:
- `[Google OAuth Debug]` - shows client ID and origin
- Any remaining 403 errors

Check server terminal for:
- `[Google OAuth] Backend Configuration` - shows backend config
- `[Forgot Password]` - shows forgot password flow
- Any error messages
