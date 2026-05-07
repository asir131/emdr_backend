# OTP Email System Troubleshooting Guide

## Problem: OTP Email Not Sending During Signup

When users try to sign up, they receive an error:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Failed to send verification email. Please try again."
  }
}
```

---

## Quick Fix Options

### Option 1: Skip Email Sending in Development Mode (Fastest)

If you just want to test the API without fixing email, add this to your `.env` file:

```env
SKIP_EMAIL_SENDING=true
```

**What this does:**
- Skips actual email sending
- OTP is still generated and returned in the response (in `_dev_otp` field)
- You can use the OTP from the response to verify the account
- **Only works in development mode** (`NODE_ENV=development`)

**Restart your server after adding this.**

---

### Option 2: Test SMTP Connection (Diagnose the Problem)

Run the diagnostic script to see what's wrong:

```bash
node scratch/test_smtp_connection.js
```

This will:
- Test your SMTP connection
- Show detailed error messages
- Provide specific troubleshooting advice
- Try to send a test email

---

## Common Issues and Solutions

### 1. Gmail App Password Invalid (EAUTH Error)

**Symptoms:**
```
Error Code: EAUTH
Error Message: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solution:**
1. Go to your Google Account: https://myaccount.google.com/
2. Enable **2-Step Verification** (required for App Passwords)
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Generate a new App Password:
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Enter "MY EMDR"
   - Click "Generate"
5. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
6. Update your `.env` file:
   ```env
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```
7. Restart your server

**Important Notes:**
- Use the App Password, NOT your regular Gmail password
- App Passwords only work if 2-Step Verification is enabled
- The password should have spaces (Gmail format)

---

### 2. Connection Timeout (ESOCKET/ETIMEDOUT Error)

**Symptoms:**
```
Error Code: ESOCKET or ETIMEDOUT
Error Message: Connection timeout
```

**Possible Causes:**
- Firewall blocking SMTP port 587
- Antivirus blocking outgoing connections
- Network restrictions
- ISP blocking SMTP

**Solutions:**

**Try Alternative Port (465 with SSL):**
Update your `.env`:
```env
EMAIL_PORT=465
EMAIL_SECURE=true
```

**Check Firewall:**
- Windows: Allow Node.js through Windows Firewall
- Antivirus: Add exception for Node.js

**Test Connection:**
```bash
telnet smtp.gmail.com 587
```
If this fails, your network is blocking SMTP.

---

### 3. Connection Refused (ECONNREFUSED Error)

**Symptoms:**
```
Error Code: ECONNREFUSED
Error Message: Connection refused
```

**Solution:**
Check your SMTP settings in `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

Make sure:
- `EMAIL_HOST` is correct
- `EMAIL_PORT` is correct (587 for TLS, 465 for SSL)
- `EMAIL_SECURE` matches the port (false for 587, true for 465)

---

### 4. Missing Environment Variables

**Symptoms:**
```
Error: EMAIL_USER or EMAIL_PASS not set
```

**Solution:**
Make sure your `.env` file has all required email settings:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=MY EMDR
```

---

## Testing the Fix

### 1. Test SMTP Connection
```bash
node scratch/test_smtp_connection.js
```

### 2. Test Signup API

**Request:**
```http
POST http://localhost:5005/api/auth/signup
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "Test@123456",
  "isAcceptPrivacyStatement": true
}
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful. Please verify your email with the OTP sent.",
    "email": "test@example.com",
    "user": { ... },
    "session": { ... },
    "_dev_otp": "123456"  // Only in development mode
  }
}
```

### 3. Verify OTP

**Request:**
```http
POST http://localhost:5005/api/auth/verify-otp
Content-Type: application/json

{
  "email": "test@example.com",
  "otp": "123456"
}
```

---

## Alternative Email Providers

If Gmail is not working, you can use other SMTP providers:

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASS=your-mailgun-password
```

### Mailtrap (Development Only)
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASS=your-mailtrap-password
```

---

## Development Workflow

### Recommended Setup for Development:

1. **Use Skip Email Mode:**
   ```env
   NODE_ENV=development
   SKIP_EMAIL_SENDING=true
   ```

2. **Get OTP from Response:**
   - Signup returns `_dev_otp` field in development mode
   - Use this OTP to verify the account
   - No need to check email

3. **Test Email Before Production:**
   - Remove `SKIP_EMAIL_SENDING` flag
   - Run `node scratch/test_smtp_connection.js`
   - Fix any issues before deploying

---

## Server Logs

When debugging, check your server console for detailed error messages:

```
❌ Email sending failed:
   Error Code: EAUTH
   Error Message: Invalid login: 535-5.7.8 Username and Password not accepted
   Command: AUTH PLAIN
   Response: 535-5.7.8 Username and Password not accepted...
```

These logs will help identify the exact problem.

---

## Need More Help?

1. **Check Server Logs:** Look for detailed error messages in your server console
2. **Run Diagnostic Script:** `node scratch/test_smtp_connection.js`
3. **Test with Postman:** Use the provided Postman collection to test signup
4. **Use Development Mode:** Set `SKIP_EMAIL_SENDING=true` to bypass email temporarily

---

## Summary of Changes Made

### Files Modified:
1. **`src/utils/sendEmail.ts`**
   - Added better error logging with error codes
   - Added development mode skip flag support
   - Added specific error messages for different failure types

2. **`src/config/env.ts`**
   - Added `SKIP_EMAIL_SENDING` environment variable

3. **`scratch/test_smtp_connection.js`** (NEW)
   - Diagnostic script to test SMTP connection
   - Provides detailed troubleshooting advice

4. **`docs/OTP_EMAIL_TROUBLESHOOTING.md`** (NEW)
   - This comprehensive troubleshooting guide

### Environment Variables Added:
```env
SKIP_EMAIL_SENDING=true  # Optional: Skip email in development
```

---

## Quick Start (Development Mode)

1. Add to `.env`:
   ```env
   SKIP_EMAIL_SENDING=true
   ```

2. Restart server:
   ```bash
   npm run dev
   ```

3. Test signup - OTP will be in the response:
   ```json
   {
     "success": true,
     "data": {
       "_dev_otp": "123456"
     }
   }
   ```

4. Use the OTP to verify the account

---

**Last Updated:** May 4, 2026
