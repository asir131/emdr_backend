# Free Users API Documentation

## Overview
This API allows admins to retrieve all users who do **not** have an active paid subscription (Standard or Premium). These are considered "free users" and may include:
- Users with no subscription at all
- Users with a Community (free) plan
- Users with expired or canceled subscriptions

---

## Endpoint

### **GET** `/api/admin/users/free`

**Description:** Get all free (non-paid) users with pagination and search

**Access:** Private (Admin only)

**Authentication:** Bearer Token (Admin role required)

---

## Query Parameters

| Parameter | Type   | Required | Default | Description                                    |
|-----------|--------|----------|---------|------------------------------------------------|
| `page`    | number | No       | 1       | Page number for pagination                     |
| `limit`   | number | No       | 10      | Number of users per page                       |
| `search`  | string | No       | ""      | Search by first name, last name, or email      |

---

## Request Example

```bash
GET /api/admin/users/free?page=1&limit=20&search=john
Authorization: Bearer <admin_token>
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "60d0fe4f5311236168a109fa",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "avatar": "https://cloudinary.com/avatar.jpg",
        "status": "active",
        "joinedDate": "2024-01-15T10:30:00.000Z",
        "subscription": {
          "name": "Community Access",
          "type": "community",
          "status": "active"
        }
      },
      {
        "id": "60d0fe4f5311236168a109fb",
        "name": "Jane Smith",
        "email": "jane.smith@example.com",
        "avatar": null,
        "status": "active",
        "joinedDate": "2024-02-20T14:45:00.000Z",
        "subscription": {
          "name": "No Plan",
          "type": "free",
          "status": "none"
        }
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  },
  "meta": {
    "timestamp": "2024-03-15T12:00:00.000Z"
  }
}
```

---

## Response Fields

### User Object

| Field          | Type   | Description                                           |
|----------------|--------|-------------------------------------------------------|
| `id`           | string | User's unique identifier                              |
| `name`         | string | User's full name (firstName + lastName)               |
| `email`        | string | User's email address                                  |
| `avatar`       | string | User's profile picture URL (null if not set)          |
| `status`       | string | User account status: `active` or `suspended`          |
| `joinedDate`   | string | ISO 8601 timestamp of when user registered            |
| `subscription` | object | User's subscription details                           |

### Subscription Object

| Field    | Type   | Description                                                |
|----------|--------|------------------------------------------------------------|
| `name`   | string | Plan name (e.g., "Community Access", "No Plan")            |
| `type`   | string | Plan type: `free`, `community`, `standard`, or `premium`   |
| `status` | string | Subscription status: `active`, `canceled`, `expired`, `none` |

### Pagination Object

| Field        | Type   | Description                      |
|--------------|--------|----------------------------------|
| `total`      | number | Total number of free users       |
| `page`       | number | Current page number              |
| `limit`      | number | Users per page                   |
| `totalPages` | number | Total number of pages            |

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "statusCode": 401
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Admin access required",
    "statusCode": 403
  }
}
```

---

## Implementation Logic

The API identifies "free users" by:

1. Finding all active **paid** subscription plans (type = `standard` or `premium`)
2. Finding all users who have an **active** subscription to those paid plans
3. Returning all users who are **NOT** in that paid users list

This means the result includes:
- Users with no subscription record
- Users with Community (free) plans
- Users with expired/canceled subscriptions
- Users who never subscribed

---

## Use Cases

- **Admin Dashboard:** Display free users for targeted marketing campaigns
- **Community Management:** Identify users on free/community plans
- **Conversion Tracking:** Monitor users who haven't upgraded to paid plans
- **Support:** Quickly find users who may need assistance with subscription

---

## Notes

- Route must be placed **before** `/api/admin/users/:userId` to avoid route conflicts
- Search is case-insensitive and searches across first name, last name, and email
- Results are sorted by registration date (newest first)
- Only users with `role: 'user'` and `isDeleted: false` are included
