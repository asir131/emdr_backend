# My Tests API - Changes Summary

## 🔄 Changes Made

### 1. Field Name Change: `notes` → `description`

**Before:**
```json
{
  "itemName": "Blood Pressure Check",
  "day": "Monday",
  "notes": "Check BP in the morning"
}
```

**After:**
```json
{
  "itemName": "Blood Pressure Check",
  "description": "My weekly health and wellness tests"
}
```

---

### 2. Auto-Calculate Day from Creation Date

**New Feature:** The `day` field is now **optional** and will be automatically calculated from the item's creation date if not provided.

#### How it works:
- When you create an item **without** specifying `day`, the system automatically sets it based on the current day of the week
- If you create an item on **Monday**, `day` will be set to `"Monday"`
- If you create an item on **Friday**, `day` will be set to `"Friday"`

#### You can still manually specify the day:
```json
{
  "itemName": "Blood Pressure Check",
  "day": "Monday",
  "description": "Check BP every Monday"
}
```

---

## 📝 Updated API Examples

### Create Item (Auto Day)
```http
POST /api/my-tests/categories/{{categoryId}}/items
Content-Type: application/json

{
  "itemName": "Blood Pressure Check",
  "description": "My weekly health and wellness tests"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "69f0fa80ec2a17e1399ce5bd",
    "userId": "69c70af6f992b944bccd41a9",
    "categoryId": "69f0f9efec2a17e1399ce5a5",
    "itemName": "Blood Pressure Check",
    "day": "Monday",
    "description": "My weekly health and wellness tests",
    "isActive": true,
    "createdAt": "2026-04-28T18:20:48.074Z",
    "updatedAt": "2026-04-28T18:20:48.074Z"
  },
  "meta": {
    "timestamp": "2026-04-28T18:20:48.117Z"
  }
}
```

**Note:** The `day` field is automatically set to `"Monday"` because the item was created on a Monday.

---

### Create Item (Manual Day)
```http
POST /api/my-tests/categories/{{categoryId}}/items
Content-Type: application/json

{
  "itemName": "Blood Pressure Check",
  "day": "Friday",
  "description": "Check BP every Friday"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "69f0fa80ec2a17e1399ce5bd",
    "userId": "69c70af6f992b944bccd41a9",
    "categoryId": "69f0f9efec2a17e1399ce5a5",
    "itemName": "Blood Pressure Check",
    "day": "Friday",
    "description": "Check BP every Friday",
    "isActive": true,
    "createdAt": "2026-04-28T18:20:48.074Z",
    "updatedAt": "2026-04-28T18:20:48.074Z"
  }
}
```

---

### Update Item
```http
PATCH /api/my-tests/items/{{itemId}}
Content-Type: application/json

{
  "itemName": "Updated Item Name",
  "day": "Tuesday",
  "description": "Updated description",
  "isActive": true
}
```

**All fields are optional**

---

## 🎯 Key Benefits

### 1. **Simpler API Calls**
You don't need to calculate or specify the day when creating items. The system does it automatically.

**Before (Required day):**
```json
{
  "itemName": "Morning Exercise",
  "day": "Monday",  // Had to specify
  "notes": "30 min run"
}
```

**After (Optional day):**
```json
{
  "itemName": "Morning Exercise",
  "description": "30 min run"
}
// Day is auto-set based on creation date
```

---

### 2. **Flexible Day Assignment**
You can still manually specify the day if needed:

```json
{
  "itemName": "Weekly Report",
  "day": "Friday",  // Manual override
  "description": "Submit weekly report every Friday"
}
```

---

### 3. **Better Field Naming**
- `notes` → `description` (more descriptive and consistent)

---

## 🔄 Migration Guide

### If you're using the old API:

**Old Request:**
```json
{
  "itemName": "Blood Pressure Check",
  "day": "Monday",
  "notes": "Check BP in the morning"
}
```

**New Request (Option 1 - Auto Day):**
```json
{
  "itemName": "Blood Pressure Check",
  "description": "Check BP in the morning"
}
```

**New Request (Option 2 - Manual Day):**
```json
{
  "itemName": "Blood Pressure Check",
  "day": "Monday",
  "description": "Check BP in the morning"
}
```

---

## 📊 Day Calculation Logic

The system uses JavaScript's `Date.getDay()` method:

| Day Index | Day Name  |
|-----------|-----------|
| 0         | Sunday    |
| 1         | Monday    |
| 2         | Tuesday   |
| 3         | Wednesday |
| 4         | Thursday  |
| 5         | Friday    |
| 6         | Saturday  |

**Example:**
- Item created on **Monday** → `day = "Monday"`
- Item created on **Friday** → `day = "Friday"`
- Item created on **Sunday** → `day = "Sunday"`

---

## 🧪 Testing

### Test 1: Auto Day Calculation
```bash
# Create item on Monday
POST /api/my-tests/categories/{{categoryId}}/items
{
  "itemName": "Test Item",
  "description": "Auto day test"
}

# Expected: day = "Monday"
```

### Test 2: Manual Day Override
```bash
# Create item with manual day
POST /api/my-tests/categories/{{categoryId}}/items
{
  "itemName": "Test Item",
  "day": "Friday",
  "description": "Manual day test"
}

# Expected: day = "Friday" (regardless of creation date)
```

### Test 3: Update Day
```bash
# Update item day
PATCH /api/my-tests/items/{{itemId}}
{
  "day": "Wednesday"
}

# Expected: day changed to "Wednesday"
```

---

## ✅ Summary

### Changes:
1. ✅ `notes` field renamed to `description`
2. ✅ `day` field is now **optional**
3. ✅ Auto-calculate `day` from creation date if not provided
4. ✅ Can still manually specify `day` if needed
5. ✅ Updated Postman collection
6. ✅ Updated documentation

### Benefits:
- ✅ Simpler API calls (less required fields)
- ✅ Automatic day assignment
- ✅ Flexible manual override
- ✅ Better field naming
- ✅ Backward compatible (can still specify day)

---

## 🚀 Ready to Use!

The API is now updated and ready to use with the new changes. Import the updated Postman collection and test it out!

**Postman Collection:** `postman/MY-TESTS-SYSTEM.postman_collection.json`
