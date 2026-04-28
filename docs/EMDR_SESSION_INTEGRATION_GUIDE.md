# EMDR Session API - Complete Integration Guide

## 📋 Table of Contents
1. [Backend Setup](#backend-setup)
2. [File Upload Configuration](#file-upload-configuration)
3. [Postman Testing Guide](#postman-testing-guide)
4. [Frontend Integration Examples](#frontend-integration-examples)
5. [Best Practices](#best-practices)

---

## 🔧 Backend Setup

### Step 1: Update Model to Support File URLs

The model needs to store file URLs for uploaded media:

```typescript
// Add to emdrSession.model.ts
export interface IEmdrSession extends Document {
  // ... existing fields ...
  
  // File URLs for target media
  targetMediaUrl?: string | null;
  freezeFrameMediaUrl?: string | null;
}

// Update schema
const emdrSessionSchema = new Schema<IEmdrSession>({
  // ... existing fields ...
  
  targetMediaUrl: { 
    type: String, 
    trim: true, 
    default: null 
  },
  freezeFrameMediaUrl: { 
    type: String, 
    trim: true, 
    default: null 
  },
});
```

### Step 2: Update Routes to Support File Upload

```typescript
// emdrSession.routes.ts
import { upload } from '../../middleware/upload';

// Update the target route to support multipart/form-data
router.patch(
  '/:id/target',
  upload.fields([
    { name: 'targetFile', maxCount: 1 },
    { name: 'freezeFrameFile', maxCount: 1 }
  ]),
  validate(saveTargetSchema),
  ctrl.saveTarget
);
```

### Step 3: Update Controller to Handle Files

```typescript
// emdrSession.controller.ts
saveTarget: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const session = await emdrSessionService.saveTarget(
      req.params.id,
      req.user!.userId,
      {
        ...req.body,
        targetFile: files?.targetFile?.[0],
        freezeFrameFile: files?.freezeFrameFile?.[0]
      }
    );
    ok(res, session);
  } catch (e) { next(e); }
},
```

### Step 4: Update Service to Process Files

```typescript
// emdrSession.service.ts
interface SaveTargetPayload {
  targetDescription: string;
  freezeFrame: string;
  targetFile?: Express.Multer.File;
  freezeFrameFile?: Express.Multer.File;
}

async saveTarget(
  sessionId: string,
  userId: string,
  payload: SaveTargetPayload,
): Promise<IEmdrSession> {
  const session = await findOwned(sessionId, userId);

  if (session.status !== 'in_progress') {
    throw ApiError.validationError(
      'Cannot modify a session that is no longer in progress',
      'status',
    );
  }

  session.targetDescription = payload.targetDescription;
  session.freezeFrame = payload.freezeFrame;

  // Handle file uploads (if Cloudinary is configured)
  if (payload.targetFile) {
    // Upload to Cloudinary or your storage
    session.targetMediaUrl = payload.targetFile.path; // Cloudinary URL
  }

  if (payload.freezeFrameFile) {
    session.freezeFrameMediaUrl = payload.freezeFrameFile.path;
  }

  await session.save();
  return session;
}
```

### Step 5: Update Validation Schema

```typescript
// emdrSession.validation.ts
export const saveTargetSchema = z.object({
  params: idParam,
  body: z.object({
    targetDescription: nonEmptyStr(2000, 'Target description'),
    freezeFrame: nonEmptyStr(2000, 'Freeze frame description'),
  }).passthrough(), // Allow additional fields from multipart
});
```

---

## 📤 File Upload Configuration

### Check Upload Middleware

```typescript
// src/middleware/upload.ts
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'emdr-sessions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp3', 'wav', 'mp4'],
    resource_type: 'auto',
  } as any,
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});
```

---

## 🧪 Postman Testing Guide

### Setup Steps:

#### 1. Import Collection
- Open Postman
- Click **Import** → Select `postman/EMDR-SESSION-SYSTEM.postman_collection.json`

#### 2. Set Environment Variables
Create a new environment with:
```json
{
  "baseUrl": "http://localhost:5000/api",
  "authToken": "your-jwt-token-here",
  "sessionId": ""
}
```

#### 3. Get Auth Token First
Run your login/register endpoint to get JWT token, then:
- Copy the token
- Set it in environment variable `authToken`

### Testing Workflow:

#### Test 1: Start Session (Text Only)
```http
POST {{baseUrl}}/emdr-session/start
Content-Type: application/json

{
  "sessionType": "memory"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "...",
    "sessionType": "memory",
    "status": "in_progress",
    "createdAt": "2026-04-28T10:00:00.000Z"
  }
}
```

#### Test 2: Save Target (Text Only)
```http
PATCH {{baseUrl}}/emdr-session/{{sessionId}}/target
Content-Type: application/json

{
  "targetDescription": "Car accident memory",
  "freezeFrame": "Moment of impact"
}
```

#### Test 3: Save Target (With File Upload)
```http
PATCH {{baseUrl}}/emdr-session/{{sessionId}}/target
Content-Type: multipart/form-data

Form Data:
- targetDescription: "Car accident memory"
- freezeFrame: "Moment of impact"
- targetFile: [Select file from computer]
- freezeFrameFile: [Select file from computer]
```

**In Postman:**
1. Select request "2. Save Target (With File Upload)"
2. Go to **Body** tab
3. Select **form-data**
4. Add text fields: `targetDescription`, `freezeFrame`
5. Add file fields: `targetFile`, `freezeFrameFile`
6. Click **Select Files** to upload

#### Test 4: Complete Memory Session Flow
Run requests in order:
1. Start Memory Session
2. Save Target
3. Save Beliefs
4. Save Emotions
5. Save SUD
6. Complete Session

---

## 💻 Frontend Integration Examples

### React/React Native Example

#### 1. API Service Setup

```typescript
// services/emdrSessionApi.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken'); // or AsyncStorage in RN
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const emdrSessionApi = {
  // Start new session
  startSession: async (sessionType: string) => {
    const response = await apiClient.post('/emdr-session/start', {
      sessionType,
    });
    return response.data.data;
  },

  // Save target (text only)
  saveTarget: async (sessionId: string, data: {
    targetDescription: string;
    freezeFrame: string;
  }) => {
    const response = await apiClient.patch(
      `/emdr-session/${sessionId}/target`,
      data
    );
    return response.data.data;
  },

  // Save target with files
  saveTargetWithFiles: async (
    sessionId: string,
    data: {
      targetDescription: string;
      freezeFrame: string;
      targetFile?: File;
      freezeFrameFile?: File;
    }
  ) => {
    const formData = new FormData();
    formData.append('targetDescription', data.targetDescription);
    formData.append('freezeFrame', data.freezeFrame);
    
    if (data.targetFile) {
      formData.append('targetFile', data.targetFile);
    }
    if (data.freezeFrameFile) {
      formData.append('freezeFrameFile', data.freezeFrameFile);
    }

    const response = await apiClient.patch(
      `/emdr-session/${sessionId}/target`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // Save belief pairs
  saveBeliefPairs: async (sessionId: string, beliefPairs: Array<{
    negativeBelief: string;
    positiveBelief: string;
    vocRating: number;
  }>) => {
    const response = await apiClient.patch(
      `/emdr-session/${sessionId}/beliefs`,
      { beliefPairs }
    );
    return response.data.data;
  },

  // Save emotions
  saveEmotions: async (sessionId: string, data: {
    primaryEmotion: string;
    additionalEmotions?: string;
    bodyLocation: string;
  }) => {
    const response = await apiClient.patch(
      `/emdr-session/${sessionId}/emotions`,
      data
    );
    return response.data.data;
  },

  // Save SUD rating
  saveSud: async (sessionId: string, sudRating: number) => {
    const response = await apiClient.patch(
      `/emdr-session/${sessionId}/sud`,
      { sudRating }
    );
    return response.data.data;
  },

  // Save addiction context
  saveAddiction: async (sessionId: string, data: {
    aspect: string;
    positiveFeeling: string;
    pfsRating: number;
    associatedThoughts: string;
    bodyLocation: string;
    visualization: string;
  }) => {
    const response = await apiClient.patch(
      `/emdr-session/${sessionId}/addiction`,
      data
    );
    return response.data.data;
  },

  // Complete session
  completeSession: async (sessionId: string) => {
    const response = await apiClient.patch(
      `/emdr-session/${sessionId}/complete`
    );
    return response.data.data;
  },

  // Get session by ID
  getSession: async (sessionId: string) => {
    const response = await apiClient.get(`/emdr-session/${sessionId}`);
    return response.data.data;
  },

  // Get latest session
  getLatestSession: async () => {
    const response = await apiClient.get('/emdr-session/latest');
    return response.data.data;
  },

  // List sessions
  listSessions: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await apiClient.get('/emdr-session', { params });
    return response.data.data;
  },

  // Delete session
  deleteSession: async (sessionId: string) => {
    const response = await apiClient.delete(`/emdr-session/${sessionId}`);
    return response.data.data;
  },
};
```

#### 2. React Component Example

```typescript
// components/EMDRSessionForm.tsx
import React, { useState } from 'react';
import { emdrSessionApi } from '../services/emdrSessionApi';

export const EMDRSessionForm: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [targetFile, setTargetFile] = useState<File | null>(null);

  // Start session
  const handleStartSession = async () => {
    try {
      setLoading(true);
      const session = await emdrSessionApi.startSession('memory');
      setSessionId(session._id);
      alert('Session started!');
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  // Save target with file
  const handleSaveTarget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      setLoading(true);
      await emdrSessionApi.saveTargetWithFiles(sessionId, {
        targetDescription: formData.get('targetDescription') as string,
        freezeFrame: formData.get('freezeFrame') as string,
        targetFile: targetFile || undefined,
      });
      alert('Target saved successfully!');
    } catch (error) {
      console.error('Error saving target:', error);
      alert('Failed to save target');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>EMDR Session</h2>
      
      {!sessionId ? (
        <button onClick={handleStartSession} disabled={loading}>
          Start New Session
        </button>
      ) : (
        <form onSubmit={handleSaveTarget}>
          <div>
            <label>Target Description:</label>
            <textarea 
              name="targetDescription" 
              required 
              maxLength={2000}
            />
          </div>

          <div>
            <label>Freeze Frame:</label>
            <textarea 
              name="freezeFrame" 
              required 
              maxLength={2000}
            />
          </div>

          <div>
            <label>Upload Media (Optional):</label>
            <input
              type="file"
              accept="image/*,audio/*,video/*"
              onChange={(e) => setTargetFile(e.target.files?.[0] || null)}
            />
          </div>

          <button type="submit" disabled={loading}>
            Save Target
          </button>
        </form>
      )}
    </div>
  );
};
```

#### 3. React Native Example

```typescript
// screens/EMDRSessionScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { emdrSessionApi } from '../services/emdrSessionApi';

export const EMDRSessionScreen = () => {
  const [sessionId, setSessionId] = useState('');
  const [targetDescription, setTargetDescription] = useState('');
  const [freezeFrame, setFreezeFrame] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const startSession = async () => {
    try {
      const session = await emdrSessionApi.startSession('memory');
      setSessionId(session._id);
      Alert.alert('Success', 'Session started!');
    } catch (error) {
      Alert.alert('Error', 'Failed to start session');
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.audio],
      });
      setSelectedFile(result[0]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to pick file');
      }
    }
  };

  const saveTarget = async () => {
    try {
      const formData = new FormData();
      formData.append('targetDescription', targetDescription);
      formData.append('freezeFrame', freezeFrame);
      
      if (selectedFile) {
        formData.append('targetFile', {
          uri: selectedFile.uri,
          type: selectedFile.type,
          name: selectedFile.name,
        });
      }

      await emdrSessionApi.saveTargetWithFiles(sessionId, formData as any);
      Alert.alert('Success', 'Target saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save target');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>EMDR Session</Text>
      
      {!sessionId ? (
        <Button title="Start New Session" onPress={startSession} />
      ) : (
        <>
          <TextInput
            placeholder="Target Description"
            value={targetDescription}
            onChangeText={setTargetDescription}
            multiline
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />
          
          <TextInput
            placeholder="Freeze Frame"
            value={freezeFrame}
            onChangeText={setFreezeFrame}
            multiline
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />
          
          <Button title="Pick File (Optional)" onPress={pickFile} />
          {selectedFile && <Text>Selected: {selectedFile.name}</Text>}
          
          <Button title="Save Target" onPress={saveTarget} />
        </>
      )}
    </View>
  );
};
```

---

## ✅ Best Practices

### 1. Error Handling

```typescript
// Always wrap API calls in try-catch
try {
  const session = await emdrSessionApi.startSession('memory');
  // Handle success
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Handle API errors
    const message = error.response?.data?.message || 'Something went wrong';
    console.error('API Error:', message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

### 2. Loading States

```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await emdrSessionApi.saveTarget(sessionId, data);
  } finally {
    setLoading(false); // Always reset loading
  }
};
```

### 3. File Validation

```typescript
const validateFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'audio/mp3'];
  
  if (file.size > maxSize) {
    throw new Error('File too large (max 10MB)');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  return true;
};
```

### 4. Session State Management

```typescript
// Use Context or Redux to manage session state
interface EMDRSessionState {
  currentSessionId: string | null;
  sessionType: string | null;
  status: string;
}

// Save session ID to persist across page reloads
localStorage.setItem('currentSessionId', sessionId);
```

### 5. API Response Handling

```typescript
// Standardized response structure
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
  };
}

