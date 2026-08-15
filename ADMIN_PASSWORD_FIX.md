# Admin and SuperAdmin Login Authentication Fix

## Problem Summary

**Symptom:** Admin and SuperAdmin login returns 400 with "Invalid email or password"

**Root Cause:** Double password hashing in the seed script. The `seed.ts` file was updating existing users' passwords on every server restart:

```typescript
existing.password = userData.password;  // Sets plain text
await existing.save();                   // Pre-save hook hashes it
```

This caused passwords to be hashed multiple times (once per server restart), making bcrypt.compare() fail because the stored hash didn't match the expected single hash.

---

## Files Changed

### 1. `server/src/config/seed.ts`

**Lines 29-42:** Fixed double hashing issue

**Before:**
```typescript
for (const userData of usersToSeed) {
  const existing = await User.findOne({ 
    $or: [{ email: userData.email }, { role: userData.role }] 
  });
  if (!existing) {
    await User.create(userData);
  } else {
    existing.password = userData.password;  // ❌ Double hashes on restart
    await existing.save();
  }
}
```

**After:**
```typescript
for (const userData of usersToSeed) {
  const existing = await User.findOne({
    $or: [{ email: userData.email }, { role: userData.role }]
  });
  if (!existing) {
    // Create new user - pre-save hook will hash password
    await User.create(userData);
    console.log(`[SEED] Created default user: ${userData.email} (${userData.role})`);
  } else {
    // Only update non-password fields to prevent double hashing
    // Password is only set on initial creation
    console.log(`[SEED] Default user already exists: ${existing.email} (${existing.role}) - skipping password update`);
  }
}
```

**Why:** Password is now only set during initial user creation. Subsequent server restarts skip password updates, preventing double hashing.

### 2. `server/src/controllers/authController.ts`

**Lines 648-650:** Fixed double hashing in resetPassword()

**Before:**
```typescript
// Hash new password
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

// Update password
user.password = hashedPassword;
await user.save();  // ❌ Pre-save hook hashes again
```

**After:**
```typescript
// Set new password - pre-save hook will hash it
user.password = newPassword;
await user.save();
```

**Why:** Removed manual bcrypt.hash() since the User model's pre-save hook already handles hashing.

### 3. `server/src/config/fixAdminPasswords.ts` (NEW FILE)

**Purpose:** Migration script to reset existing Admin and SuperAdmin passwords to their default values with single hashing.

**Features:**
- Reads default passwords from environment variables
- Sets plain text passwords (pre-save hook hashes exactly once)
- Safe and idempotent (can be run multiple times)
- Provides clear console output

---

## Environment Variables

### Required for Default Passwords

Add to `server/.env`:

```bash
# Default Admin Credentials
SUPER_ADMIN_EMAIL=superadmin@aicrm.com
SUPER_ADMIN_PASSWORD=Super12!
ADMIN_EMAIL=admin@aicrm.com
ADMIN_PASSWORD=Admin12!
```

**Note:** If these variables are not set, the script uses the hardcoded defaults shown above.

---

## Migration Commands

### Step 1: Run Migration Script

Navigate to server directory and run:

```bash
cd server
npx ts-node src/config/fixAdminPasswords.ts
```

**Expected Output:**
```
[MIGRATION] Connected to MongoDB
[MIGRATION] Starting password fix for default users...
[MIGRATION] Found SuperAdmin: superadmin@aicrm.com (role: SuperAdmin)
[MIGRATION] ✓ SuperAdmin password reset successfully
[MIGRATION] Found Admin: admin@aicrm.com (role: Admin)
[MIGRATION] ✓ Admin password reset successfully
[MIGRATION] ✓ Password fix completed successfully
[MIGRATION] You can now login with:
[MIGRATION]   SuperAdmin: superadmin@aicrm.com / Super12!
[MIGRATION]   Admin: admin@aicrm.com / Admin12!
[MIGRATION] Disconnected from MongoDB
```

### Step 2: Restart Server

```bash
npm run dev
```

**Expected Output:**
```
===========================================
🚀 AI CRM Server running on port 5000
🔧 Node Environment: development
🔗 API Base URL: http://localhost:5000/api
===========================================
✅ MongoDB Atlas connected successfully.
[SEED] Default user already exists: superadmin@aicrm.com (SuperAdmin) - skipping password update
[SEED] Default user already exists: admin@aicrm.com (Admin) - skipping password update
✓ Default account password synced: superadmin@aicrm.com (SuperAdmin)
✓ Default account password synced: admin@aicrm.com (Admin)
```

---

## Testing

### Test Admin Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aicrm.com","password":"Admin12!"}'
```

**Expected Response:** 200 with accessToken and user data

### Test SuperAdmin Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@aicrm.com","password":"Super12!"}'
```

**Expected Response:** 200 with accessToken and user data

