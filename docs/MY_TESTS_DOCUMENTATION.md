# My Tests System - Complete Documentation

## 📋 Overview

**My Tests** is a production-level category and item management system that allows users to:
- Create test categories (e.g., "Weekly Health Tests", "Daily Workout Routine")
- Add items to categories with specific days of the week
- Manage and organize tests/tasks by day
- Track statistics and item counts

---

## 🏗️ Architecture

### Database Schema

#### TestCategory Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  categoryName: string (1-100 chars, unique per user),
  description: string (optional, max 500 chars),
  isActive: boolean (default: true),
  itemCount: number (denormalized count),
  createdAt: Date,
  updatedAt: Date
}
```

#### TestItem Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  categoryId: ObjectId (ref: TestCategory),
  itemName: string (1-200 chars),
  day: DayOfWeek (Sunday-Saturday),
  notes: string (optional, max 1000 chars),
  isActive: boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Key Features

✅ **Production-Level Code**
- Proper error handling with typed ApiErrors
- Input validation using Zod schemas
- MongoDB indexes for performance
- Denormalized item counts for fast queries
- Ownership verification on all operations
- Comprehensive logging

✅ **Performance Optimizations**
- Compound indexes for common queries
- Unique index on userId + categoryName
- Pagination support on all list endpoints
- Lean queries where appropriate

✅ **Data Integrity**
- Automatic item count updates via middleware
- Cascade delete (deleting category deletes all items)
- Unique category names per user
- Ownership checks on all operations

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000/api/my-tests
```

### Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📁 Category Endpoints

### 1. Create Category
```http
POST /api/my-tests/categories
Content-Type: application/json

{
  "categoryName": "Weekly Health Tests",
  "description": "My weekly health monitoring routine"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "categoryName": "Weekly Health Tests",
    "description": "My weekly health monitoring routine",
    "isActive": true,
    "itemCount": 0,
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-04-29T10:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-04-29T10:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Validation error (duplicate name, invalid input)
- `401` - Unauthorized (missing/invalid token)

---

### 2. List All Categories
```http
GET /api/my-tests/categories?page=1&limit=20&isActive=true
```

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20, max: 100) - Items per page
- `isActive` (optional) - Filter by active status (true/false)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": "507f1f77bcf86cd799439012",
        "categoryName": "Weekly Health Tests",
        "description": "My weekly health monitoring routine",
        "isActive": true,
        "itemCount": 5,
        "createdAt": "2026-04-29T10:00:00.000Z",
        "updatedAt": "2026-04-29T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "totalPages": 1,
      "hasNextPage": false
    }
  },
  "meta": {
    "timestamp": "2026-04-29T10:00:00.000Z"
  }
}
```

---

### 3. Get Category by ID
```http
GET /api/my-tests/categories/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "categoryName": "Weekly Health Tests",
    "description": "My weekly health monitoring routine",
    "isActive": true,
    "itemCount": 5,
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-04-29T10:00:00.000Z"
  }
}
```

**Errors:**
- `404` - Category not found
- `403` - Access denied (not owner)

---

### 4. Update Category
```http
PATCH /api/my-tests/categories/:id
Content-Type: application/json

{
  "categoryName": "Updated Category Name",
  "description": "Updated description",
  "isActive": true
}
```

**All fields are optional**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "categoryName": "Updated Category Name",
    "description": "Updated description",
    "isActive": true,
    "itemCount": 5,
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-04-29T10:05:00.000Z"
  }
}
```

**Errors:**
- `400` - Validation error (duplicate name)
- `404` - Category not found
- `403` - Access denied

---

### 5. Get Category Statistics
```http
GET /api/my-tests/categories/:id/stats
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalItems": 7,
    "activeItems": 6,
    "inactiveItems": 1,
    "itemsByDay": [
      { "day": "Monday", "count": 2 },
      { "day": "Tuesday", "count": 1 },
      { "day": "Wednesday", "count": 2 },
      { "day": "Friday", "count": 2 }
    ]
  }
}
```

---

### 6. Delete Category
```http
DELETE /api/my-tests/categories/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Category and 7 items deleted successfully"
  }
}
```

**Note:** This will delete the category AND all items in it (cascade delete).

---

## 📝 Item Endpoints

### 1. Create Item in Category
```http
POST /api/my-tests/categories/:categoryId/items
Content-Type: application/json

