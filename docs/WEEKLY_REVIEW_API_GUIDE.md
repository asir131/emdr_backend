# Weekly Progress Review API — Frontend Integration Guide

এই document-এ Weekly Progress Review chatbot-এর জন্য backend API integration বিস্তারিত বলা হয়েছে।

---

## 📋 Overview

Weekly Review system-টা তোমার existing **Exposure Planning** module-এর উপরে build করা। User প্রতি সপ্তাহে তাদের exposure practice review করবে chatbot-এর মাধ্যমে।

**Key Concepts:**
- **Plan** = User-এর exposure hierarchy (steps with SUDS ratings)
- **Weekly Review** = প্রতি সপ্তাহে user কীভাবে practice করেছে তার record
- **originalSuds** = Plan তৈরির সময় user যা দিয়েছিল (fixed থাকে)
- **currentSuds** = সর্বশেষ weekly review-এ user যা rate করেছে (updates হয়)
- **mastered** = যখন currentSuds ≤ 2 (step mastered হয়ে গেছে)

---

## 🆕 NEW: Auto-Detect Active Plan (No planId Needed!)

এখন তোমার **দুইটা option** আছে API use করার জন্য:

### Option 1: Auto-detect (Recommended) 🌟
- **planId লাগবে না!**
- Backend automatically user-এর latest active plan নিয়ে কাজ করবে
- Simple এবং user-friendly
- Use করো যখন: User-এর শুধু একটা active plan থাকবে

### Option 2: With planId (Advanced)
- Specific plan-এর জন্য কাজ করবে
- Multiple active plans handle করতে পারবে
- Use করো যখন: User multiple plans manage করছে

---

## 🔑 Authentication

সব API-তে JWT token লাগবে:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

---

## 📍 API Endpoints

### Base URL
```
http://localhost:5005/api
```

---

## 🌟 AUTO-DETECT ENDPOINTS (No planId needed)

### 1️⃣ Page Load — Load Current Week Review (Auto)

**Endpoint:** `GET /api/exposure/weekly-review`

**কখন call করবে:** Chatbot page load হওয়ার সাথে সাথে

**কীভাবে কাজ করে:**
- Backend automatically user-এর latest plan খুঁজে নেয় যার status `not_started` বা `in_progress`
- সেই plan-এর current week review return করে

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": {
      "_id": "plan_id_here",
      "selectedBehavior": "Avoiding social situations",
      "currentWeek": 1,
      "status": "in_progress",
      "hierarchy": [
        {
          "_id": "step_id",
          "step": "Say hello to a cashier at the shop",
          "suds": 3,
          "originalSuds": 3,
          "currentSuds": null,
          "completed": false,
          "attempts": 0,
          "mastered": false,
          "plannedDay": null
        }
      ]
    },
    "review": null
  }
}
```

**Frontend Code:**
```javascript
// Simple! No planId needed
async function loadWeeklyReview() {
  const response = await fetch('/api/exposure/weekly-review', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { plan, review } = response.data;
  // Initialize chatbot with plan data
}
```

---

### 2️⃣ Real-time Step Update (Auto)

**Endpoint:** `PATCH /api/exposure/weekly-review/step`

**কখন call করবে:** User chatbot-এ কোনো step review করার সাথে সাথে

**Request Body:**
```json
{
  "weekNumber": 1,
  "stepIndex": 0,
  "status": "completed",
  "sudsRating": 4,
  "problemType": "anticipation",
  "plannedDay": "Monday",
  "notes": "Felt nervous but managed"
}
```

**Frontend Code:**
```javascript
async function saveStepReview(stepData) {
  await fetch('/api/exposure/weekly-review/step', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(stepData)
  });
}
```

---

### 3️⃣ Save Full Review Session (Auto)

**Endpoint:** `POST /api/exposure/weekly-review`

**কখন call করবে:** Chatbot session শেষ হলে

**Request Body:**
```json
{
  "weekNumber": 1,
  "overallFeeling": "mixed",
  "stepReviews": [
    {
      "stepIndex": 0,
      "status": "completed",
      "sudsRating": 2,
      "problemType": "anticipation",
      "plannedDay": "Monday"
    }
  ]
}
```

**Frontend Code:**
```javascript
async function saveFullSession(sessionData) {
  await fetch('/api/exposure/weekly-review', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sessionData)
  });
}
```

---

## 📌 WITH PLANID ENDPOINTS (Advanced)

### 1️⃣ Page Load — Load Current Week Review

**Endpoint:** `GET /api/exposure/plan/:planId/weekly-review`

**কখন call করবে:** Chatbot page load হওয়ার সাথে সাথে

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": {
      "_id": "plan_id_here",
      "selectedBehavior": "Avoiding social situations",
      "currentWeek": 1,
      "status": "in_progress",
      "hierarchy": [
        {
          "_id": "step_id",
          "step": "Say hello to a cashier at the shop",
          "suds": 3,              // original SUDS (fixed)
          "originalSuds": 3,      // same as suds
          "currentSuds": null,    // null = not reviewed yet
          "completed": false,
          "attempts": 0,
          "mastered": false,
          "plannedDay": null
        },
        {
          "_id": "step_id_2",
          "step": "Make small talk with a colleague",
          "suds": 5,
          "originalSuds": 5,
          "currentSuds": 4,       // user rated 4 in last review
          "completed": true,
          "attempts": 3,          // practiced 3 times
          "mastered": false,      // 4 > 2, so not mastered yet
          "plannedDay": "Monday"
        }
      ]
    },
    "review": null  // null = এই সপ্তাহে এখনো review শুরু হয়নি
  }
}
```

