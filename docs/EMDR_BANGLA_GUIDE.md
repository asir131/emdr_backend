# EMDR Session API - বাংলা গাইড 🇧🇩

## 📚 সম্পূর্ণ ইন্টিগ্রেশন গাইড

### ✅ কি কি করা হয়েছে:

1. **Backend Update** ✓
   - Model এ file URL field যোগ করা হয়েছে
   - Routes এ file upload support যোগ করা হয়েছে
   - Controller file handle করতে পারবে
   - Service file process করে Cloudinary তে upload করবে

2. **Postman Collection** ✓
   - 12টি API endpoint
   - File upload সহ সব request
   - Auto session ID save
   - Complete workflow examples

3. **Documentation** ✓
   - Complete integration guide (English)
   - Frontend examples (React & React Native)
   - Best practices

---

## 🚀 কিভাবে ব্যবহার করবেন

### ১. Postman দিয়ে Test করুন

#### Step 1: Collection Import করুন
```
1. Postman open করুন
2. Import button এ click করুন
3. File select করুন: postman/EMDR-SESSION-SYSTEM.postman_collection.json
4. Import করুন
```

#### Step 2: Environment Setup
```
1. Postman এ Environment তৈরি করুন
2. Variables add করুন:
   - baseUrl: http://localhost:5000/api
   - authToken: (আপনার JWT token)
   - sessionId: (auto save হবে)
```

#### Step 3: Auth Token নিন
```
1. Login/Register API call করুন
2. Response থেকে token copy করুন
3. Environment variable এ paste করুন
```

#### Step 4: API Test করুন

**Text Only Request:**
```json
POST /api/emdr-session/start
{
  "sessionType": "memory"
}
```

**File Upload Request:**
```
PATCH /api/emdr-session/{{sessionId}}/target
Content-Type: multipart/form-data

Form Data:
- targetDescription: "আমার childhood memory"
- freezeFrame: "যখন আমি একা ছিলাম"
- targetFile: [File select করুন]
- freezeFrameFile: [File select করুন]
```

---

### ২. Frontend Integration

#### React Example (Simple):

```typescript
// API call করার function
const saveTargetWithFile = async (sessionId, data, file) => {
  const formData = new FormData();
  formData.append('targetDescription', data.targetDescription);
  formData.append('freezeFrame', data.freezeFrame);
  
  if (file) {
    formData.append('targetFile', file);
  }

  const response = await fetch(
    `http://localhost:5000/api/emdr-session/${sessionId}/target`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${yourAuthToken}`,
      },
      body: formData,
    }
  );

  return response.json();
};

// Component এ use করুন
function EMDRForm() {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      targetDescription: e.target.targetDescription.value,
      freezeFrame: e.target.freezeFrame.value,
    };

    try {
      const result = await saveTargetWithFile(sessionId, data, file);
      alert('সফলভাবে save হয়েছে!');
    } catch (error) {
      alert('Error হয়েছে!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="targetDescription" placeholder="Target বর্ণনা" />
      <textarea name="freezeFrame" placeholder="Freeze frame" />
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files[0])}
        accept="image/*,audio/*"
      />
      <button type="submit">Save করুন</button>
    </form>
  );
}
```

#### React Native Example:

```typescript
import DocumentPicker from 'react-native-document-picker';

const pickAndUploadFile = async () => {
  try {
    // File pick করুন
    const result = await DocumentPicker.pick({
      type: [DocumentPicker.types.images, DocumentPicker.types.audio],
    });

    // FormData তৈরি করুন
    const formData = new FormData();
    formData.append('targetDescription', 'আমার memory');
    formData.append('freezeFrame', 'সেই মুহূর্ত');
    formData.append('targetFile', {
      uri: result[0].uri,
      type: result[0].type,
      name: result[0].name,
    });

    // API call করুন
    const response = await fetch(
      `http://localhost:5000/api/emdr-session/${sessionId}/target`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      }
    );

    const data = await response.json();
    Alert.alert('Success', 'File upload হয়েছে!');
  } catch (error) {
    Alert.alert('Error', 'File upload হয়নি!');
  }
};
```

---

### ৩. Complete Session Flow

#### Memory Session (সম্পূর্ণ flow):

```typescript
// 1. Session শুরু করুন
const session = await startSession('memory');
const sessionId = session._id;

// 2. Target save করুন (file সহ)
await saveTarget(sessionId, {
  targetDescription: 'Car accident এর memory',
  freezeFrame: 'Impact এর মুহূর্ত',
  targetFile: myFile, // optional
});

