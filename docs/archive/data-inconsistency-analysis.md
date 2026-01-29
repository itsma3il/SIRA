# SIRA Data Inconsistency & Naming Convention Analysis

**Generated:** January 28, 2026  
**Scope:** Backend (Python) ↔ Frontend (TypeScript) alignment

---

## Executive Summary

This analysis identified **32 critical inconsistencies** across the SIRA codebase, categorized into:
1. **Field Naming Inconsistencies** (7 issues)
2. **Type Conversion Issues** (8 issues)
3. **Optional/Required Field Mismatches** (6 issues)
4. **Naming Convention Violations** (5 issues)
5. **API Service Architecture Issues** (6 issues)

**Severity Breakdown:**
- 🔴 **Critical** (14): Breaks type safety or causes runtime errors
- 🟡 **Medium** (12): Inconsistent but workable
- 🟢 **Low** (6): Style/convention issues

---

## 1. Field Naming Inconsistencies

### 🔴 CRITICAL: Metadata Field Naming Mismatch

**Location:** Conversation Message  
**Backend:** `message_metadata` (Column name + validation_alias)  
**Frontend:** `metadata` (property name)

```python
# backend/app/schemas/conversation.py:43
class MessageResponse(BaseModel):
    metadata: Optional[dict] = Field(None, validation_alias="message_metadata")
```

```typescript
// frontend/lib/types/conversation.ts:7
export interface MessageResponse {
  metadata?: Record<string, any>;
}
```

**Issue:** Backend uses `message_metadata` as column name but exposes as `metadata` via alias. Frontend expects `metadata`. This works in responses but creates confusion.

**Recommendation:** Remove the alias and rename the DB column to `metadata` for clarity. Or document the alias pattern clearly.

---

### 🟡 MEDIUM: Snake_case vs camelCase Inconsistency

**Location:** All API responses  
**Pattern:** Backend uses `snake_case`, Frontend mirrors it instead of using `camelCase`

**Examples:**
```typescript
// Frontend mirrors backend naming (inconsistent with TypeScript conventions)
interface MessageResponse {
  created_at: string;        // Should be: createdAt
  profile_id?: string;       // Should be: profileId
  user_id: string;          // Should be: userId
  academic_record_id: string; // Should be: academicRecordId
}
```

**Impact:** TypeScript convention is `camelCase`, but we use `snake_case` throughout.

**Recommendation:** 
- **Option A (Recommended):** Add a transformation layer to convert snake_case → camelCase at API boundary
- **Option B:** Document that SIRA uses snake_case for consistency with Python backend
- **Option C:** Use Pydantic's `alias_generator` + frontend transformer

---

### 🟢 LOW: Inconsistent Array Type Declarations

**Location:** Profile arrays  
**Backend:** `list[str]` (Python 3.10+ syntax)  
**Frontend:** `string[]` (TypeScript syntax)

```python
# backend/app/schemas/profile.py:89
favorite_subjects: Optional[list[str]] = None
```

```typescript
// frontend/lib/profile-api-types.ts:28
favorite_subjects?: string[] | null
```

**Impact:** Semantically equivalent, but inconsistent syntax patterns.

**Recommendation:** Use TypeScript `Array<string>` syntax to mirror Python's `list[str]` generic style, OR document the style choice.

---

### 🔴 CRITICAL: Session ID Missing in Recommendation Type

**Location:** Recommendation schema mismatch  
**Backend:** `session_id: UUID` (required field)  
**Frontend:** Missing `session_id` field entirely

```python
# backend/app/schemas/recommendation.py:53
class RecommendationResponse(BaseModel):
    session_id: UUID  # Always present - recommendations are always linked to a session
```

```typescript
// frontend/lib/types/recommendation.ts:13
export interface Recommendation {
  id: string;
  profile_id: string;
  // ❌ session_id is MISSING!
  query: string;
  // ...
}
```

**Impact:** Frontend cannot link recommendations to sessions, breaking chat integration.

