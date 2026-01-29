# SIRA API Reference

**Version**: 1.0.0  
**Base URL**: `http://localhost:8000` (development) / `https://api.sira-academic.com` (production)  
**Last Updated**: January 29, 2026

---

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Health](#health-endpoints)
  - [Users](#user-endpoints)
  - [Profiles](#profile-endpoints)
  - [Upload](#upload-endpoints)
  - [Recommendations](#recommendation-endpoints)
  - [Conversations](#conversation-endpoints)
  - [Admin](#admin-endpoints)

---

## Authentication

SIRA uses **Clerk JWT tokens** for authentication. All protected endpoints require a valid JWT token in the `Authorization` header.

### Request Headers

```http
Authorization: Bearer <clerk_jwt_token>
Content-Type: application/json
```

### Getting a Token

Tokens are obtained through the Clerk authentication flow on the frontend. The frontend automatically includes the token in API requests.

### Token Validation

- Tokens are validated using Clerk's JWKS endpoint
- Expired tokens return `401 Unauthorized`
- Invalid tokens return `401 Unauthorized`
- Missing tokens return `401 Unauthorized`

---

## Rate Limiting

Rate limits are enforced per IP address:

- **120 requests per minute**
- **2000 requests per hour**

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit-Minute: 120
X-RateLimit-Remaining-Minute: 95
X-RateLimit-Limit-Hour: 2000
X-RateLimit-Remaining-Hour: 1847
```

### Rate Limit Exceeded (HTTP 429)

```json
{
  "detail": "Rate limit exceeded: 120 requests per minute"
}
```

**Response Headers:**
```http
Retry-After: 60
```

### Excluded Paths

The following paths are not rate limited:
- `/health`
- `/`
- `/docs`
- `/openapi.json`
- `/redoc`

---

## Error Handling

SIRA returns structured error responses in JSON format.

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {} // Optional, includes field-level errors
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Successful deletion |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Validation Error Example (422)

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "body -> gpa",
      "message": "GPA must be between 0.0 and 20.0",
      "type": "value_error"
    },
    {
      "field": "body -> profile_name",
      "message": "Profile name cannot be empty",
      "type": "value_error"
    }
  ]
}
```

---

## Endpoints

### Health Endpoints

#### GET `/health`

Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T10:30:00Z"
}
```

#### GET `/`

Root endpoint returning API information.

**Response:**
```json
{
  "service": "SIRA API",
  "status": "ok",
  "version": "1.0.0"
}
```

---

### User Endpoints

#### POST `/api/users/sync`

Synchronize user data from Clerk.

**Authentication:** Required

**Request Body:**
```json
{
  "clerk_user_id": "user_2abc123xyz",
  "email": "student@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clerk_user_id": "user_2abc123xyz",
  "email": "student@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2026-01-29T10:00:00Z"
}
```

---

### Profile Endpoints

#### POST `/api/profiles`

Create a new academic profile.

**Authentication:** Required

**Request Body:**
```json
{
  "profile_name": "Computer Science Track",
  "status": "draft",
  "academic_record": {
    "current_status": "High School",
    "current_institution": "Lincoln High School",
    "current_field": "Science and Technology",
    "gpa": 15.5,
    "language_preference": "English",
    "transcript_url": "https://example.com/transcript.pdf",
    "subject_grades": [
      {
        "subject_name": "Mathematics",
        "grade": 18.5,
        "weight": 4.0
      },
      {
        "subject_name": "Physics",
        "grade": 17.0,
        "weight": 3.0
      }
    ]
  },
  "preferences": {
    "favorite_subjects": ["Mathematics", "Computer Science", "Physics"],
    "disliked_subjects": ["History"],
    "soft_skills": ["Problem Solving", "Teamwork", "Leadership"],
    "hobbies": ["Coding", "Robotics"],
    "geographic_preference": "Europe",
    "budget_range_min": 5000,
    "budget_range_max": 15000,
    "career_goals": "Software Engineer at a leading tech company"
  }
}
```

**Validation Rules:**
- `profile_name`: Required, 1-255 characters, sanitized
- `status`: Must be one of: "draft", "active", "archived"
- `gpa`: 0.0-20.0 scale
- `grade`: 0.0-100.0 scale
- `budget_range_min` ≤ `budget_range_max`
- `transcript_url`: Must be HTTP/HTTPS only
- All text fields are sanitized (HTML/XSS prevention)

**Response (201 Created):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "profile_name": "Computer Science Track",
  "status": "draft",
  "draft_payload": null,
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:00:00Z",
  "academic_record": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "profile_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "current_status": "High School",
    "current_institution": "Lincoln High School",
    "current_field": "Science and Technology",
    "gpa": 15.5,
    "transcript_url": "https://example.com/transcript.pdf",
    "language_preference": "English",
    "created_at": "2026-01-29T10:00:00Z",
    "subject_grades": [...]
  },
  "preferences": {...}
}
```

#### GET `/api/profiles`

List all profiles for the authenticated user.

**Authentication:** Required

**Response (200 OK):**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "profile_name": "Computer Science Track",
    "status": "active",
    "created_at": "2026-01-29T10:00:00Z",
    "updated_at": "2026-01-29T10:00:00Z"
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "profile_name": "Engineering Track",
    "status": "draft",
    "created_at": "2026-01-28T09:00:00Z",
    "updated_at": "2026-01-28T09:00:00Z"
  }
]
```

#### GET `/api/profiles/{profile_id}`

Retrieve a specific profile by ID.

**Authentication:** Required

**Path Parameters:**
- `profile_id` (UUID): Profile identifier

**Response (200 OK):** Full profile object with nested academic record and preferences

#### PATCH `/api/profiles/{profile_id}`

Update an existing profile (partial update).

**Authentication:** Required

**Request Body:** Same as POST but all fields optional

#### PATCH `/api/profiles/{profile_id}/status`

Update only the profile status.

**Authentication:** Required

**Request Body:**
```json
{
  "status": "active"
}
```

#### DELETE `/api/profiles/{profile_id}`

Delete a profile (soft delete - status set to archived).

**Authentication:** Required

**Response (204 No Content)**

---

### Upload Endpoints

#### POST `/api/upload/transcript`

Upload a transcript file (PDF, JPG, PNG).

**Authentication:** Required

**Request:**
- **Content-Type**: `multipart/form-data`
- **Field name**: `file`
- **Max size**: 5MB
- **Allowed types**: PDF, JPG, JPEG, PNG

**Example (cURL):**
```bash
curl -X POST "http://localhost:8000/api/upload/transcript" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@transcript.pdf"
```

**Response (201 Created):**
```json
{
  "filename": "a1b2c3d4e5f67890.pdf",
  "url": "/api/upload/files/a1b2c3d4e5f67890.pdf",
  "original_filename": "transcript.pdf",
  "content_type": "application/pdf"
}
```

#### GET `/api/upload/files/{filename}`

Retrieve an uploaded file.

**Authentication:** Required

**Response:** File content with appropriate Content-Type header

#### DELETE `/api/upload/files/{filename}`

Delete an uploaded file.

**Authentication:** Required

**Response (204 No Content)**

---

### Recommendation Endpoints

#### POST `/api/recommendations`

Generate AI-powered recommendations for a profile.

**Authentication:** Required

**Request Body:**
```json
{
  "profile_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "query": "Find universities in Europe for Computer Science",
  "top_k": 5
}
```

**Response (200 OK):**
```json
{
  "recommendation_id": "rec_abc123",
  "profile_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "recommendations": [
    {
      "university": "ETH Zurich",
      "program": "Computer Science BSc",
      "match_score": 0.95,
      "difficulty": "high",
      "reasoning": "Strong match based on academic performance...",
      "admission_requirements": {...},
      "tuition_fees": {...}
    }
  ],
  "metadata": {
    "query_time_ms": 1250,
    "total_documents_searched": 1500
  }
}
```

#### GET `/api/recommendations`

List all recommendations for the authenticated user.

**Authentication:** Required

**Query Parameters:**
- `profile_id` (optional): Filter by profile
- `limit` (optional, default: 20): Number of results

#### GET `/api/recommendations/{recommendation_id}`

Retrieve a specific recommendation.

**Authentication:** Required

---

### Conversation Endpoints

#### POST `/api/conversations`

Start a new conversation session.

**Authentication:** Required

**Request Body:**
```json
{
  "profile_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Computer Science Programs in Europe"
}
```

**Response (201 Created):**
```json
{
  "session_id": "sess_abc123xyz",
  "profile_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Computer Science Programs in Europe",
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:00:00Z"
}
```

#### GET `/api/conversations/stream`

**Server-Sent Events (SSE) endpoint for streaming AI responses**

**Authentication:** Required (via query parameter for EventSource compatibility)

**Query Parameters:**
- `token`: JWT token (required for SSE compatibility)
- `session_id`: Conversation session ID
- `message`: User message

**Example (JavaScript):**
```javascript
const token = await getToken();
const eventSource = new EventSource(
  `/api/conversations/stream?token=${token}&session_id=sess_123&message=${encodeURIComponent("Tell me about ETH Zurich")}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.content); // AI response chunk
};
```

**Event Format:**
```json
{
  "type": "content",
  "content": "ETH Zurich is a leading...",
  "metadata": {}
}
```

---

### Admin Endpoints

#### GET `/api/admin/stats`

Get system statistics and analytics.

**Authentication:** Required (Admin only)

**Response (200 OK):**
```json
{
  "total_users": 1250,
  "total_profiles": 3420,
  "total_recommendations": 8750,
  "total_conversations": 5600,
  "active_sessions": 42,
  "avg_response_time_ms": 245,
  "system_health": "healthy"
}
```

---

## API Client Examples

### Python

```python
import httpx

BASE_URL = "http://localhost:8000"
TOKEN = "your_clerk_jwt_token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Create a profile
async with httpx.AsyncClient() as client:
    response = await client.post(
        f"{BASE_URL}/api/profiles",
        json={
            "profile_name": "My CS Track",
            "status": "draft"
        },
        headers=headers
    )
    profile = response.json()
    print(profile)
```

### JavaScript/TypeScript

```typescript
const BASE_URL = "http://localhost:8000";

async function createProfile(token: string) {
  const response = await fetch(`${BASE_URL}/api/profiles`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      profile_name: "My CS Track",
      status: "draft",
    }),
  });
  
  return await response.json();
}
```

### cURL

```bash
# Create a profile
curl -X POST "http://localhost:8000/api/profiles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_name": "My CS Track",
    "status": "draft"
  }'
```

---

## Interactive Documentation

SIRA provides interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

The Swagger UI allows you to:
- View all endpoints and their parameters
- Test endpoints directly in the browser
- Authenticate with your Clerk token
- View request/response schemas

---

## Versioning

API version is included in all responses and documentation. Breaking changes will result in a new major version (e.g., v2.0.0).

Current version: **1.0.0**

---

## Support

For API support:
- **Email**: dev@sira-academic.com
- **Documentation**: https://docs.sira-academic.com
- **GitHub Issues**: https://github.com/itsma3il/sira/issues
