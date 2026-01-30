# SIRA API Reference

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.sira.app/api
```

## Authentication

All API endpoints (except auth endpoints) require a valid JWT token in the Authorization header:

```bash
Authorization: Bearer <JWT_TOKEN>
```

The JWT token is obtained from Clerk authentication. The backend verifies the token signature and expiration before processing the request.

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Profile Endpoints](#profile-endpoints)
3. [Recommendation Endpoints](#recommendation-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Health Endpoints](#health-endpoints)
6. [File Upload Endpoints](#file-upload-endpoints)
7. [Error Handling](#error-handling)

---

## Authentication Endpoints

### Sync User to Database

**Endpoint:** `POST /auth/sync`

**Description:** Syncs authenticated user from Clerk to PostgreSQL database. Called automatically on first login.

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "clerk_user_id": "user_123abc",
  "email": "student@example.com"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clerk_user_id": "user_123abc",
  "email": "student@example.com",
  "created_at": "2026-01-30T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid JWT token
- `409 Conflict` - User already exists

---

### Get Current User

**Endpoint:** `GET /auth/me`

**Description:** Returns the authenticated user's information.

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clerk_user_id": "user_123abc",
  "email": "student@example.com",
  "created_at": "2026-01-30T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - User not found in database

---

## Profile Endpoints

### Create Profile

**Endpoint:** `POST /profiles`

**Description:** Creates a new academic profile for the authenticated user.

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "profile_name": "Science Stream",
  "current_status": "high_school",
  "current_institution": "Lycée Moulay Ismail",
  "current_field": "Sciences",
  "gpa": 15.5,
  "language_preference": "French",
  "favorite_subjects": ["Math", "Physics", "Chemistry"],
  "disliked_subjects": ["History"],
  "soft_skills": ["Leadership", "Communication"],
  "hobbies": ["Coding", "Reading"],
  "geographic_preference": "Morocco",
  "budget_range_min": 50000,
  "budget_range_max": 150000,
  "career_goals": "Software Engineer"
}
```

**Response (201 Created):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "profile_name": "Science Stream",
  "status": "draft",
  "created_at": "2026-01-30T11:00:00Z",
  "updated_at": "2026-01-30T11:00:00Z"
}
```

**Validation Rules:**
- `profile_name`: Required, 3-255 characters
- `gpa`: 0-20 scale
- `budget_range_min` < `budget_range_max`
- All string fields sanitized against XSS attacks

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid JWT token
- `422 Unprocessable Entity` - Invalid data format

---

### Get All User Profiles

**Endpoint:** `GET /profiles`

**Description:** Returns all profiles for the authenticated user.

**Query Parameters:**
```
?status=draft|active|archived  (optional)
?limit=10 (default: 50, max: 100)
?offset=0 (default: 0)
```

**Response (200 OK):**
```json
{
  "total": 3,
  "limit": 10,
  "offset": 0,
  "items": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "profile_name": "Science Stream",
      "status": "draft",
      "created_at": "2026-01-30T11:00:00Z",
      "updated_at": "2026-01-30T11:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing/invalid JWT token

---

### Get Profile Details

**Endpoint:** `GET /profiles/{profile_id}`

**Description:** Returns detailed information for a specific profile including academic data and preferences.

**Path Parameters:**
- `profile_id` (UUID): The profile ID

**Response (200 OK):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "profile_name": "Science Stream",
  "status": "draft",
  "academic_record": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "current_status": "high_school",
    "current_institution": "Lycée Moulay Ismail",
    "current_field": "Sciences",
    "gpa": 15.5,
    "language_preference": "French"
  },
  "preferences": {
    "favorite_subjects": ["Math", "Physics", "Chemistry"],
    "disliked_subjects": ["History"],
    "soft_skills": ["Leadership", "Communication"],
    "geographic_preference": "Morocco",
    "budget_range_min": 50000,
    "budget_range_max": 150000,
    "career_goals": "Software Engineer"
  },
  "created_at": "2026-01-30T11:00:00Z",
  "updated_at": "2026-01-30T11:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - User doesn't own this profile
- `404 Not Found` - Profile doesn't exist

---

### Update Profile