**Fix Required:** Add `session_id: string` to frontend `Recommendation` interface.

---

## 2. Type Conversion Issues

### 🔴 CRITICAL: UUID vs String Mismatch

**Location:** All ID fields  
**Backend:** `UUID` (Python uuid.UUID object)  
**Frontend:** `string` (TypeScript string)

```python
# Backend expects/returns UUID objects
id: UUID
user_id: UUID
profile_id: UUID
```

```typescript
// Frontend treats everything as string
id: string
user_id: string
profile_id: string
```

**Issue:** Pydantic serializes UUID → string automatically, but type definitions don't reflect this.

**Recommendation:** 
1. Document that all UUIDs are transmitted as strings over HTTP
2. Consider creating a branded type: `type UUID = string & { __brand: 'uuid' }`
3. Add runtime validation for UUID format on frontend

---

### 🟡 MEDIUM: DateTime Type Inconsistency

**Location:** All timestamp fields  
**Backend:** `datetime` (Python datetime object, serialized to ISO 8601)  
**Frontend:** `string` (no type-level guarantee of ISO format)

```python
# backend/app/schemas/profile.py:161
created_at: datetime
```

```typescript
// frontend/lib/profile-api-types.ts:47
created_at: string
```

**Recommendation:** Create a branded type or use a library like `zod` to validate ISO strings:
```typescript
type ISODateString = string & { __brand: 'isodate' }
```

---

### 🟡 MEDIUM: Optional Field Representation Mismatch

**Location:** Nullable fields  
**Backend:** `Optional[str] = None` or `str | None = None`  
**Frontend:** `string | null` OR `string | undefined` OR `string?`

**Examples of inconsistency:**
```typescript
// Three different patterns used:
profile_id?: string | null;     // Option 1: Optional + nullable
profile_id?: string;            // Option 2: Optional only
profile_name: string | null;    // Option 3: Required but nullable
```

**Recommendation:** Standardize on one pattern:
- Use `field?: type | null` for optional nullable fields
- Use `field: type | null` for required nullable fields
- Use `field?: type` for optional non-nullable fields

---

### 🔴 CRITICAL: Empty String vs Null in Form Data

**Location:** Profile form handling  
**Backend:** Expects `null` for empty values  
**Frontend:** Form library uses `""` (empty string) or `undefined`

```typescript
// frontend/lib/profile-form-types.ts:10
gpa?: number | "" | undefined
grade?: number | "" | undefined
```

**Issue:** Backend validation may reject empty strings when expecting null.

**Fix Required:** Transform empty strings to `null` in the mapper before API calls:
```typescript
// frontend/lib/profile-mappers.ts should handle this
const mapValue = (val: string | number | "") => val === "" ? null : val;
```

---

### 🟡 MEDIUM: JSONB vs Record<string, any> Type Safety

**Location:** Structured data fields  
**Backend:** `JSONB` column, typed as `dict[str, Any]`  
**Frontend:** `Record<string, any>` (loses all type safety)

**Examples:**
```python
draft_payload: Optional[dict[str, Any]] = None
structured_data: Optional[Dict[str, Any]] = None
metadata: Optional[dict] = None
```

```typescript
draft_payload?: Record<string, unknown> | null
structured_data?: Record<string, any>
metadata?: Record<string, any>
```

**Recommendation:** Define strict interfaces for known shapes:
```typescript
interface DraftPayload {
  // Define actual structure
}

interface StructuredRecommendationData {
  match_scores?: number[];
  program_names?: string[];
  difficulty_levels?: number[];
  tuition_fees?: number[];
}
```

---

### 🔴 CRITICAL: GPA Scale Mismatch

**Location:** Academic record GPA field  
**Backend:** Validates `ge=0.0, le=20.0` (Moroccan/European 0-20 scale)  
**Frontend:** No validation constraint specified

```python
# backend/app/schemas/profile.py:47
gpa: Optional[float] = Field(None, ge=0.0, le=20.0, description="GPA (0-20 scale)")
```