{
  "itemName": "Blood Pressure Check",
  "day": "Monday",
  "notes": "Check BP in the morning before breakfast"
}
```

**Valid Days:**
- Sunday
- Monday
- Tuesday
- Wednesday
- Thursday
- Friday
- Saturday

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439012",
    "categoryId": "507f1f77bcf86cd799439011",
    "itemName": "Blood Pressure Check",
    "day": "Monday",
    "notes": "Check BP in the morning before breakfast",
    "isActive": true,
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-04-29T10:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Validation error (invalid day, missing fields)
- `404` - Category not found
- `403` - Access denied

---

### 2. List Items in Category
```http
GET /api/my-tests/categories/:categoryId/items?page=1&limit=50&day=Monday&isActive=true
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50, max: 100)
- `day` (optional) - Filter by day (Sunday-Saturday)
- `isActive` (optional) - Filter by active status

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "507f1f77bcf86cd799439012",
        "categoryId": "507f1f77bcf86cd799439011",
        "itemName": "Blood Pressure Check",
        "day": "Monday",
        "notes": "Check BP in the morning before breakfast",
        "isActive": true,
        "createdAt": "2026-04-29T10:00:00.000Z",
        "updatedAt": "2026-04-29T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 50,
      "totalPages": 1,
      "hasNextPage": false
    }
  }
}
```

---

### 3. List All User Items (Across All Categories)
```http
GET /api/my-tests/items?page=1&limit=50&day=Monday
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50, max: 100)
- `day` (optional) - Filter by day

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "507f1f77bcf86cd799439012",
        "categoryId": {
          "_id": "507f1f77bcf86cd799439011",
          "categoryName": "Weekly Health Tests"
        },
        "itemName": "Blood Pressure Check",
        "day": "Monday",
        "notes": "Check BP in the morning",
        "isActive": true,
        "createdAt": "2026-04-29T10:00:00.000Z",
        "updatedAt": "2026-04-29T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 50,
      "totalPages": 1,
      "hasNextPage": false
    }
  }
}
```

---

### 4. Get Item by ID
```http
GET /api/my-tests/items/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439012",
    "categoryId": "507f1f77bcf86cd799439011",
    "itemName": "Blood Pressure Check",
    "day": "Monday",
    "notes": "Check BP in the morning before breakfast",
    "isActive": true,
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-04-29T10:00:00.000Z"
  }
}
```

---

### 5. Update Item
```http
PATCH /api/my-tests/items/:id
Content-Type: application/json

{
  "itemName": "Updated Item Name",
  "day": "Tuesday",
  "notes": "Updated notes",
  "isActive": true
}
```

**All fields are optional**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "itemName": "Updated Item Name",
    "day": "Tuesday",
    "notes": "Updated notes",
    "isActive": true,
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-04-29T10:05:00.000Z"
  }
}
```

---

### 6. Delete Item
```http
DELETE /api/my-tests/items/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Item deleted successfully"
  }
}
```

---

## 🧪 Testing with Postman

### Setup

1. **Import Collection**
   - File: `postman/MY-TESTS-SYSTEM.postman_collection.json`

2. **Create Environment**
   ```json
   {
     "baseUrl": "http://localhost:5000/api",
     "authToken": "your-jwt-token-here",
     "categoryId": "",
     "itemId": ""
   }
   ```

3. **Get Auth Token**
   - Login via `/api/auth/login`
   - Copy token to environment

### Test Workflows

#### Workflow 1: Weekly Health Tests
```
1. Create Category → "Weekly Health Tests"
2. Add Monday Item → "Blood Pressure Check"
3. Add Wednesday Item → "Weight Measurement"
4. Add Friday Item → "Blood Sugar Test"
5. View All Items
6. View Category Stats
```

#### Workflow 2: Daily Workout Routine
```
1. Create Category → "Daily Workout Routine"
2. Add Monday Item → "30 min Running"
3. Add Tuesday Item → "Upper Body Workout"
4. Filter by Day → Monday
```

---

## 💻 Frontend Integration

### React/TypeScript Example