**Endpoint:** `PUT /profiles/{profile_id}`

**Description:** Updates an existing profile (partial updates supported).

**Request Body:** (same as Create Profile, all fields optional)

**Response (200 OK):** Updated profile object

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - User doesn't own this profile
- `404 Not Found` - Profile doesn't exist
- `422 Unprocessable Entity` - Invalid data format

---

### Delete Profile

**Endpoint:** `DELETE /profiles/{profile_id}`

**Description:** Permanently deletes a profile and associated data.

**Response (204 No Content)**

**Error Responses:**
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - User doesn't own this profile
- `404 Not Found` - Profile doesn't exist

---

### Change Profile Status

**Endpoint:** `PATCH /profiles/{profile_id}/status`

**Description:** Changes profile status (draft → active → archived).

**Request Body:**
```json
{
  "status": "active"
}
```

**Valid Status Values:** `draft`, `active`, `archived`

**Response (200 OK):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "active",
  "updated_at": "2026-01-30T12:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid status value
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - User doesn't own this profile
- `404 Not Found` - Profile doesn't exist

---

## Recommendation Endpoints

**Note:** Recommendations are now generated within chat sessions for better context and user experience. The standalone recommendation endpoint is deprecated in favor of the chat-integrated approach.

### Generate Recommendation in Chat Session (Streaming)

**Endpoint:** `POST /api/chat/{session_id}/generate-recommendations`

**Description:** Generates AI-powered academic program recommendations within an active chat session. Analyzes the user's profile AND chat history for context-aware suggestions.

**Authentication:** Required (Clerk JWT)

**Parameters:**
- `session_id` (UUID, path parameter): The chat session ID

**Response Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Response Stream (Server-Sent Events):**
```
data: {"type": "started", "session_id": "660e8400-e29b-41d4-a716-446655440001", "profile_id": "770e8400-e29b-41d4-a716-446655440002"}

data: {"type": "analyzing", "message": "Analyzing your academic profile and chat history..."}

data: {"type": "searching", "message": "Searching relevant programs based on your conversation..."}

data: {"type": "generating", "message": "Generating personalized recommendations..."}

data: {"type": "content", "content": "Based on your profile and our discussion, here are the best matches:"}

data: {"type": "recommendation", "data": {"university": "UM6P", "program": "Computer Science", "match_score": 0.92}}

data: {"type": "completed", "recommendation_id": "880e8400-e29b-41d4-a716-446655440003", "session_id": "660e8400-e29b-41d4-a716-446655440001"}
```

**Business Logic:**
1. Validates session belongs to authenticated user
2. Retrieves profile attached to session
3. Loads chat history for context
4. Extracts user preferences from conversation
5. Queries RAG system with semantic search
6. Generates personalized recommendations
7. Streams response chunks to chat interface
8. Saves recommendation linked to session

**Error Responses:**
- `400 Bad Request` - Missing profile_id
- `401 Unauthorized` - Missing/invalid JWT token
- `404 Not Found` - Profile not found
- `500 Internal Server Error` - LLM service error

---

### Get All Recommendations

**Endpoint:** `GET /recommendations?profile_id={profile_id}`

**Description:** Returns all recommendations for a specific profile.

**Query Parameters:**
- `profile_id` (UUID, required): Filter by profile
- `limit` (default: 20, max: 100)
- `offset` (default: 0)

**Response (200 OK):**
```json
{
  "total": 2,
  "limit": 20,
  "offset": 0,
  "items": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "profile_id": "660e8400-e29b-41d4-a716-446655440001",
      "query": "Computer Science programs in Morocco with GPA 15+",
      "ai_response": "Based on your profile...",
      "structured_data": {
        "match_score": 0.92,
        "difficulty": "medium",
        "recommendations": [...]
      },
      "feedback_rating": null,
      "created_at": "2026-01-30T12:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid profile_id
- `401 Unauthorized` - Missing/invalid JWT token

---

### Get Single Recommendation

**Endpoint:** `GET /recommendations/{recommendation_id}`

**Description:** Returns detailed information about a specific recommendation.

**Response (200 OK):** Single recommendation object

**Error Responses:**
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - User doesn't own this recommendation
- `404 Not Found` - Recommendation not found

---

### Submit Feedback

**Endpoint:** `POST /recommendations/{recommendation_id}/feedback`

**Description:** Submits user feedback on a recommendation.

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great recommendations, very helpful!"
}
```