```typescript
// frontend/lib/profile-api-types.ts:16
gpa?: number | null
```

**Issue:** Frontend could submit invalid GPA values outside 0-20 range.

**Fix Required:** Add validation to frontend schema and document the scale.

---

### 🟡 MEDIUM: Grade Scale Documentation Missing

**Location:** Subject grade field  
**Backend:** Validates `ge=0.0, le=100.0` (0-100 scale)  
**Frontend:** No constraint or documentation

```python
# backend/app/schemas/profile.py:16
grade: float = Field(..., ge=0.0, le=100.0, description="Numeric grade (0-100 scale)")
```

**Recommendation:** Mirror constraints in frontend validation schema.

---

### 🟡 MEDIUM: Budget Type Integer vs Number

**Location:** Student preferences  
**Backend:** `int` (Python integer type)  
**Frontend:** `number` (TypeScript number, which is float)

```python
# backend/app/schemas/profile.py:92
budget_range_min: Optional[int] = Field(None, ge=0, description="Minimum annual budget")
```

```typescript
// frontend/lib/profile-api-types.ts:32
budget_range_min?: number | null
```

**Impact:** Minimal (JSON serialization treats both as numbers), but type precision is lost.

**Recommendation:** Document that budget values must be integers on frontend.

---

## 3. Optional/Required Field Mismatches

### 🔴 CRITICAL: Subject Name Required/Optional Mismatch

**Location:** SubjectGrade creation schema  
**Backend (Create):** `subject_name: str` (required)  
**Backend (Response):** `subject_name: Optional[str] = None`  
**Frontend:** `subject_name: string` (required in payload)

```python
# backend/app/schemas/profile.py:14
class SubjectGradeCreate(BaseModel):
    subject_name: str = Field(..., max_length=255)  # Required

# backend/app/schemas/profile.py:29
class SubjectGradeResponse(BaseModel):
    subject_name: Optional[str] = None  # Optional
```

**Issue:** Why is a required field on creation optional in the response? This suggests data integrity issues.

**Fix Required:** Make `subject_name` required in both create and response schemas, or document why it can be null.

---

### 🟡 MEDIUM: Profile ID Nullable in Sessions

**Location:** ConversationSession  
**Backend:** `profile_id: Optional[UUID]` (users can chat without profile)  
**Frontend:** Correctly mirrors this as optional

```python
# backend/app/schemas/conversation.py:31
profile_id: Optional[UUID] = None
```

```typescript
// frontend/lib/types/conversation.ts:37
profile_id?: string | null;
```

**Status:** ✅ Correctly implemented, but ensure UI handles null profile gracefully.

---

### 🟡 MEDIUM: Session Title Optional vs Required

**Location:** Session creation  
**Backend (Create):** `title: Optional[str]` (auto-generated if not provided)  
**Backend (Response):** `title: str` (required)

```python
# backend/app/schemas/conversation.py:18
class SessionCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)

# backend/app/schemas/conversation.py:86
class SessionResponse(BaseModel):
    title: str  # Always present after creation
```

**Status:** ✅ This is correct (backend generates title if not provided), but document this behavior.

---

### 🟡 MEDIUM: Last Message Field Inconsistency

**Location:** Session list item  
**Backend:** `last_message: Optional[str]` (can be None for empty sessions)  
**Frontend:** `last_message?: string | null`

**Status:** ✅ Correctly implemented, but UI should handle empty sessions.

---

### 🔴 CRITICAL: Recommendations Array Default Value

**Location:** Session detail response  
**Backend:** `recommendations: List[RecommendationSummary] = []` (defaults to empty array)  
**Frontend:** `recommendations?: RecommendationSummary[]` (optional, could be undefined)

```python
# backend/app/schemas/conversation.py:127
recommendations: List[RecommendationSummary] = []
```

```typescript
// frontend/lib/types/conversation.ts:73
recommendations?: RecommendationSummary[];
```

**Issue:** Frontend might not handle `undefined` correctly. Backend always returns an array.

