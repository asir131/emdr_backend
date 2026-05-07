# Journey API - User-Specific Filtering

## Changes Made

### Problem:
`GET /api/journeys` endpoint was returning **all journeys from all users**, regardless of who was logged in.

### Solution:
Updated the endpoint to return **only the logged-in user's journeys** based on their JWT token.

---

## API Behavior

### Before Fix:
```http
GET /api/journeys
Authorization: Bearer <user-token>

Response: All journeys from all users (6 journeys in your case)
```

### After Fix:
```http
GET /api/journeys
Authorization: Bearer <user-token>

Response: Only journeys created by the logged-in user
```

---

## Technical Changes

### 1. Service Layer (`journey.service.ts`)
```typescript
// Added userId parameter to filter by createdBy
async list(userId?: string) {
  const filter: any = { isActive: true };
  
  if (userId) {
    filter.createdBy = userId;
  }
  
  return Journey.find(filter)
    .select('-imagePublicId')
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean();
}

// Added admin method to list all journeys (optional)
async listAll() {
  return Journey.find({ isActive: true })
    .select('-imagePublicId')
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean();
}
```

### 2. Controller Layer (`journey.controller.ts`)
```typescript
// Pass logged-in user's ID from JWT token
list: async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    ok(res, await journeyService.list(req.user!.userId));
  } catch (e) { next(e); }
},

// Admin method (optional)
listAll: async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    ok(res, await journeyService.listAll());
  } catch (e) { next(e); }
},
```

### 3. Routes Layer (`journey.routes.ts`)
```typescript
// User routes - shows only logged-in user's journeys
router.get('/', ctrl.list);

// Admin route - shows all journeys (commented out, enable if needed)
// router.get('/admin/all', requireAdmin, ctrl.listAll);
```

---

## Testing

### Test 1: User A's Journeys
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usera@example.com",
  "password": "password123"
}

# Copy the accessToken from response
```

```http
GET /api/journeys
Authorization: Bearer <userA-token>

# Response: Only User A's journeys
```

### Test 2: User B's Journeys
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "userb@example.com",
  "password": "password123"
}

# Copy the accessToken from response
```

```http
GET /api/journeys
Authorization: Bearer <userB-token>

# Response: Only User B's journeys
```

---

## Expected Response Format

### User-Specific Journeys:
```json
{
  "success": true,
  "data": [
    {
      "_id": "69f933888c2aa890412a466c",
      "journeyName": "My Healing Journey",
      "description": "A journey to heal trauma through EMDR therapy",
      "imageUrl": "https://...",
      "isActive": true,
      "createdBy": {
        "_id": "69d94fcf9e7dae7607eefda3",
        "firstName": "nirob",
        "lastName": "khan"
      },
      "createdAt": "2026-05-05T00:02:16.957Z",
      "updatedAt": "2026-05-05T00:02:16.957Z"
    }
  ],
  "meta": {
    "timestamp": "2026-05-05T00:10:00.000Z"
  }
}
```

**Note:** Only journeys where `createdBy._id` matches the logged-in user's ID will be returned.

---

## Admin Access (Optional)

If you need an admin endpoint to see all journeys from all users:

### 1. Uncomment the admin route in `journey.routes.ts`:
```typescript
router.get('/admin/all', requireAdmin, ctrl.listAll);
```

### 2. Re-import requireAdmin:
```typescript
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
```

### 3. Test admin endpoint:
```http
GET /api/journeys/admin/all
Authorization: Bearer <admin-token>

# Response: All journeys from all users
```

---

## Security Notes

1. ✅ **User Isolation**: Each user can only see their own journeys
2. ✅ **JWT Authentication**: Required for all journey endpoints
3. ✅ **No Data Leakage**: Users cannot access other users' journeys
4. ✅ **Admin Override**: Optional admin route to see all journeys (if enabled)

---

## Files Modified

1. `src/modules/journey/journey.service.ts` - Added userId filtering
2. `src/modules/journey/journey.controller.ts` - Pass userId from JWT
3. `src/modules/journey/journey.routes.ts` - Updated route comments

---

## Summary

**Before:** `GET /api/journeys` returned all journeys from all users (security issue)

**After:** `GET /api/journeys` returns only the logged-in user's journeys (secure)

**Admin Option:** `GET /api/journeys/admin/all` can be enabled for admin access

---

**Last Updated:** May 5, 2026