**Frontend-এ কী করবে:**
```javascript
const { plan, review } = response.data;

// Chatbot-এ hierarchy load করো
this.hierarchy = plan.hierarchy.map((step, index) => ({
  step: step.step,
  originalSuds: step.originalSuds,
  currentSuds: step.currentSuds,
  status: step.completed ? 'completed' : 'not-started',
  attempts: step.attempts,
  mastered: step.mastered
}));

this.currentWeek = plan.currentWeek;
```

---

## 2️⃣ Real-time Step Update (Chatbot চলার সময়)

**Endpoint:** `PATCH /api/exposure/plan/:planId/weekly-review/step`

**কখন call করবে:** User যখন chatbot-এ কোনো step review করে

**Request Body:**
```json
{
  "weekNumber": 1,
  "stepIndex": 0,
  "status": "completed",
  "sudsRating": 4,
  "problemType": "anticipation",
  "plannedDay": "Monday",
  "notes": "Felt nervous but managed to say hello"
}
```

**Field Details:**

| Field | Type | Required | Options |
|-------|------|----------|---------|
| `weekNumber` | number | ✅ | Current week number from plan |
| `stepIndex` | number | ✅ | 0-based index (0 = first step) |
| `status` | string | ✅ | `'completed'` \| `'in-progress'` \| `'not-started'` |
| `sudsRating` | number | ❌ | 0-10 (only if status ≠ 'not-started') |
| `problemType` | string | ❌ | `'anticipation'` \| `'during'` \| `'physical'` \| `'thoughts'` \| `'other'` |
| `plannedDay` | string | ❌ | `'Monday'` \| `'Tuesday'` \| ... \| `'Weekend'` \| `'Multiple'` |
| `notes` | string | ❌ | Max 1000 characters |

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "review_id",
    "planId": "plan_id",
    "weekNumber": 1,
    "overallFeeling": "mixed",
    "stepReviews": [
      {
        "stepIndex": 0,
        "status": "completed",
        "sudsRating": 4,
        "problemType": "anticipation",
        "plannedDay": "Monday",
        "notes": "Felt nervous but managed to say hello"
      }
    ],
    "isCompleted": false
  }
}
```

**Frontend Example:**

```javascript
// User step 0 review করলো
async reviewStep(stepIndex, status, sudsRating, problemType, plannedDay) {
  await fetch(`${baseUrl}/exposure/plan/${planId}/weekly-review/step`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      weekNumber: this.currentWeek,
      stepIndex,
      status,
      sudsRating,
      problemType,
      plannedDay
    })
  });
}
```

**3টি Different Cases:**

### Case 1: Step Completed (SUDS ≤ 2 = Mastered)
```json
{
  "weekNumber": 1,
  "stepIndex": 0,
  "status": "completed",
  "sudsRating": 2,
  "problemType": "anticipation"
}
```
→ Backend automatically sets `mastered: true` on the hierarchy step

### Case 2: Step In Progress (High SUDS)
```json
{
  "weekNumber": 1,
  "stepIndex": 1,
  "status": "in-progress",
  "sudsRating": 7,
  "problemType": "thoughts",
  "notes": "Tried but left early due to anxiety"
}
```
→ `mastered: false`, `attempts` increments

### Case 3: Step Not Started (Plan for Next Week)
```json
{
  "weekNumber": 1,
  "stepIndex": 2,
  "status": "not-started",
  "plannedDay": "Wednesday"
}
```
→ শুধু `plannedDay` save হয়, SUDS update হয় না

---

## 3️⃣ Save Full Review Session (Session শেষে)

**Endpoint:** `POST /api/exposure/plan/:planId/weekly-review`

**কখন call করবে:** Chatbot session শেষ হলে (user সব step review করার পর)

**Request Body:**
```json
{
  "weekNumber": 1,
  "overallFeeling": "mixed",
  "stepReviews": [
    {
      "stepIndex": 0,
      "status": "completed",
      "sudsRating": 2,
      "problemType": "anticipation",
      "plannedDay": "Monday"
    },
    {
      "stepIndex": 1,
      "status": "completed",
      "sudsRating": 4,
      "problemType": "during",
      "plannedDay": "Multiple"
    },
    {
      "stepIndex": 2,
      "status": "in-progress",
      "sudsRating": 7,
      "problemType": "thoughts",
      "plannedDay": "Thursday"
    },
    {
      "stepIndex": 3,
      "status": "not-started",
      "plannedDay": "Friday"
    },
    {
      "stepIndex": 4,
      "status": "not-started"
    }
  ]
}
```

**Field Details:**

| Field | Type | Required | Options |
|-------|------|----------|---------|
| `weekNumber` | number | ✅ | Current week number |
| `overallFeeling` | string | ✅ | `'good'` \| `'challenging'` \| `'mixed'` \| `'unable'` |
| `stepReviews` | array | ✅ | Array of step review objects (same as PATCH) |

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "review_id",
    "planId": "plan_id",
    "weekNumber": 1,
    "overallFeeling": "mixed",
    "stepReviews": [...],
    "summary": {
      "completedSteps": 2,
      "attemptedSteps": 3,
      "avgSudsReduction": 1.7
    },
    "isCompleted": true,
    "createdAt": "2026-05-04T10:30:00.000Z"
  }
}
```

