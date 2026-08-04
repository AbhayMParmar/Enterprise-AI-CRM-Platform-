# Authentication Troubleshooting Guide

This guide helps you diagnose and fix Google OAuth 403 errors and Forgot Password 500 errors.

---

## Google OAuth 403 Error - "The given origin is not allowed for the given client ID"

### Root Cause
The Google Cloud Console project does not have your current origin (URL) configured as an authorized JavaScript origin.

### Solution Steps

#### 1. Get Your Current Origin
Check your browser console for the debug log I added:
```
[Google OAuth Debug] { clientId: '...', currentOrigin: 'http://localhost:5173' }
```

Your current origin will be one of:
- Development: `http://localhost:5173` or `http://localhost:3000`
- Production: `https://yourdomain.com`

#### 2. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (Web client)
5. Click **Edit** (pencil icon)

#### 3. Add Authorized JavaScript Origins

**For Development:**
```
http://localhost:5173
http://localhost:3000
```

**For Production:**
```
https://yourdomain.com
```

**Important:**
- Remove any origins you don't use
- Origins must match exactly (no trailing slashes)
- HTTP vs HTTPS must match
- Port numbers must be included for development

#### 4. Add Authorized Redirect URIs

**For Development:**
```
http://localhost:5000/api/auth/google/callback
```

**For Production:**
```
https://yourdomain.com/api/auth/google/callback
```

#### 5. Save and Wait
- Click **Save**
- Changes can take 5-10 minutes to propagate
- Clear browser cache and restart your dev server

#### 6. Verify Environment Variables

**Frontend (.env):**
```bash
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

**Backend (.env):**
```bash
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

**Check in Console:**
- Frontend: Look for `[Google OAuth Debug]` log in browser console
- Backend: Look for `[Google OAuth] Backend Configuration` log in terminal

#### 7. Restart Applications
After changing environment variables:
```bash
# Stop all processes
# Restart server
cd server && npm run dev

# Restart client
cd client && npm run dev
```

---

## Forgot Password 500 Error

### Root Causes & Solutions

#### 1. Missing SMTP Configuration

**Symptom:**
```
[Email Service] SMTP credentials not configured. Using JSON transport for development.
```

**Solution:**
Add these to your backend `.env` file:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@aicrm.com
```

#### 2. MongoDB Connection Issue

**Symptom:**
```
[MongoDB] Connection failed
```

**Solution:**
```bash
# Check MongoDB is running
mongod

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/ai-crm
```

#### 3. OTP Schema Not Created

**Symptom:**
```
[MongoDB] Collection 'password_reset_otps' does not exist
```

**Solution:**
The schema is already created at `server/src/models/PasswordResetOTP.ts`. MongoDB will create the collection automatically when the first OTP is generated.

#### 4. Bcrypt Import Error

**Symptom:**
```
Cannot find module 'bcrypt' or its corresponding type declarations
```

**Solution:**
I've already fixed this by changing imports from `bcrypt` to `bcryptjs`. The project uses `bcryptjs` which is already installed.

---

## Development Logging

I've added comprehensive development logging to help debug issues:

### Frontend Logs (Browser Console)
```
[Google OAuth Debug] {
  clientId: '123456789-abc...',
  clientIdFull: '123456789-abcdef...',
  currentOrigin: 'http://localhost:5173'
}
```

### Backend Logs (Terminal)
```
[Google OAuth] Backend Configuration: {
  clientId: '123456789-abc...',
  clientIdFull: '123456789-abcdef...',
  clientSecret: '***SET***'
}

[Google Login] Request received: {
  hasCredential: true,
  hasAccessToken: false,
  timestamp: '2026-08-01T...'
}

[Email Service] SMTP Configuration: {
  host: 'smtp.gmail.com',
  port: 587,
  user: 'you***',
  pass: '***SET***',
  from: 'noreply@aicrm.com'
}

[Forgot Password] Request received: {
  email: 'user@example.com',
  timestamp: '2026-08-01T...'
}
```

---

## Testing Checklist

### Google Login Test
- [ ] Frontend environment variable `VITE_GOOGLE_CLIENT_ID` is set
- [ ] Backend environment variables `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- [ ] Google Cloud Console has your origin in Authorized JavaScript Origins
- [ ] Google Cloud Console has your callback URL in Authorized Redirect URIs
- [ ] Browser console shows `[Google OAuth Debug]` with valid client ID
- [ ] Backend terminal shows `[Google OAuth] Backend Configuration` with valid client ID
- [ ] No 403 errors in browser console
- [ ] Google Login button works

### Forgot Password Test
- [ ] Backend environment variables for SMTP are set
- [ ] MongoDB is running and connected
- [ ] Backend terminal shows `[Email Service] Transporter created successfully`
- [ ] Forgot Password API returns 200 (not 500)
- [ ] In development mode, `devModeCode` is returned in response
- [ ] Email is sent (check your spam folder)

---

## Common Issues and Fixes

### Issue: "VITE_GOOGLE_CLIENT_ID is not set"
**Fix:** Add to `client/.env`:
```bash
VITE_GOOGLE_CLIENT_ID=your-client-id
```
Restart client: `cd client && npm run dev`

### Issue: "GOOGLE_CLIENT_ID not configured"
**Fix:** Add to `server/.env`:
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```
Restart server: `cd server && npm run dev`

### Issue: "Failed to verify Google ID token"
**Fix:** 
1. Verify `GOOGLE_CLIENT_ID` matches between frontend and backend
2. Check Google Cloud Console configuration
3. Ensure you're using the correct OAuth 2.0 Client ID (Web client)

### Issue: "SMTP credentials not configured"
**Fix:** Add SMTP environment variables to `server/.env` (see above)

### Issue: "Failed to send password reset email"
**Fix:**
1. Verify SMTP credentials are correct
2. For Gmail, use an App Password (not your regular password)
3. Check firewall/network settings
4. In development, the system will use JSON transport fallback (logs email to console)

---

## Gmail SMTP Setup (Recommended)

### 1. Enable 2-Factor Authentication
- Go to Google Account Settings → Security
- Enable 2-Step Verification

### 2. Generate App Password
- Go to Google Account Settings → Security → App Passwords
- Select "Mail" and your device
- Generate password (16-character code)

### 3. Use App Password in .env
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
```

---

## Production Deployment Checklist

### Google OAuth
- [ ] Update Google Cloud Console with production domain
- [ ] Remove localhost origins from production
- [ ] Set `NODE_ENV=production`
- [ ] Use production environment variables
- [ ] Verify HTTPS is enabled (Google requires HTTPS for production)

### SMTP
- [ ] Use production SMTP credentials (not development ones)
- [ ] Set `NODE_ENV=production`
- [ ] Verify SMTP service allows production traffic
- [ ] Test email sending in production environment

### Security
- [ ] Never commit `.env` files
- [ ] Use strong, randomly generated secrets
- [ ] Enable HTTPS in production
- [ ] Set appropriate CORS headers
- [ ] Review rate limiting settings

---

## Getting Help

If issues persist after following this guide:

1. **Check Browser Console** for frontend errors
2. **Check Backend Terminal** for server errors
3. **Review Logs** - I've added detailed logging for debugging
4. **Verify Environment Variables** - all required variables must be set
5. **Check Google Cloud Console** - origins and redirect URIs must match exactly

### Debug Mode
Set `NODE_ENV=development` to see:
- OTP codes in API responses
- Detailed error messages
- Stack traces
- SMTP configuration status

### Production Mode
Set `NODE_ENV=production` to:
- Hide OTP codes from responses
- Hide sensitive error details
- Use real SMTP configuration
- Enable security features
