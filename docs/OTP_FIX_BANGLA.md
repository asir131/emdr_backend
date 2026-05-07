# OTP Email সমস্যা সমাধান (Bangla Guide)

## সমস্যা: Signup করার সময় OTP Email যাচ্ছে না

যখন signup করার চেষ্টা করা হয়, এই error আসে:
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

## দ্রুত সমাধান (Quick Fix)

### Option 1: Development Mode এ Email Skip করুন (সবচেয়ে সহজ)

যদি শুধু API test করতে চান email fix না করে, তাহলে `.env` file এ এটা add করুন:

```env
SKIP_EMAIL_SENDING=true
```

**এটা কি করবে:**
- Email পাঠানো skip হবে
- OTP তৈরি হবে এবং response এ পাবেন (`_dev_otp` field এ)
- Response থেকে OTP নিয়ে account verify করতে পারবেন
- **শুধু development mode এ কাজ করবে** (`NODE_ENV=development`)

**এটা add করার পর server restart করুন।**

---

### Option 2: SMTP Connection Test করুন

এই script run করুন সমস্যা কোথায় দেখার জন্য:

```bash
node scratch/test_smtp_connection.js
```

এটা করবে:
- SMTP connection test করবে
- বিস্তারিত error message দেখাবে
- সমাধানের পরামর্শ দেবে
- Test email পাঠানোর চেষ্টা করবে

---

## সাধারণ সমস্যা এবং সমাধান

### 1. Gmail App Password ভুল বা Expired (EAUTH Error)

**লক্ষণ:**
```
Error Code: EAUTH
Error Message: Invalid login: 535-5.7.8 Username and Password not accepted
```

**সমাধান:**

1. **Google Account এ যান:** https://myaccount.google.com/
2. **2-Step Verification চালু করুন** (এটা লাগবেই App Password এর জন্য)
3. **App Passwords এ যান:** https://myaccount.google.com/apppasswords
4. **নতুন App Password তৈরি করুন:**
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → লিখুন "MY EMDR"
   - "Generate" এ click করুন
5. **16-character password copy করুন** (format: `xxxx xxxx xxxx xxxx`)
6. **`.env` file update করুন:**
   ```env
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```
7. **Server restart করুন**

**গুরুত্বপূর্ণ:**
- App Password ব্যবহার করুন, সাধারণ Gmail password নয়
- 2-Step Verification চালু না থাকলে App Password কাজ করবে না
- Password এ space থাকবে (Gmail এর format)

---

### 2. Connection Timeout (Network সমস্যা)

**লক্ষণ:**
```
Error Code: ESOCKET or ETIMEDOUT
Error Message: Connection timeout
```

**সমাধান:**

**Alternative Port ব্যবহার করুন (465 with SSL):**
`.env` update করুন:
```env
EMAIL_PORT=465
EMAIL_SECURE=true
```

**Firewall Check করুন:**
- Windows Firewall এ Node.js allow করুন
- Antivirus এ Node.js এর জন্য exception add করুন

---

### 3. Environment Variables Missing

**সমস্যা:**
```
Error: EMAIL_USER or EMAIL_PASS not set
```

**সমাধান:**
`.env` file এ সব email settings আছে কিনা check করুন:
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

## Test করার পদ্ধতি

### 1. SMTP Connection Test
```bash
node scratch/test_smtp_connection.js
```

### 2. Signup API Test

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

**Success Response:**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful. Please verify your email with the OTP sent.",
    "email": "test@example.com",
    "user": { ... },
    "session": { ... },
    "_dev_otp": "123456"  // Development mode এ পাবেন
  }
}
```

### 3. OTP Verify করুন

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

## Development এর জন্য Recommended Setup

### সবচেয়ে সহজ পদ্ধতি:

1. **`.env` file এ add করুন:**
   ```env
   NODE_ENV=development
   SKIP_EMAIL_SENDING=true
   ```

2. **Server restart করুন:**
   ```bash
   npm run dev
   ```

3. **Signup করুন - Response এ OTP পাবেন:**
   ```json
   {
     "success": true,
     "data": {
       "_dev_otp": "123456"
     }
   }
   ```

4. **এই OTP দিয়ে account verify করুন**

---

## যা করা হয়েছে (Changes Made)

### Modified Files:
1. **`src/utils/sendEmail.ts`**
   - Better error logging add করা হয়েছে
   - Development mode skip flag support add করা হয়েছে
   - Specific error messages add করা হয়েছে

2. **`src/config/env.ts`**
   - `SKIP_EMAIL_SENDING` environment variable add করা হয়েছে

3. **`scratch/test_smtp_connection.js`** (NEW)
   - SMTP connection test করার script
   - Detailed troubleshooting advice দেয়

4. **`docs/OTP_EMAIL_TROUBLESHOOTING.md`** (NEW)
   - বিস্তারিত troubleshooting guide (English)

5. **`docs/OTP_FIX_BANGLA.md`** (NEW)
   - এই Bangla guide

---

## এখন কি করবেন?

### Development এর জন্য (Testing):

1. **`.env` file খুলুন**
2. **এই line add করুন:**
   ```env
   SKIP_EMAIL_SENDING=true
   ```
3. **Server restart করুন:**
   ```bash
   npm run dev
   ```
4. **Signup test করুন - Response এ `_dev_otp` পাবেন**

### Production এর জন্য (Real Email):

1. **Gmail App Password তৈরি করুন** (উপরের instructions দেখুন)
2. **`.env` file এ update করুন:**
   ```env
   EMAIL_PASS=your-new-app-password
   ```
3. **`SKIP_EMAIL_SENDING` line remove করুন বা comment করুন:**
   ```env
   # SKIP_EMAIL_SENDING=true
   ```
4. **Test করুন:**
   ```bash
   node scratch/test_smtp_connection.js
   ```
5. **Server restart করুন**

---

## সাহায্য দরকার?

1. **Server logs check করুন** - বিস্তারিত error message পাবেন
2. **Diagnostic script run করুন:** `node scratch/test_smtp_connection.js`
3. **Development mode use করুন:** `SKIP_EMAIL_SENDING=true` set করুন

---

**শেষ আপডেট:** ৪ মে, ২০২৬