// Type-safe API calls
const session: IEmdrSession = await emdrSessionApi.startSession('memory');
```

---

## 🔄 Complete Flow Example

```typescript
// Complete EMDR Memory Session Flow
const completeMemorySession = async () => {
  try {
    // 1. Start session
    const session = await emdrSessionApi.startSession('memory');
    const sessionId = session._id;

    // 2. Save target
    await emdrSessionApi.saveTarget(sessionId, {
      targetDescription: 'Car accident memory',
      freezeFrame: 'Moment of impact',
    });

    // 3. Save belief pairs
    await emdrSessionApi.saveBeliefPairs(sessionId, [
      {
        negativeBelief: 'I am in danger',
        positiveBelief: 'I am safe now',
        vocRating: 3,
      },
    ]);

    // 4. Save emotions
    await emdrSessionApi.saveEmotions(sessionId, {
      primaryEmotion: 'Fear and panic',
      additionalEmotions: 'Helplessness',
      bodyLocation: 'Chest tightness, racing heart',
    });

    // 5. Save SUD rating
    await emdrSessionApi.saveSud(sessionId, 8);

    // 6. Complete session (after BLS)
    await emdrSessionApi.completeSession(sessionId);

    console.log('Session completed successfully!');
  } catch (error) {
    console.error('Session flow error:', error);
  }
};
```

---

## 📝 Summary

### Backend Changes Needed:
1. ✅ Add file URL fields to model
2. ✅ Update routes to support multipart/form-data
3. ✅ Update controller to handle file uploads
4. ✅ Update service to process and store files
5. ✅ Update validation to allow file fields

### Postman Testing:
1. ✅ Import collection
2. ✅ Set environment variables
3. ✅ Get auth token
4. ✅ Test text-only endpoints
5. ✅ Test file upload endpoints

### Frontend Integration:
1. ✅ Create API service layer
2. ✅ Handle FormData for file uploads
3. ✅ Implement error handling
4. ✅ Add loading states
5. ✅ Validate files before upload

---

**Need help with any specific part? Let me know!** 🚀