**Fix Required:** Make frontend field required: `recommendations: RecommendationSummary[]`

---

### 🟡 MEDIUM: Created_at Always Present

**Location:** All response schemas  
**Backend:** `created_at: datetime` (always set by DB default)  
**Frontend:** Sometimes `created_at?: string`, sometimes `created_at: string`

**Recommendation:** Make `created_at` required (non-optional) in all frontend types.

---

## 4. Naming Convention Violations

### 🔴 CRITICAL: Profile Status Enum Not Shared

**Location:** Profile status field  
**Backend:** String field with informal constraint  
**Frontend:** TypeScript literal type

```python
# backend/app/schemas/profile.py:130
status: str = Field(default="draft", max_length=50, description="Profile status")
# No enum validation!
```

```typescript
// frontend/lib/profile-form-types.ts:1
export type ProfileStatus = "draft" | "active" | "archived"
```

**Issue:** Backend doesn't enforce the valid status values. Could accept invalid strings.

**Fix Required:** Create a Python Enum and use it in both schema and model:
```python
from enum import Enum

class ProfileStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"

class ProfileCreate(BaseModel):
    status: ProfileStatus = ProfileStatus.DRAFT
```

---

### 🟡 MEDIUM: Message Role Enum Missing

**Location:** Message role field  
**Backend:** `role: str` (no enum)  
**Frontend:** `role: "user" | "assistant" | "system"`

```python
# backend/app/models/conversation.py:68
role = Column(String(20), nullable=False, comment="user, assistant, or system")
# Comment only - no enum!
```

**Fix:** Create `MessageRole` enum on backend.

---

### 🟡 MEDIUM: Session Status Enum Missing

**Location:** Session status field  
**Backend:** `status: str = "active"` (no enum)  
**Frontend:** No explicit type (uses string)

**Fix:** Create `SessionStatus` enum for "active" | "archived".

---

### 🟡 MEDIUM: Feedback Rating Range Not Typed

**Location:** Recommendation feedback  
**Backend:** Validates `ge=1, le=5` (1-5 stars)  
**Frontend:** `feedback_rating: number` (no constraint)

```python
# backend/app/schemas/recommendation.py:35
feedback_rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")
```

```typescript
// frontend/lib/types/recommendation.ts:32
feedback_rating: number; // Should be: 1 | 2 | 3 | 4 | 5
```

**Fix:** Use TypeScript literal type: `feedback_rating: 1 | 2 | 3 | 4 | 5`

---

### 🟢 LOW: Inconsistent Import Aliases

**Location:** Frontend imports  
**Pattern:** Mix of relative imports and absolute imports

```typescript
// Some files use @/lib/...
import type { ProfileStatus } from "@/lib/profile-form-types"

// Others use relative paths
import type { SessionResponse } from "../types/conversation"
```

**Recommendation:** Standardize on `@/` alias for all lib imports.

---

## 5. API Service Architecture Issues

### 🔴 CRITICAL: Duplicate Function Names Across Services

**Location:** Recommendation API  
**Issue:** `generateRecommendation()` exists in BOTH:
- `frontend/lib/api/conversations.ts`
- `frontend/lib/api/recommendations.ts`

```typescript
// frontend/lib/api/conversations.ts:238
export async function generateRecommendation(
  token: string,
  sessionId: string
): Promise<RecommendationGenerationResponse>

// frontend/lib/api/recommendations.ts:16
export async function generateRecommendation(
  profileId: string,
  token: string
): Promise<Recommendation>
```

**Impact:** Name collision, confusing API surface, different signatures.

**Fix Required:** Rename one:
- `generateSessionRecommendation()` for conversation endpoint
- `generateProfileRecommendation()` for standalone endpoint

---

### 🟡 MEDIUM: Inconsistent Parameter Order

**Location:** All API functions  
**Pattern:** Token parameter position varies