// 3. Belief pairs save করুন
await saveBeliefPairs(sessionId, [
  {
    negativeBelief: 'আমি নিরাপদ নই',
    positiveBelief: 'আমি এখন নিরাপদ',
    vocRating: 3,
  }
]);

// 4. Emotions save করুন
await saveEmotions(sessionId, {
  primaryEmotion: 'ভয় এবং আতঙ্ক',
  additionalEmotions: 'অসহায়তা',
  bodyLocation: 'বুকে চাপ, হাত কাঁপছে',
});

// 5. SUD rating save করুন
await saveSud(sessionId, 8);

// 6. Session complete করুন (BLS এর পরে)
await completeSession(sessionId);
```

#### Addiction Session:

```typescript
// 1. Session শুরু করুন
const session = await startSession('addiction');

// 2. Addiction context save করুন
await saveAddiction(session._id, {
  aspect: 'ব্যবহার করার আগের anticipation',
  positiveFeeling: 'শান্ত এবং confident',
  pfsRating: 7,
  associatedThoughts: 'এটা সব ঠিক করে দেবে',
  bodyLocation: 'বুকে উষ্ণতা',
  visualization: 'নীল আলো ছড়িয়ে যাচ্ছে',
});

// 3. Complete করুন
await completeSession(session._id);
```

---

## 🎯 API Endpoints Summary

### Session Management:
- `POST /api/emdr-session/start` - নতুন session শুরু
- `GET /api/emdr-session` - সব session list
- `GET /api/emdr-session/latest` - সর্বশেষ session
- `GET /api/emdr-session/:id` - একটি session দেখুন
- `DELETE /api/emdr-session/:id` - Session মুছে ফেলুন

### Memory/Future/Words/Negative Sessions:
- `PATCH /api/emdr-session/:id/target` - Target save (file support ✓)
- `PATCH /api/emdr-session/:id/beliefs` - Belief pairs save
- `PATCH /api/emdr-session/:id/emotions` - Emotions save
- `PATCH /api/emdr-session/:id/sud` - SUD rating save

### Addiction Sessions:
- `PATCH /api/emdr-session/:id/addiction` - Addiction context save

### Complete/Abandon:
- `PATCH /api/emdr-session/:id/complete` - Session complete করুন
- `PATCH /api/emdr-session/:id/abandon` - Session বাতিল করুন

---

## 📝 Important Notes

### File Upload:
- **Supported formats**: JPG, PNG, GIF, MP3, WAV, MP4
- **Max size**: 10MB
- **Storage**: Cloudinary (automatic)
- **Fields**: `targetFile`, `freezeFrameFile`

### Validation:
- **VOC Rating**: 1-7 (1=একদম সত্য নয়, 7=সম্পূর্ণ সত্য)
- **SUD Rating**: 0-10 (0=কোন distress নেই, 10=সবচেয়ে বেশি)
- **PFS Rating**: 0-10 (Addiction এর জন্য)

### Session Status:
- `in_progress` - চলছে
- `ready_for_bls` - BLS এর জন্য ready
- `completed` - সম্পন্ন
- `abandoned` - বাতিল

### Session Types:
- `memory` - Past memory
- `future` - Future scenario
- `words` - Negative words
- `negative` - Negative emotions
- `addiction` - Addiction protocol

---

## 🔥 Quick Tips

1. **Auth Token সবসময় পাঠান**:
   ```
   Authorization: Bearer your-jwt-token
   ```

2. **File upload এর জন্য Content-Type পরিবর্তন করবেন না**:
   - Browser/FormData automatically set করবে

3. **Error handling করুন**:
   ```typescript
   try {
     await apiCall();
   } catch (error) {
     console.error('Error:', error.response?.data?.message);
   }
   ```

4. **Loading state ব্যবহার করুন**:
   ```typescript
   const [loading, setLoading] = useState(false);
   ```

5. **Session ID save করুন**:
   ```typescript
   localStorage.setItem('sessionId', session._id);
   ```

---

## 📞 Need Help?

- **Full Documentation**: `docs/EMDR_SESSION_INTEGRATION_GUIDE.md`
- **Postman Collection**: `postman/EMDR-SESSION-SYSTEM.postman_collection.json`
- **Code Examples**: Documentation এ React & React Native examples আছে

---

**সব কিছু ready! এখন test করুন এবং integrate করুন! 🚀**
