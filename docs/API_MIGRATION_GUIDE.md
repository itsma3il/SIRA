# API Migration Guide - Quick Start

## TL;DR

**Old:**
```typescript
import { listSessions } from "@/lib/api/conversations";
import { profilesApi } from "@/lib/profile-api";

const sessions = await listSessions(token);
const profiles = await profilesApi.list(token);
```

**New:**
```typescript
import { api } from "@/lib/api";

const sessions = await api.conversations.listSessions(token);
const profiles = await api.profiles.list(token);
```

---

## Complete API Reference

### Profiles API

```typescript
import { api } from "@/lib/api";

// List all profiles
const profiles = await api.profiles.list(token);

// Get single profile
const profile = await api.profiles.getById(token, profileId);

// Create profile
const newProfile = await api.profiles.create(token, {
  profile_name: "Engineering Path",
  status: "draft",
  academic_record: { /* ... */ },
  preferences: { /* ... */ },
});

// Update profile
const updated = await api.profiles.update(token, profileId, {
  profile_name: "Updated Name",
});

// Delete profile
await api.profiles.deleteById(token, profileId);

// Change status
const activated = await api.profiles.changeStatus(token, profileId, {
  status: "active",
});

// Upload transcript
const result = await api.profiles.uploadTranscript(token, file);

// Delete transcript
await api.profiles.deleteTranscript(token, filename);
```

### Conversations API

```typescript
import { api } from "@/lib/api";

// List sessions
const { sessions, total } = await api.conversations.listSessions(token, {
  profile_id: "...",  // optional
  status: "active",   // optional
  limit: 10,          // optional
});

// Get session detail
const session = await api.conversations.getSession(token, sessionId);

// Create session
const newSession = await api.conversations.createSession(token, {
  profile_id: profileId,  // optional
  title: "Career Advice",  // optional
});

// Update session
const updated = await api.conversations.updateSession(token, sessionId, {
  title: "New Title",       // optional
  status: "archived",       // optional
  profile_id: profileId,    // optional
});

// Delete session
await api.conversations.deleteSession(token, sessionId);

// Send message (non-streaming)
const { user_message, assistant_message } = await api.conversations.sendMessage(
  token,
  sessionId,
  { content: "Hello!" }
);

// Generate recommendation (non-streaming)
const { recommendation_id, message_id } = await api.conversations.generateRecommendation(
  token,
  sessionId
);

// Helper methods
await api.conversations.archiveSession(token, sessionId);
await api.conversations.restoreSession(token, sessionId);
await api.conversations.attachProfile(token, sessionId, profileId);
await api.conversations.detachProfile(token, sessionId);
```

### Recommendations API

```typescript
import { api } from "@/lib/api";

// Generate recommendation
const recommendation = await api.recommendations.generate(token, {
  profile_id: profileId,
  session_id: sessionId,  // REQUIRED
});

// Get recommendations by profile
const { recommendations, total } = await api.recommendations.getByProfile(
  token,
  profileId,
  10  // limit (optional, default 10)
);

// Get single recommendation
const rec = await api.recommendations.getById(token, recommendationId);

// Submit feedback
const updated = await api.recommendations.submitFeedback(
  token,
  recommendationId,
  {
    feedback_rating: 5,  // 1-5
    feedback_comment: "Very helpful!",  // optional
  }
);

// Delete recommendation
await api.recommendations.deleteById(token, recommendationId);
```

---

## Error Handling

### New ApiException

```typescript
import { api, ApiException } from "@/lib/api";

try {
  await api.profiles.create(token, data);
} catch (error) {
  if (error instanceof ApiException) {
    console.log(error.status);   // HTTP status code
    console.log(error.message);  // Error message
    console.log(error.detail);   // Detailed error (optional)
    console.log(error.code);     // Error code (optional)
    
    // Helper methods
    if (error.isAuthError()) {
      // 401 or 403 - redirect to login
      router.push("/sign-in");
    } else if (error.isClientError()) {
      // 4xx - show validation error
      toast.error(error.message);
    } else if (error.isServerError()) {
      // 5xx - log and show generic error
      console.error("Server error:", error);
      toast.error("Server error. Please try again.");
    }
  }
}
```

---

## Migration Checklist

### Step 1: Update Imports

**Old:**
```typescript
import { createSession, listSessions } from "@/lib/api/conversations";
import { profilesApi } from "@/lib/profile-api";
import * as conversationsApi from "@/lib/api/conversations";
```

**New:**
```typescript
import { api } from "@/lib/api";
```

### Step 2: Update API Calls

**Profiles:**
```typescript
// OLD → NEW
profilesApi.list(token)
→ api.profiles.list(token)

profilesApi.get(token, id)
→ api.profiles.getById(token, id)

profilesApi.delete(token, id)
→ api.profiles.deleteById(token, id)

uploadTranscript(token, file)
→ api.profiles.uploadTranscript(token, file)

deleteTranscript(token, filename)
→ api.profiles.deleteTranscript(token, filename)
```