### Test Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!"}'
```

**Expected Response:** 201 with accessToken and user data

### Test Google Login

Use the frontend Google Login button - should return 200

---

## Verification Checklist

After migration and server restart:

- [ ] SuperAdmin login succeeds with `superadmin@aicrm.com` / `Super12!`
- [ ] Admin login succeeds with `admin@aicrm.com` / `Admin12!`
- [ ] New user registration works
- [ ] Google login works
- [ ] Password reset (forgot password) works
- [ ] Server logs show "skipping password update" for existing users
- [ ] No double hashing occurs on subsequent server restarts

---

## Architecture Preservation

### What Was NOT Changed

- ✅ User model pre-save hook (still hashes passwords)
- ✅ User.password select: false (still hidden by default)
- ✅ login() uses .select('+password') (still fetches password)
- ✅ user.comparePassword() method (still verifies passwords)
- ✅ JWT and refresh token functionality (unchanged)
- ✅ Role-based access control (unchanged)
- ✅ Admin and SuperAdmin roles (unchanged)

### What Was Fixed

- ✅ Seed script no longer double-hashes passwords on restart
- ✅ resetPassword() no longer double-hashes passwords
- ✅ Migration script resets existing passwords to single hash
- ✅ Environment variables for default passwords

---

## Security Notes

### Password Storage
- Passwords are stored as bcrypt hashes (never plain text)
- Pre-save hook ensures all passwords are hashed exactly once
- Migration script uses plain text temporarily (only in memory, never stored)

### Environment Variables
- Default passwords are configurable via environment variables
- In production, use strong, unique passwords
- Do not commit actual passwords to source code

### Migration Safety
- Migration script is idempotent (safe to run multiple times)
- Only affects Admin and SuperAdmin accounts
- Does not affect regular user accounts
- Does not modify any other user data

---

## TypeScript Build Check

Run TypeScript compiler to verify no errors:

```bash
cd server
npx tsc --noEmit
```

**Expected:** No compilation errors

---

## Summary of Changes

| File | Lines Changed | Type | Purpose |
|------|---------------|------|---------|
| `server/src/config/seed.ts` | 29-42 | Fix | Prevent double hashing on server restart |
| `server/src/controllers/authController.ts` | 648-650 | Fix | Prevent double hashing in resetPassword() |
| `server/src/config/fixAdminPasswords.ts` | NEW | Migration | Reset existing Admin/SuperAdmin passwords |

**Total Files Changed:** 3 (2 modified, 1 new)
**Total Lines Changed:** ~30 lines

---

## Root Cause Summary

**The login failure was caused by:**
1. Seed script updating existing users' passwords on every server restart
2. Password being set to plain text, then hashed by pre-save hook
3. Multiple restarts causing multiple hash layers
4. bcrypt.compare() failing because stored hash didn't match expected single hash

**The fix:**
1. Seed script now skips password updates for existing users
2. resetPassword() removed manual bcrypt.hash()
3. Migration script resets passwords to single hash
4. Environment variables for configurable default passwords

---

## Next Steps

1. **Run migration script:** `npx ts-node src/config/fixAdminPasswords.ts`
2. **Restart server:** `npm run dev`
3. **Test Admin login:** Use admin@aicrm.com / Admin12!
4. **Test SuperAdmin login:** Use superadmin@aicrm.com / Super12!
5. **Verify other features:** Registration, Google login, password reset
6. **Deploy to production:** Commit changes and push to trigger Vercel deployment

---

## Production Deployment

### Vercel Environment Variables

Add these to your Vercel project settings:

```bash
SUPER_ADMIN_EMAIL=superadmin@aicrm.com
SUPER_ADMIN_PASSWORD=<your-production-superadmin-password>
ADMIN_EMAIL=admin@aicrm.com
ADMIN_PASSWORD=<your-production-admin-password>
```

### Production Migration

For production, you may need to run the migration script against your production database:

```bash
npx ts-node src/config/fixAdminPasswords.ts
```

**Note:** Ensure you have the correct `MONGO_URI` set in your production environment before running the migration.

---

## Troubleshooting

### Migration Fails

If the migration script fails:
1. Check MongoDB connection string in `.env`
2. Verify MongoDB Atlas IP whitelist includes your IP
3. Ensure database user has write permissions

### Login Still Fails After Migration

If login still fails after migration:
1. Verify migration script ran successfully
2. Check server logs for any errors
3. Try running migration script again
4. Verify environment variables are set correctly

### Password Reset Not Working

If password reset (forgot password) doesn't work:
1. Check SMTP configuration in `.env`
2. Verify OTP is being generated correctly
3. Check email service logs
4. Ensure OTP expiry is not too short

---

## Contact

If issues persist after following these steps:
1. Check server logs for detailed error messages
2. Verify MongoDB Atlas connection status
3. Check Vercel deployment logs (if deployed)
4. Review browser console for frontend errors