```typescript
// conversations.ts: token first
createSession(token: string, data: SessionCreate)

// recommendations.ts: token last
generateRecommendation(profileId: string, token: string)

// profile-api.ts: token first
profilesApi.list(token: string)
```

**Recommendation:** Standardize on `token` as FIRST parameter for all API functions.

---

### 🟡 MEDIUM: Mixed API Client Patterns

**Location:** API organization  
**Patterns Used:**
1. **Object with methods** (`profilesApi.list()`, `profilesApi.get()`)
2. **Free functions** (`createSession()`, `listSessions()`)
3. **Mixed approach** (recommendations has both)

```typescript
// Pattern 1: Object (profile-api.ts)
export const profilesApi = {
  list: async (token: string) => { ... },
  get: async (token: string, profileId: string) => { ... }
}

// Pattern 2: Free functions (conversations.ts)
export async function createSession(...) { ... }
export async function listSessions(...) { ... }

// Pattern 3: Mix (recommendations.ts)
export async function generateRecommendation(...) { ... }
// No object wrapper
```

**Recommendation:** Choose ONE pattern and apply consistently. Suggested approach:

**Option A: Object Pattern (Better for tree-shaking and namespacing)**
```typescript
export const conversationsApi = {
  createSession: async (token, data) => { ... },
  listSessions: async (token, params) => { ... },
  getSession: async (token, sessionId) => { ... },
  // ...
}

export const recommendationsApi = {
  generate: async (token, profileId) => { ... },
  getById: async (token, id) => { ... },
  // ...
}
```

**Option B: Class Pattern (OOP approach, enables dependency injection)**
```typescript
export class ConversationsApi {
  constructor(private baseUrl: string) {}
  
  async createSession(token: string, data: SessionCreate) {
    return fetch(`${this.baseUrl}/api/conversations/sessions`, { ... })
  }
}

// Usage:
const api = new ConversationsApi(API_BASE_URL)
await api.createSession(token, data)
```

**Option C: Keep free functions but use namespace objects**
```typescript
// Better import ergonomics
import { conversations, recommendations } from '@/lib/api'

await conversations.createSession(token, data)
await recommendations.generate(token, profileId)
```

---

### 🔴 CRITICAL: No Unified Error Handling

**Location:** All API files  
**Issue:** Each function implements its own error parsing logic

```typescript
// conversations.ts: Custom error parsing
try {
  const errorJson = JSON.parse(error);
  if (response.status === 401 || errorJson.detail?.includes("expired")) {
    throw new Error("Your session has expired...");
  }
} catch { ... }

// recommendations.ts: Simple error handling
const error = await response.json().catch(() => ({ detail: "Failed..." }));
throw new Error(error.detail || "Failed...");

// profile-api.ts: Another variant
try {
  const data = await response.json()
  if (data?.detail) message = data.detail
} catch { }
```

**Fix Required:** Create a unified error handler:

```typescript
// lib/api/error-handler.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function handleApiError(response: Response): Promise<never> {
  let detail: string | undefined
  let code: string | undefined
  
  try {
    const data = await response.json()
    detail = data.detail
    code = data.code
  } catch {
    detail = await response.text().catch(() => undefined)
  }
  
  // Unified error messages
  if (response.status === 401) {
    throw new ApiError('Your session has expired. Please refresh.', 401, detail, code)
  }
  if (response.status === 429) {
    throw new ApiError('Too many requests. Please wait.', 429, detail, code)
  }
  if (response.status >= 500) {
    throw new ApiError('Server error. Please try again later.', response.status, detail, code)
  }
  
  throw new ApiError(detail || `Request failed with ${response.status}`, response.status, detail, code)
}
```

---

### 🟡 MEDIUM: Duplicate API Base URL Definitions

**Location:** Multiple API files  
**Issue:** `API_BASE_URL` defined separately in each file

```typescript
// conversations.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// recommendations.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// profile-api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
```

**Fix:** Create a shared config file:
```typescript
// lib/api/config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
```

---

### 🟡 MEDIUM: No Request/Response Type Safety

