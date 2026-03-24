# Complete Authentication System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Endpoints](#authentication-endpoints)
4. [Security Features](#security-features)
5. [Error Handling](#error-handling)
6. [Testing Guide](#testing-guide)
7. [Frontend Integration](#frontend-integration)
8. [Best Practices](#best-practices)

---

## Overview

This is a production-ready authentication system built with Node.js, Express.js, MongoDB, and JWT. It implements industry-standard security practices including dual-token authentication, OTP verification, password recovery, and comprehensive error handling.

### Key Features

- ✅ Email/Password Authentication
- ✅ Email Verification with OTP
- ✅ Dual Token System (Access + Refresh)
- ✅ Password Recovery Flow
- ✅ Secure Logout
- ✅ Token Refresh & Rotation
- ✅ Rate Limiting
- ✅ Account Security (Login Attempts, Account Lock)
- ✅ Comprehensive Error Handling
- ✅ TypeScript Support

### Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **Email**: Nodemailer
- **Security**: Helmet, express-rate-limit, express-mongo-sanitize

---

## Architecture

### Token System

```
┌─────────────────────────────────────────────────────────────┐
│                    DUAL TOKEN ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ACCESS TOKEN              REFRESH TOKEN                     │
│  ├─ Lifetime: 15 minutes   ├─ Lifetime: 7 days             │
│  ├─ Storage: Client        ├─ Storage: Client + Database    │
│  ├─ Purpose: API Access    ├─ Purpose: Token Renewal        │
│  └─ Not in Database        └─ Hashed in Database            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
SIGNUP → EMAIL VERIFICATION → LOGIN → ACCESS RESOURCES → LOGOUT
   ↓            ↓                ↓            ↓              ↓
Generate     Verify OTP      Generate    Use Access    Invalidate
Account      & Activate      Tokens      Token         Tokens
```


---

## Authentication Endpoints

### 1. User Signup

**Endpoint**: `POST /api/auth/signup`

**Description**: Register a new user account. Generates OTP and sends verification email.

**Rate Limit**: 5 requests per 10 minutes

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123"
}
```

**Validation Rules**:
- `firstName`: 2-30 characters, letters only
- `lastName`: 2-30 characters, letters only
- `email`: Valid email format
- `password`: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- `confirmPassword`: Must match password

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "message": "Registration successful. Please verify your email with the OTP sent.",
    "email": "john.doe@example.com",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "authProvider": "email",
      "isProfileCompleted": false
    },
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2024-01-15T10:45:00.000Z"
    },
    "_dev_otp": "123456"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `409 Conflict`: Email already exists (if verified)
- `500 Internal Server Error`: Server error

**Special Behavior**:
- If email exists but is not verified, resends OTP with new tokens
- OTP is only visible in development mode (`_dev_otp`)
- Tokens are generated immediately for seamless verification flow

---

### 2. Verify Email (with OTP)

**Endpoint**: `POST /api/auth/verify-otp`

**Description**: Verify user email using OTP sent during signup.

**Rate Limit**: 10 requests per 10 minutes

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "otp": "123456"
}
```

**Validation Rules**:
- `email`: Valid email format
- `otp`: Exactly 6 digits

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "isVerified": true,
      "authProvider": "email",
      "isProfileCompleted": false
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:35:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid OTP, OTP expired, or already verified
- `404 Not Found`: User not found
- `429 Too Many Requests`: OTP attempts exceeded (max 5)

**Security Features**:
- OTP expires after 10 minutes
- Maximum 5 verification attempts
- OTP is hashed in database

---

### 3. Verify Email (with Token)

**Endpoint**: `POST /api/auth/verify-email-with-token`

**Description**: Verify email using access token from signup response.

**Authentication**: Required (Bearer Token)

**Rate Limit**: 10 requests per 10 minutes

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "otp": "123456"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "isVerified": true,
      "authProvider": "email",
      "isProfileCompleted": false
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Invalid OTP or already verified
- `404 Not Found`: User not found

**Use Case**: Preferred method when user has access token from signup

---

### 4. Resend OTP

**Endpoint**: `POST /api/auth/resend-otp`

**Description**: Request a new OTP if previous one expired or was not received.

**Rate Limit**: 10 requests per 10 minutes

**Request Body**:
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully to your email",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "_dev_otp": "654321"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Email already verified
- `404 Not Found`: User not found

**Features**:
- Generates new OTP
- Resets attempt counter
- Returns new access token

---

### 5. User Login

**Endpoint**: `POST /api/auth/login`

**Description**: Authenticate user and generate session tokens.

**Rate Limit**: 10 requests per 15 minutes

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass@123"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "isVerified": true
    },
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2024-01-15T10:45:00.000Z"
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Email not verified
- `429 Too Many Requests`: Account locked (after 5 failed attempts)

**Security Features**:
- Password hashed with bcrypt
- Login attempt tracking
- Account lock after 5 failed attempts (30 minutes)
- Refresh token hashed and stored in database
- Last login timestamp updated


---

### 6. Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`

**Description**: Initiate password recovery process. Sends OTP to user's email.

**Rate Limit**: 10 requests per 10 minutes

**Request Body**:
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to your email for password reset.",
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2024-01-15T10:45:00.000Z"
    },
    "_dev_otp": "789012"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid email format

**Security Features**:
- Does not reveal if email exists (returns success either way)
- Generates recovery OTP (separate from verification OTP)
- OTP expires in 10 minutes
- Maximum 5 verification attempts

---

### 7. Verify Recovery OTP

**Endpoint**: `POST /api/auth/send-verification-otp`

**Description**: Verify recovery OTP before allowing password reset.

**Rate Limit**: 10 requests per 10 minutes

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "otp": "789012"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "OTP verified successfully. You can now reset your password.",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid OTP, expired, or no OTP found
- `404 Not Found`: User not found
- `429 Too Many Requests`: Attempts exceeded

**Note**: Access token is required for the next step (recover account)

---

### 8. Recover Account (Reset Password)

**Endpoint**: `POST /api/auth/recover-account`

**Description**: Set new password after OTP verification.

**Authentication**: Required (Bearer Token from step 7)

**Rate Limit**: 10 requests per 10 minutes

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "newPassword": "NewSecurePass@456",
  "confirmPassword": "NewSecurePass@456"
}
```

**Validation Rules**:
- `newPassword`: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- `confirmPassword`: Must match newPassword

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully."
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Validation error
- `404 Not Found`: User not found

**Security Features**:
- Old password is replaced
- Login attempts reset
- Account unlock (if locked)
- User must login again with new password

---

### 9. Refresh Access Token

**Endpoint**: `POST /api/auth/refresh-token`

**Description**: Generate new access token using refresh token.

**Authentication**: Not required (uses refresh token)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note**: In production, `refreshToken` in response is a new token (rotation enabled)

**Error Responses**:
- `401 Unauthorized`: Invalid, expired, or reused refresh token
- `400 Bad Request`: Missing refresh token
- `404 Not Found`: User not found

**Security Features**:
- Verifies JWT signature
- Checks against database hash
- Token rotation in production (new refresh token generated)
- Detects token reuse (invalidates all sessions if detected)

---

### 10. Logout

**Endpoint**: `POST /api/auth/logout`

**Description**: Logout user and invalidate refresh token.

**Authentication**: Required (Bearer Token)

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "meta": {
    "timestamp": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid access token or refresh token
- `400 Bad Request`: Missing refresh token or no active session
- `404 Not Found`: User not found

**Security Features**:
- Verifies both access and refresh tokens
- Deletes refresh token from database
- Prevents token reuse
- Client must clear tokens from storage

**Client-Side Actions Required**:
```javascript
// Clear tokens from storage
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');

// Clear axios default header
delete axios.defaults.headers.common['Authorization'];

// Redirect to login
window.location.href = '/login';
```


---

## Security Features

### 1. Password Security

**Hashing Algorithm**: bcrypt with salt rounds = 10

**Password Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)

**Example Valid Passwords**:
- `SecurePass@123`
- `MyP@ssw0rd`
- `Test@1234`

### 2. Token Security

**Access Token**:
- Lifetime: 15 minutes
- Algorithm: HS256 (HMAC SHA-256)
- Storage: Client-side only
- Not stored in database
- Stateless verification

**Refresh Token**:
- Lifetime: 7 days
- Algorithm: HS256 (HMAC SHA-256)
- Storage: Client-side + Database (hashed)
- Hashed with bcrypt before storage
- Verified against database on use

**Token Payload**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "user",
  "isVerified": true,
  "iat": 1642248000,
  "exp": 1642248900
}
```

### 3. OTP Security

**Generation**:
- 6-digit random number
- Cryptographically secure (crypto.randomInt)

**Storage**:
- Hashed with bcrypt before database storage
- Never stored in plain text

**Expiration**:
- Verification OTP: 10 minutes
- Recovery OTP: 10 minutes

**Attempt Limits**:
- Maximum 5 attempts per OTP
- Counter resets on new OTP generation

**Types**:
- `otp`: Email verification OTP
- `recoveryOtp`: Password recovery OTP

### 4. Rate Limiting

**Signup Endpoint**:
- Window: 10 minutes
- Max Requests: 5
- Purpose: Prevent spam registrations

**Login Endpoint**:
- Window: 15 minutes
- Max Requests: 10
- Purpose: Prevent brute force attacks

**OTP Endpoints**:
- Window: 10 minutes
- Max Requests: 10
- Purpose: Prevent OTP abuse

**Response on Limit Exceeded**:
```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many login attempts"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 5. Account Security

**Login Attempt Tracking**:
- Tracks failed login attempts
- Increments on wrong password
- Resets on successful login

**Account Lock**:
- Triggered after 5 failed login attempts
- Lock duration: 30 minutes
- Automatic unlock after duration

**Lock Response**:
```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Account locked. Try again later"
  }
}
```

### 6. Token Rotation (Production Only)

**Purpose**: Detect and prevent token theft

**How It Works**:
1. User requests token refresh
2. Backend verifies old refresh token
3. Backend generates new access + refresh tokens
4. Old refresh token is invalidated
5. New tokens returned to client

**Token Reuse Detection**:
- If old refresh token is used again
- All sessions are invalidated
- User must login again

**Configuration**:
```typescript
const ENABLE_REFRESH_TOKEN_ROTATION = env.NODE_ENV === 'production';
```

### 7. Input Validation & Sanitization

**Validation Library**: Zod

**Sanitization**:
- Email: Lowercase, trimmed
- Names: Trimmed, letters only
- Passwords: No sanitization (preserve special characters)

**MongoDB Injection Prevention**:
- express-mongo-sanitize middleware
- Removes `$` and `.` from user input

### 8. Security Headers

**Helmet Middleware**:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)

**CORS Configuration**:
- Configurable allowed origins
- Credentials support
- Preflight handling

### 9. Error Handling

**Principle**: Never expose sensitive information

**Generic Errors**:
- "Invalid email or password" (not "Email not found")
- "Invalid or expired token" (not specific reason)

**Development vs Production**:
- Development: Detailed error messages, stack traces
- Production: Generic messages, no stack traces

