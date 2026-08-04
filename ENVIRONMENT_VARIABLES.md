# Environment Variables Configuration

This document lists all required environment variables for the AI CRM application, including the new Password Reset with Email OTP Verification feature.

## Backend Environment Variables (.env)

### Database Configuration
```
MONGODB_URI=mongodb://localhost:27017/ai-crm
```

### Server Configuration
```
PORT=5000
NODE_ENV=development  # or 'production'
```

### JWT Authentication
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Google OAuth
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Email Configuration (SMTP) - Required for Password Reset
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=your-email@gmail.com
```

### Client URL
```
CLIENT_URL=http://localhost:5173
```

## Frontend Environment Variables (.env)

### Google OAuth
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_ENABLE_GOOGLE_OAUTH=true
```

**Note:** Set `VITE_ENABLE_GOOGLE_OAUTH=false` to disable Google Login and eliminate 403 console errors until Google Cloud Console is configured.

### API Base URL
```
VITE_API_URL=http://localhost:5000
```

## Password Reset Feature Specific Variables

### Required for Email OTP Functionality
- **SMTP_HOST**: Your SMTP server host (e.g., smtp.gmail.com, smtp.office365.com)
- **SMTP_PORT**: SMTP server port (587 for TLS, 465 for SSL)
- **SMTP_USER**: SMTP username (usually your email address)
- **SMTP_PASS**: SMTP password (use App Password for Gmail)
- **SMTP_FROM**: From email address for password reset emails

### Development Mode
- **NODE_ENV**: Set to `development` to see OTP codes in API response for testing
- **NODE_ENV**: Set to `production` to hide OTP codes (required for security)

## SMTP Setup Guide

### Gmail Setup (Recommended for Development)
1. Go to Google Account Settings → Security
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Generate a new App Password with name "AI CRM"
5. Use the generated password as SMTP_PASS

### Outlook/Office365 Setup
1. Go to Microsoft Account Security
2. Generate an App Password
3. Use your email as SMTP_USER and the app password as SMTP_PASS

### Other SMTP Providers
- SendGrid, Mailgun, AWS SES, etc.
- Use your provider's SMTP credentials

## Security Notes

### Production Deployment
- Never commit .env files to version control
- Use strong, randomly generated JWT_SECRET
- Use environment-specific SMTP credentials
- Set NODE_ENV=production in production
- Never expose SMTP credentials in client-side code

### Rate Limiting Configuration
The password reset endpoints have built-in rate limiting:
- Forgot Password: 5 requests per hour per IP
- OTP Verification: 10 requests per hour per IP
- Reset Password: 3 requests per hour per IP

## Testing Password Reset Flow

### Development Mode
1. Set NODE_ENV=development
2. OTP codes will be returned in API response as `devModeCode`
3. Use this code for testing without email setup

### Production Mode
1. Set NODE_ENV=production
2. OTP codes are only sent via email
3. SMTP configuration is required
4. No OTP codes are exposed in API responses

## MongoDB Collections

The password reset feature creates a new collection:
- **password_reset_otps**: Stores hashed OTPs with automatic expiration (TTL index: 5 minutes)

## API Endpoints

### Password Reset Flow
- `POST /api/auth/forgot-password` - Request OTP
- `POST /api/auth/verify-reset-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password with OTP

All endpoints include rate limiting headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time
- `Retry-After`: Seconds to wait (when rate limited)