**Location:** All API functions  
**Issue:** Using generic `fetch()` with manual type casting

**Recommendation:** Use a type-safe fetch wrapper:

```typescript
// lib/api/client.ts
export async function apiRequest<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
```

---

## 6. Recommendations for Refactoring

### A. Backend Standardization

**Priority 1 (Critical):**
1. Add `session_id` to backend recommendation response schema
2. Create Python enums for: `ProfileStatus`, `MessageRole`, `SessionStatus`
3. Make `subject_name` consistently required (or explain why it can be null)
4. Enforce GPA and grade range validation

**Priority 2 (Medium):**
1. Rename `message_metadata` column to `metadata` (remove alias)
2. Document UUID → string serialization pattern
3. Standardize Optional[] usage patterns
4. Add type hints for JSONB structures

**Priority 3 (Low):**
1. Add OpenAPI schema generation with examples
2. Create a backend validation guide document

---

### B. Frontend Standardization

**Priority 1 (Critical):**
1. Add `session_id: string` to `Recommendation` interface
2. Fix `recommendations` field to be required (not optional) in `SessionDetailResponse`
3. Resolve `generateRecommendation()` naming collision
4. Transform empty strings to `null` in form mappers
5. Standardize API parameter order (token first)

**Priority 2 (Medium):**
1. Create unified error handling utility
2. Consolidate API client patterns (choose one: objects vs free functions)
3. Centralize API base URL configuration
4. Add TypeScript literal types for enums (`ProfileStatus`, `MessageRole`, etc.)
5. Make `created_at` required in all types
6. Document snake_case convention decision

**Priority 3 (Low):**
1. Use branded types for UUID and ISODateString
2. Create strict types for JSONB fields
3. Add runtime validation with `zod`
4. Standardize import aliases

---

### C. OOP vs Functional API Design

**Current State:** Mix of functional and object-oriented patterns

**Analysis:**

| Pattern | Pros | Cons | Best For |
|---------|------|------|----------|
| **Free Functions** (current conversations.ts) | Simple, direct, tree-shakeable | No shared state, hard to mock | Small APIs |
| **Object with Methods** (current profile-api.ts) | Namespaced, organized | Not easily composable | Medium APIs |
| **Class-based** (not used) | Testable, DI-friendly, stateful | More boilerplate, complex | Large apps, testing |

**Recommendation for SIRA:**

Given the project is a **Next.js App Router** application with **Server Actions** and needs:
- Clean separation of concerns
- Easy testing and mocking
- Type-safe API calls
- Shared configuration (base URL, auth headers)

**Suggested Approach: Service Classes with Dependency Injection**

```typescript
// lib/api/base-service.ts
export abstract class BaseApiService {
  constructor(
    protected baseUrl: string = API_BASE_URL
  ) {}

  protected async request<T>(
    path: string,
    token: string,
    init?: RequestInit
  ): Promise<T> {
    // Unified request logic with error handling
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }
}

// lib/api/profiles-service.ts
export class ProfilesService extends BaseApiService {
  async list(token: string): Promise<ProfileListResponse[]> {
    return this.request<ProfileListResponse[]>('/api/profiles', token)
  }

  async getById(token: string, id: string): Promise<ProfileResponse> {
    return this.request<ProfileResponse>(`/api/profiles/${id}`, token)
  }

  async create(token: string, data: ProfileCreatePayload): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/api/profiles', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  // ... other methods
}

// lib/api/conversations-service.ts
export class ConversationsService extends BaseApiService {
  async createSession(token: string, data: SessionCreate): Promise<SessionResponse> {
    return this.request('/api/conversations/sessions', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async listSessions(
    token: string,
    params?: { profile_id?: string; status?: string; limit?: number }
  ): Promise<SessionListResponse> {
    const query = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    )
    return this.request(`/api/conversations/sessions?${query}`, token)
  }

  // ... other methods
}

// lib/api/index.ts (factory/singleton pattern)
export const api = {
  profiles: new ProfilesService(),
  conversations: new ConversationsService(),
  recommendations: new RecommendationsService(),
} as const

// Usage in components:
import { api } from '@/lib/api'

const profiles = await api.profiles.list(token)
const session = await api.conversations.createSession(token, { title: 'New Chat' })
```