**Backend Automatically:**
- ✅ Calculates `avgSudsReduction` (originalSuds - currentSuds average)
- ✅ Updates `plan.hierarchy` with latest `currentSuds`, `mastered`, `attempts`
- ✅ Recalculates `plan.progressPercent`
- ✅ Advances `plan.currentWeek` if all attempted steps are mastered

**Frontend Example:**

```javascript
async finishReview() {
  const response = await fetch(`${baseUrl}/exposure/plan/${planId}/weekly-review`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      weekNumber: this.currentWeek,
      overallFeeling: this.selectedFeeling,
      stepReviews: this.stepsProgress  // array of all step reviews
    })
  });

  const { summary } = response.data;
  console.log(`Completed: ${summary.completedSteps}, Avg SUDS reduction: ${summary.avgSudsReduction}`);
}
```

---

## 4️⃣ Get Review History

**Endpoint:** `GET /api/exposure/plan/:planId/weekly-review/history`

**কখন call করবে:** User যদি past weeks-এর progress দেখতে চায়

**Response:**
```json
{
  "success": true,
  "data": {
    "planId": "plan_id",
    "selectedBehavior": "Avoiding social situations",
    "totalWeeks": 3,
    "reviews": [
      {
        "_id": "review_1",
        "weekNumber": 1,
        "overallFeeling": "mixed",
        "summary": {
          "completedSteps": 2,
          "attemptedSteps": 3,
          "avgSudsReduction": 1.7
        },
        "createdAt": "2026-04-27T10:00:00.000Z"
      },
      {
        "_id": "review_2",
        "weekNumber": 2,
        "overallFeeling": "good",
        "summary": {
          "completedSteps": 3,
          "attemptedSteps": 4,
          "avgSudsReduction": 2.5
        },
        "createdAt": "2026-05-04T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 🔄 Complete Flow Example

### Week 1 — First Review

```javascript
// 1. Page load
const { plan, review } = await GET('/api/exposure/plan/PLAN_ID/weekly-review');
// review = null (first time)

// 2. User reviews step 0
await PATCH('/api/exposure/plan/PLAN_ID/weekly-review/step', {
  weekNumber: 1,
  stepIndex: 0,
  status: 'completed',
  sudsRating: 2
});