**Conversations:**
```typescript
// OLD → NEW
listSessions(token, params)
→ api.conversations.listSessions(token, params)

getSession(token, id)
→ api.conversations.getSession(token, id)

createSession(token, data)
→ api.conversations.createSession(token, data)

updateSession(token, id, data)
→ api.conversations.updateSession(token, id, data)

deleteSession(token, id)
→ api.conversations.deleteSession(token, id)

sendMessage(token, id, data)
→ api.conversations.sendMessage(token, id, data)
```

**Recommendations:**
```typescript
// OLD → NEW
generateRecommendation(profileId, token)
→ api.recommendations.generate(token, { profile_id, session_id })

getProfileRecommendations(profileId, token, limit)
→ api.recommendations.getByProfile(token, profileId, limit)

getRecommendation(recId, token)
→ api.recommendations.getById(token, recId)

submitRecommendationFeedback(recId, feedback, token)
→ api.recommendations.submitFeedback(token, recId, feedback)
```

### Step 3: Update Error Handling

**Old:**
```typescript
try {
  await createSession(token, data);
} catch (error) {
  toast.error(error.message);
}
```

**New:**
```typescript
import { api, ApiException } from "@/lib/api";

try {
  await api.conversations.createSession(token, data);
} catch (error) {
  if (error instanceof ApiException) {
    if (error.isAuthError()) {
      // Handle auth errors
    }
    toast.error(error.message);
  }
}
```

---

## Common Patterns

### Pattern 1: List & Create

```typescript
// List items
const items = await api.profiles.list(token);

// Create new item
const newItem = await api.profiles.create(token, payload);

// Refresh list
const updatedItems = await api.profiles.list(token);
```

### Pattern 2: Get, Update, Refresh

```typescript
// Get current state
const item = await api.profiles.getById(token, id);

// Update
const updated = await api.profiles.update(token, id, changes);

// Refresh from server
const refreshed = await api.profiles.getById(token, id);
```

### Pattern 3: Error Handling with Toast

```typescript
try {
  await api.conversations.createSession(token, data);
  toast.success("Session created!");
} catch (error) {
  if (error instanceof ApiException) {
    toast.error(error.message);
  } else {
    toast.error("Unexpected error occurred");
  }
}
```

---

## Breaking Changes

### 1. RecommendationCreate now requires `session_id`

**Old:**
```typescript
const rec = await generateRecommendation(profileId, token);
```

**New:**
```typescript
const rec = await api.recommendations.generate(token, {
  profile_id: profileId,
  session_id: sessionId,  // NOW REQUIRED
});
```

### 2. Method name changes

| Old | New |
|-----|-----|
| `profilesApi.get()` | `api.profiles.getById()` |
| `profilesApi.delete()` | `api.profiles.deleteById()` |
| `generateRecommendation()` | `api.recommendations.generate()` |
| `getRecommendation()` | `api.recommendations.getById()` |

### 3. Import changes

**All old imports are replaced by:**
```typescript
import { api } from "@/lib/api";
```

**For error handling:**
```typescript
import { api, ApiException } from "@/lib/api";
```

---

## Testing Your Migration

### 1. Type Check
```bash
cd frontend
bun run type-check
```

### 2. Build Check
```bash
bun run build
```

### 3. Runtime Test
```bash
bun run dev
```

Test these operations:
- ✅ Create profile
- ✅ List profiles
- ✅ Update profile
- ✅ Create conversation session
- ✅ Send message
- ✅ Generate recommendation
- ✅ Archive/restore session

---

## FAQ

### Q: Do I need to update streaming endpoints?
**A:** No, streaming uses different hooks (`useConversationStream`, `useRecommendationStream`). Those remain unchanged.

### Q: Can I mix old and new API?
**A:** No, all old functional APIs have been replaced. Use the new `api` object exclusively.

### Q: What about error logging?
**A:** `ApiException` includes full error details. Log `error.status`, `error.detail`, and `error.code` to your monitoring service.

### Q: How do I mock the API for testing?
**A:**
```typescript
import { ProfilesService } from "@/lib/api/profiles.service";

jest.mock("@/lib/api", () => ({
  api: {
    profiles: {
      list: jest.fn(),
      create: jest.fn(),
    },
  },
}));
```

---

## Need Help?

1. Check [API_REFACTORING_COMPLETE.md](./API_REFACTORING_COMPLETE.md) for full documentation
2. Look at updated hooks/pages for examples
3. All TypeScript types are fully documented with JSDoc

**All changes are backward compatible** - existing features work exactly as before, just with better architecture!