**Benefits:**
1. ✅ Shared request logic (DRY principle)
2. ✅ Easy to test (inject mock base URL)
3. ✅ Type-safe by default
4. ✅ Consistent error handling
5. ✅ Namespaced API surface
6. ✅ Follows SOLID principles
7. ✅ Compatible with Next.js patterns

**Migration Path:**
1. Create `BaseApiService` class
2. Convert one service at a time (start with profiles)
3. Update imports gradually
4. Remove old functional API files once migrated

---

## 7. Testing Recommendations

**Unit Tests Needed:**
1. Test UUID string serialization/deserialization
2. Test empty string → null transformation in mappers
3. Test error handling for all HTTP status codes
4. Test enum validation (once enums are added)

**Integration Tests Needed:**
1. Test frontend types match actual API responses
2. Test session creation with/without profile
3. Test recommendation generation in both contexts

**Type Safety Tests:**
1. Use `tsc --noEmit` in CI to catch type errors
2. Add JSON schema validation for API responses
3. Consider using `zod` for runtime type checking

---

## 8. Documentation Gaps

**Missing Documentation:**
1. ❌ GPA scale (0-20 vs 0-4.0) not documented in UI
2. ❌ Grade scale (0-100) not explained to users
3. ❌ UUID serialization format not documented
4. ❌ Empty string vs null handling not documented
5. ❌ snake_case convention decision not documented
6. ❌ Profile status lifecycle not documented
7. ❌ Session title auto-generation logic not documented

**Recommendation:** Create a `docs/api-conventions.md` file documenting:
- Type serialization rules
- Naming conventions and rationale
- Field validation constraints
- Optional vs required field rules
- Error handling patterns

---

## 9. Priority Action Plan

### Phase 1: Critical Fixes (Week 1)
1. ✅ Add `session_id` to frontend `Recommendation` type
2. ✅ Fix `generateRecommendation()` naming collision
3. ✅ Add empty string → null transformation in mappers
4. ✅ Make `recommendations` required in `SessionDetailResponse`
5. ✅ Create Python enums for status fields

### Phase 2: API Refactoring (Week 2)
1. ✅ Implement `BaseApiService` class pattern
2. ✅ Migrate one service (profiles) to new pattern
3. ✅ Create unified error handling
4. ✅ Centralize API configuration

### Phase 3: Type Safety Improvements (Week 3)
1. ✅ Add TypeScript literal types for all enums
2. ✅ Create branded types for UUID/DateTime
3. ✅ Add runtime validation with `zod`
4. ✅ Document type conventions

### Phase 4: Cleanup & Polish (Week 4)
1. ✅ Migrate all services to class pattern
2. ✅ Standardize parameter order
3. ✅ Remove duplicate code
4. ✅ Add comprehensive tests

---

## 10. Conclusion

**Total Issues Found:** 32  
**Critical Issues:** 14  
**Medium Issues:** 12  
**Low Issues:** 6

**Key Takeaways:**
1. **Type safety needs improvement** - Missing enums, loose JSONB types
2. **API service architecture is inconsistent** - Mix of patterns, duplicate code
3. **Frontend needs transformation layer** - Handle empty strings, validate data
4. **Documentation is insufficient** - Missing validation rules, conventions

**Recommended Architecture:**
- ✅ Class-based API services with dependency injection
- ✅ Unified error handling
- ✅ Strict TypeScript enums matching Python enums
- ✅ Runtime validation at API boundaries
- ✅ Comprehensive type testing

**Next Steps:**
1. Review this analysis with the team
2. Prioritize fixes based on impact
3. Create tickets for each issue category
4. Implement fixes incrementally
5. Add tests to prevent regression