**Validation:**
- `rating`: 1-5 (integer)
- `comment`: Optional, max 500 characters

**Response (201 Created):**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "recommendation_id": "880e8400-e29b-41d4-a716-446655440003",
  "rating": 5,
  "comment": "Great recommendations, very helpful!",
  "created_at": "2026-01-30T13:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - User doesn't own this recommendation
- `404 Not Found` - Recommendation not found
- `409 Conflict` - Feedback already submitted

---

## Admin Endpoints

All admin endpoints require admin role in Clerk metadata.

### Get Feedback Trends

**Endpoint:** `GET /admin/feedback/trends`

**Description:** Returns feedback analytics and trends.

**Query Parameters:**
- `days` (default: 30, options: 7, 30, 90)

**Response (200 OK):**
```json
{
  "period_days": 30,
  "total_feedback": 150,
  "average_rating": 4.3,
  "rating_distribution": {
    "1": 5,
    "2": 10,
    "3": 25,
    "4": 50,
    "5": 60
  },
  "trend_over_time": [
    { "date": "2026-01-01", "avg_rating": 4.1, "count": 5 },
    { "date": "2026-01-02", "avg_rating": 4.4, "count": 8 }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - User is not admin

---

### Get Low-Rated Recommendations

**Endpoint:** `GET /admin/feedback/low-rated`

**Description:** Returns recommendations with ratings below threshold.

**Query Parameters:**
- `threshold` (default: 3, range: 1-5)
- `limit` (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "threshold": 3,
  "count": 8,
  "items": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "average_rating": 2.5,
      "feedback_count": 4,
      "query": "...",
      "comments": ["Not relevant", "Missing options"]
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - User is not admin

---

### Get System Health

**Endpoint:** `GET /health/system`

**Description:** Returns system resource metrics (CPU, memory, disk).

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-30T13:30:00Z",
  "cpu_percent": 45.2,
  "memory_percent": 62.5,
  "disk_percent": 55.3,
  "database_connection": "ok",
  "pinecone_connection": "ok"
}
```

---

## File Upload Endpoints

### Upload Transcript

**Endpoint:** `POST /upload/transcript`

**Description:** Uploads a student transcript file (PDF/JPG/PNG).

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <binary file data>
profile_id: 660e8400-e29b-41d4-a716-446655440001 (optional)
```

**Validation:**
- File size: max 5MB
- File types: PDF, JPG, PNG
- Required: `file`

**Response (201 Created):**
```json
{
  "file_id": "aa0e8400-e29b-41d4-a716-446655440005",
  "filename": "transcript.pdf",
  "file_url": "/uploads/transcripts/aa0e8400-e29b-41d4-a716-446655440005.pdf",
  "file_size": 256000,
  "created_at": "2026-01-30T13:45:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing file or invalid format
- `401 Unauthorized` - Missing/invalid JWT token
- `413 Payload Too Large` - File exceeds 5MB limit
- `415 Unsupported Media Type` - Invalid file type

---

## Health Endpoints

### System Health

**Endpoint:** `GET /health`

**Description:** Basic health check endpoint (no authentication required).

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T14:00:00Z",
  "version": "1.0.0"
}
```

---

## Error Handling

### Standard Error Response Format

All errors follow this format:

```json
{
  "detail": {
    "error": "ErrorType",
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "timestamp": "2026-01-30T14:05:00Z"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Typical Causes |
|------|---------|---|
| 200 | OK | Successful GET/PUT/PATCH request |
| 201 | Created | Successful POST request |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | User lacks required permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 413 | Payload Too Large | File exceeds size limit |
| 415 | Unsupported Media Type | Invalid file type |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | External API unavailable |

### Rate Limiting

Endpoints are rate-limited to prevent abuse:

```
10 requests per minute per IP address
100 requests per hour per authenticated user
```

When limit is exceeded, response includes:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704024360
```

---

**API Version:** 1.0.0  
**Last Updated:** January 30, 2026  
**Status:** Production Ready