// 3. User reviews step 1
await PATCH('/api/exposure/plan/PLAN_ID/weekly-review/step', {
  weekNumber: 1,
  stepIndex: 1,
  status: 'completed',
  sudsRating: 4
});

// 4. Session শেষে full save
await POST('/api/exposure/plan/PLAN_ID/weekly-review', {
  weekNumber: 1,
  overallFeeling: 'good',
  stepReviews: [
    { stepIndex: 0, status: 'completed', sudsRating: 2 },
    { stepIndex: 1, status: 'completed', sudsRating: 4 },
    { stepIndex: 2, status: 'not-started', plannedDay: 'Monday' }
  ]
});
```

### Week 2 — Continuing Progress

```javascript
// 1. Page load (same endpoint)
const { plan, review } = await GET('/api/exposure/plan/PLAN_ID/weekly-review');
// plan.currentWeek = 2 (auto-advanced if week 1 steps mastered)
// plan.hierarchy[0].currentSuds = 2 (from week 1)
// plan.hierarchy[0].mastered = true

// 2. Continue reviewing...
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CHATBOT PAGE LOAD                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        GET /api/exposure/plan/:id/weekly-review
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  plan: { hierarchy[], currentWeek }   │
        │  review: WeeklyReview | null          │
        └───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              USER REVIEWS EACH STEP (LOOP)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
    PATCH /api/exposure/plan/:id/weekly-review/step
    { stepIndex, status, sudsRating, problemType }
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Real-time save to WeeklyReview doc  │
        │  Updates plan.hierarchy immediately   │
        └───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SESSION COMPLETE                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
     POST /api/exposure/plan/:id/weekly-review
     { weekNumber, overallFeeling, stepReviews[] }
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Calculate summary stats              │
        │  Sync all hierarchy fields            │
        │  Advance currentWeek if mastered      │
        └───────────────────────────────────────┘
```

---

## ⚠️ Important Notes

### 1. Real-time vs Batch Save

**Real-time (PATCH):**
- Call করো প্রতিটা step review-এর পরে
- Immediate feedback দেয় user-কে
- Review document create/update করে incrementally

**Batch (POST):**
- Call করো session শেষে
- Final summary calculate করে
- Week advance করে if needed

### 2. Week Advancement Logic

Backend automatically advances `currentWeek` when:
- All attempted steps have `mastered: true` (currentSuds ≤ 2)
- Plan status ≠ 'completed'

### 3. SUDS Tracking

```javascript
// originalSuds = fixed reference point
hierarchy[0].originalSuds = 3  // never changes

// currentSuds = latest review rating
hierarchy[0].currentSuds = 2   // updates each week

// Improvement calculation
improvement = originalSuds - currentSuds  // 3 - 2 = 1 point improvement
```

### 4. Error Handling

```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error);
    // Show user-friendly message
  }
} catch (err) {
  console.error('Network Error:', err);
  // Handle offline/network issues
}
```

---

## 🧪 Testing with Postman

Postman collection আছে: `postman/WEEKLY-REVIEW-SYSTEM.postman_collection.json`

**Import করো:**
1. Postman open করো
2. File → Import
3. `postman/WEEKLY-REVIEW-SYSTEM.postman_collection.json` select করো

**Collection Variables:**
- `token` — JWT token set করো
- `baseUrl` — `http://localhost:5005/api`
- `planId` — Create Plan করলে auto-set হবে

**Test Flow:**
1. Create Exposure Plan (auto-saves planId)
2. Load Current Week Review
3. Real-time Step Update (try different cases)
4. Save Full Review Session
5. Get Review History

---

## 🐛 Common Issues

### Issue 1: `planId` not found
**Solution:** Ensure plan exists first using `GET /api/exposure/plans`

### Issue 2: `weekNumber` mismatch
**Solution:** Always use `plan.currentWeek` from the GET response

### Issue 3: `stepIndex` out of range
**Solution:** Validate `stepIndex < plan.hierarchy.length`

### Issue 4: Missing `sudsRating` for completed steps
**Solution:** Always send `sudsRating` when `status !== 'not-started'`

---

## 📞 Support

কোনো সমস্যা হলে backend developer-কে জানাও:
- API response unexpected হলে
- Validation error আসলে
- Data sync issue হলে

---

**Happy Coding! 🚀**
