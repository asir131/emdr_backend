# Assessment API - Email & Status Feature

## Overview
Assessment results now include `email` and `status` fields. Both users and admins can access assessment results, and admins can update the status.

## New Fields

### `email` (string)
- Automatically populated from user's account
- Shows which user submitted the assessment

### `status` (enum)
- **pending**: Default status when assessment is submitted
- **approved**: Admin has approved the assessment
- **cancelled**: Admin has cancelled/rejected the assessment

---

## API Endpoints

### 1. Get Assessment Result
**Endpoint:** `GET /api/assessment/result`

**Access:** User (own result) | Admin (any user's result)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters (Admin only):**
- `userId` (optional): Get specific user's assessment result

**User Request Example:**
```bash
GET /api/assessment/result
Authorization: Bearer <user_token>
```

**Admin Request Example:**
```bash
GET /api/assessment/result?userId=69c709d3cb049607feb74d9e
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "69fc065702320e407601a2a8",
    "userId": "69c709d3cb049607feb74d9e",
    "email": "user@example.com",
    "status": "pending",
    "phq9Answers": [3, 3, 2, 3, 3, 2, 2, 3, 3],
    "phq9Score": 24,
    "phq9Severity": "severe",
    "gad7Answers": [2, 2, 3, 2, 2, 2, 2],
    "gad7Score": 15,
    "gad7Severity": "severe",
    "des11Answers": [41.5, 39.5, 0, 40.5, 0, 37, 0, 36.5],
    "des11Score": 24.4,
    "currentStep": "completed",
    "isCompleted": true,
    "requiresProfessionalSupport": true,
    "totalScore": 63.4,
    "recommendation": "Your assessment scores suggest a high risk level. We recommend seeking professional support before beginning a self-guided program.",
    "createdAt": "2026-05-07T03:26:15.162Z",
    "updatedAt": "2026-05-07T03:26:15.162Z",
    "__v": 0
  },
  "meta": {
    "timestamp": "2026-05-07T05:11:02.982Z"
  }
}
```

---

### 2. Update Assessment Status (Admin Only)
**Endpoint:** `PATCH /api/assessment/status`

**Access:** Admin only

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "assessmentId": "69fc065702320e407601a2a8",
  "status": "approved"
}
```

**Status Values:**
- `pending`
- `approved`
- `cancelled`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "69fc065702320e407601a2a8",
    "userId": "69c709d3cb049607feb74d9e",
    "email": "user@example.com",
    "status": "approved",
    "phq9Score": 24,
    "gad7Score": 15,
    "des11Score": 24.4,
    "totalScore": 63.4,
    "isCompleted": true,
    "createdAt": "2026-05-07T03:26:15.162Z",
    "updatedAt": "2026-05-07T05:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-05-07T05:30:00.000Z"
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "No token provided",
    "statusCode": 401
  }
}
```

### 403 Forbidden (Non-admin trying to update status)
```json
{
  "success": false,
  "error": {
    "message": "Admin access required",
    "statusCode": 403
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Assessment not found",
    "statusCode": 404
  }
}
```

### 400 Bad Request (Invalid status)
```json
{
  "success": false,
  "error": {
    "message": "Status must be pending, approved, or cancelled",
    "statusCode": 400
  }
}
```

---

## Implementation Notes

1. **Email Auto-population**: Email is automatically fetched from the user's account when submitting PHQ-9 or full assessment
2. **Default Status**: All new assessments start with `status: "pending"`
3. **Admin Access**: Admins can view any user's assessment by passing `userId` query parameter
4. **User Access**: Users can only view their own latest completed assessment
5. **Status Update**: Only admins can update assessment status

---

## Testing

### Test as User
```bash
# Submit assessment
POST /api/assessment/submit
Authorization: Bearer <user_token>
{
  "phq9Answers": [3,3,2,3,3,2,2,3,3],
  "gad7Answers": [2,2,3,2,2,2,2],
  "des11Answers": [41.5,39.5,0,40.5,0,37,0,36.5]
}

# Get own result
GET /api/assessment/result
Authorization: Bearer <user_token>
```

### Test as Admin
```bash
# Get specific user's result
GET /api/assessment/result?userId=69c709d3cb049607feb74d9e
Authorization: Bearer <admin_token>

# Update status
PATCH /api/assessment/status
Authorization: Bearer <admin_token>
{
  "assessmentId": "69fc065702320e407601a2a8",
  "status": "approved"
}
```