```typescript
// services/myTestsApi.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const myTestsApi = {
  // Categories
  createCategory: async (data: { categoryName: string; description?: string }) => {
    const response = await apiClient.post('/my-tests/categories', data);
    return response.data.data;
  },

  listCategories: async (params?: { page?: number; limit?: number; isActive?: boolean }) => {
    const response = await apiClient.get('/my-tests/categories', { params });
    return response.data.data;
  },

  getCategory: async (categoryId: string) => {
    const response = await apiClient.get(`/my-tests/categories/${categoryId}`);
    return response.data.data;
  },

  updateCategory: async (categoryId: string, data: any) => {
    const response = await apiClient.patch(`/my-tests/categories/${categoryId}`, data);
    return response.data.data;
  },

  deleteCategory: async (categoryId: string) => {
    const response = await apiClient.delete(`/my-tests/categories/${categoryId}`);
    return response.data.data;
  },

  getCategoryStats: async (categoryId: string) => {
    const response = await apiClient.get(`/my-tests/categories/${categoryId}/stats`);
    return response.data.data;
  },

  // Items
  createItem: async (categoryId: string, data: {
    itemName: string;
    day: string;
    notes?: string;
  }) => {
    const response = await apiClient.post(`/my-tests/categories/${categoryId}/items`, data);
    return response.data.data;
  },

  listCategoryItems: async (categoryId: string, params?: {
    page?: number;
    limit?: number;
    day?: string;
    isActive?: boolean;
  }) => {
    const response = await apiClient.get(`/my-tests/categories/${categoryId}/items`, { params });
    return response.data.data;
  },

  listAllItems: async (params?: { page?: number; limit?: number; day?: string }) => {
    const response = await apiClient.get('/my-tests/items', { params });
    return response.data.data;
  },

  getItem: async (itemId: string) => {
    const response = await apiClient.get(`/my-tests/items/${itemId}`);
    return response.data.data;
  },

  updateItem: async (itemId: string, data: any) => {
    const response = await apiClient.patch(`/my-tests/items/${itemId}`, data);
    return response.data.data;
  },

  deleteItem: async (itemId: string) => {
    const response = await apiClient.delete(`/my-tests/items/${itemId}`);
    return response.data.data;
  },
};
```

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';
import { myTestsApi } from './services/myTestsApi';

export const MyTestsManager: React.FC = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await myTestsApi.listCategories();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      await myTestsApi.createCategory({ categoryName: name });
      loadCategories(); // Reload list
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  return (
    <div>
      <h2>My Tests</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {categories.map((cat: any) => (
            <li key={cat._id}>
              {cat.categoryName} ({cat.itemCount} items)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

---

## 🔒 Security Features

✅ **Authentication Required** - All endpoints require valid JWT
✅ **Ownership Verification** - Users can only access their own data
✅ **Input Validation** - Zod schemas validate all inputs
✅ **NoSQL Injection Prevention** - express-mongo-sanitize middleware
✅ **Rate Limiting** - Global rate limit on all API routes
✅ **Error Handling** - Typed errors with proper status codes

---

## 📊 Performance Features

✅ **Database Indexes** - Optimized queries with compound indexes
✅ **Pagination** - All list endpoints support pagination
✅ **Denormalized Counts** - Fast item count without aggregation
✅ **Lean Queries** - Use `.lean()` for read-only operations
✅ **Cascade Delete** - Efficient bulk deletion

---

## 🎯 Use Cases

1. **Health Tracking**
   - Weekly health tests
   - Daily medication schedule
   - Fitness routine

2. **Task Management**
   - Weekly chores
   - Daily habits
   - Work schedules

3. **Education**
   - Study schedule
   - Assignment tracking
   - Class timetable

4. **Personal Development**
   - Goal tracking
   - Habit formation
   - Progress monitoring

---

## 🚀 Getting Started

1. **Start Server**
   ```bash
   npm run dev
   ```

2. **Import Postman Collection**
   - Import `postman/MY-TESTS-SYSTEM.postman_collection.json`

3. **Get Auth Token**
   - Login via `/api/auth/login`
   - Set token in environment

4. **Test Endpoints**
   - Create a category
   - Add items
   - View statistics

---

## 📝 Summary

**My Tests System** is a production-ready, fully-featured category-item management system with:
- ✅ Complete CRUD operations
- ✅ Production-level code quality
- ✅ Comprehensive error handling
- ✅ Performance optimizations
- ✅ Security best practices
- ✅ Full documentation
- ✅ Postman collection
- ✅ Frontend integration examples

**Ready to use in production!** 🚀
