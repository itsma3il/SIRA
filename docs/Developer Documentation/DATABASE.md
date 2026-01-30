# SIRA Database Schema

## Overview

SIRA uses PostgreSQL with SQLAlchemy ORM for data persistence. The schema supports user profiles with flexible JSONB columns for academic data, preferences, and feedback.

## ER Diagram

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)             │ ◀─────────────┐
│ clerk_user_id       │               │
│ email               │               │
│ created_at          │               │
└─────────────────────┘               │
          │                           │
          │ (1 to many)               │
          ▼                           │
┌─────────────────────────────┐      │
│       profiles              │      │
├─────────────────────────────┤      │
│ id (PK)                     │      │
│ user_id (FK) ────────────────┘      │
│ profile_name                │       │
│ status                      │       │
│ created_at                  │       │
│ updated_at                  │       │
└─────────────────────────────┘       │
          │                           │
          │ (1 to 1)                  │
          ▼                           │
┌──────────────────────────────┐     │
│   academic_records           │     │
├──────────────────────────────┤     │
│ id (PK)                      │     │
│ profile_id (FK)              │     │
│ current_status               │     │
│ current_institution          │     │
│ current_field                │     │
│ gpa                          │     │
│ language_preference          │     │
│ created_at                   │     │
└──────────────────────────────┘     │
                                     │
          ┌─────────────────┐        │
          │ student_pref    │        │
          │ erences         │        │
          ├─────────────────┤        │
          │ id (PK)         │        │
          │ profile_id (FK) │────────┘
          │ favorite_subj...│
          │ disliked_subj...│
          │ soft_skills[]   │
          │ hobbies[]       │
          │ geographic_pref │
          │ budget_range... │
          │ career_goals    │
          └─────────────────┘

┌────────────────────────────┐
│   recommendations          │
├────────────────────────────┤
│ id (PK)                    │
│ profile_id (FK)            │
│ query                      │
│ retrieved_context (JSONB)  │
│ ai_response                │
│ structured_data (JSONB)    │
│ created_at                 │
│ session_id (FK)            │
└────────────────────────────┘
          │
          │ (1 to many)
          ▼
┌────────────────────────────┐
│       feedback             │
├────────────────────────────┤
│ id (PK)                    │
│ recommendation_id (FK)     │
│ rating                     │
│ comment                    │
│ created_at                 │
└────────────────────────────┘

┌────────────────────────────┐
│     conversations          │
├────────────────────────────┤
│ id (PK)                    │
│ user_id (FK)               │
│ title                      │
│ created_at                 │
│ updated_at                 │
└────────────────────────────┘
          │
          │ (1 to many)
          ▼
┌────────────────────────────┐
│   conversation_messages    │
├────────────────────────────┤
│ id (PK)                    │
│ conversation_id (FK)       │
│ role (user/assistant)      │
│ content                    │
│ created_at                 │
└────────────────────────────┘

┌────────────────────────────┐
│      documents             │
├────────────────────────────┤
│ id (PK)                    │
│ source_file                │
│ document_type              │
│ university                 │
│ program_name               │
│ ingestion_date             │
│ status                     │
│ metadata (JSONB)           │
└────────────────────────────┘
```

## Detailed Schema

### users Table

**Purpose:** Core user table (references Clerk external auth)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT email_valid CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
```

**Columns:**
- `id` - UUID primary key
- `clerk_user_id` - Unique identifier from Clerk authentication
- `email` - User email address
- `created_at` - Account creation timestamp

**Constraints:**
- Email format validation
- Unique constraint on clerk_user_id

---

### profiles Table

**Purpose:** Academic profiles (one user can have multiple profiles)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profile_name_length CHECK (LENGTH(profile_name) >= 3)
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Foreign key to users table
- `profile_name` - Name of the academic profile
- `status` - Draft, Active, or Archived
- `created_at`, `updated_at` - Timestamps

**Constraints:**
- Foreign key to users with cascade delete
- Status enum check
- Profile name length (min 3 chars)

---

### academic_records Table

**Purpose:** Academic information for each profile

```sql
CREATE TABLE academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  current_status VARCHAR(100) CHECK (current_status IN ('high_school', 'undergrad', 'career_switcher')),
  current_institution VARCHAR(255),
  current_field VARCHAR(255),
  gpa DECIMAL(4, 2) CHECK (gpa >= 0 AND gpa <= 20),
  transcript_url VARCHAR(500),
  language_preference VARCHAR(50) CHECK (language_preference IN ('French', 'English', 'Arabic')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_academic_records_profile_id ON academic_records(profile_id);
CREATE INDEX idx_academic_records_current_status ON academic_records(current_status);
```

**Columns:**
- `id` - UUID primary key
- `profile_id` - Unique foreign key to profiles (1:1 relationship)
- `current_status` - High school, Undergrad, or Career switcher
- `current_institution` - Current school name
- `current_field` - Field of study
- `gpa` - GPA on 0-20 scale
- `transcript_url` - URL to uploaded transcript
- `language_preference` - Preferred language
- `created_at`, `updated_at` - Timestamps

**Constraints:**
- GPA validation (0-20 range)
- Status enum check
- Language preference enum check
- Unique profile_id for 1:1 relationship

---

### student_preferences Table

**Purpose:** Student preferences and constraints

```sql
CREATE TABLE student_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  favorite_subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
  disliked_subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
  soft_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  hobbies TEXT[] DEFAULT ARRAY[]::TEXT[],
  geographic_preference VARCHAR(255),
  budget_range_min INTEGER CHECK (budget_range_min >= 0),
  budget_range_max INTEGER CHECK (budget_range_max >= budget_range_min),
  career_goals TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_preferences_profile_id ON student_preferences(profile_id);
```

**Columns:**
- `id` - UUID primary key
- `profile_id` - Unique foreign key to profiles (1:1 relationship)
- `favorite_subjects` - Array of favorite subjects
- `disliked_subjects` - Array of disliked subjects
- `soft_skills` - Array of soft skills
- `hobbies` - Array of hobbies
- `geographic_preference` - Preferred location
- `budget_range_min`, `budget_range_max` - Budget constraints
- `career_goals` - Career aspirations
- `created_at`, `updated_at` - Timestamps

**Constraints:**
- Budget range validation (min < max)
- Budget values >= 0

**Notes:**
- Uses PostgreSQL TEXT[] arrays for flexible list storage
- Alternative: Could use JSONB for more complex structures

---

### recommendations Table

**Purpose:** Generated recommendations and metadata

```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES conversation_sessions(id),
  query TEXT NOT NULL,
  retrieved_context JSONB,
  ai_response TEXT,
  structured_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_profile_id ON recommendations(profile_id);
CREATE INDEX idx_recommendations_session_id ON recommendations(session_id);
CREATE INDEX idx_recommendations_created_at ON recommendations(created_at DESC);
CREATE INDEX idx_recommendations_structured_data ON recommendations USING gin(structured_data);
```

**Columns:**
- `id` - UUID primary key
- `profile_id` - Foreign key to profiles
- `session_id` - **Required** reference to conversation session (recommendations chat-integrated)
- `query` - The search query used for RAG (may include chat context)
- `retrieved_context` - JSONB with retrieved documents
- `ai_response` - Full LLM response text
- `structured_data` - JSONB with parsed structured response
  ```json
  {
    "match_score": 0.92,
    "difficulty": "medium",
    "recommendations": [
      {
        "university": "UM6P",
        "program": "Computer Science",
        "match_score": 0.95,
        "reasoning": "..."
      }
    ],
    "chat_context_used": true,
    "conversation_insights": ["user prefers urban campuses", "budget conscious"]
  }
  ```
- `created_at`, `updated_at` - Timestamps

**Important Note:** All new recommendations are generated within chat sessions and MUST have a `session_id`. This enables:
- Context-aware recommendations based on conversation history
- Seamless discussion of results
- Better tracking and analytics
- Improved user experience

**Constraints:**
- Foreign key to profiles with cascade delete
- Foreign key to conversation_sessions (optional)

**Indexes:**
- GIN index on structured_data for JSONB queries

---

### feedback Table

**Purpose:** User feedback on recommendations

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT comment_length CHECK (LENGTH(comment) <= 500)
);

CREATE INDEX idx_feedback_recommendation_id ON feedback(recommendation_id);
CREATE INDEX idx_feedback_rating ON feedback(rating);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
```

**Columns:**
- `id` - UUID primary key
- `recommendation_id` - Foreign key to recommendations
- `rating` - 1-5 star rating
- `comment` - Optional text feedback
- `created_at` - Timestamp

**Constraints:**
- Rating must be 1-5
- Comment max length 500 characters

---

### conversations Table

**Purpose:** Chat conversation sessions

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `session_id` - Session tracking identifier
- `title` - Conversation title
- `created_at`, `updated_at` - Timestamps

---

### conversation_messages Table

**Purpose:** Messages within conversations

```sql
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_created_at ON conversation_messages(created_at DESC);
```

**Columns:**
- `id` - UUID primary key
- `conversation_id` - Foreign key to conversations
- `role` - 'user' or 'assistant'
- `content` - Message content
- `created_at` - Timestamp

---

### documents Table

**Purpose:** Track ingested documents in knowledge base

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file VARCHAR(500) NOT NULL,
  document_type VARCHAR(100),
  university VARCHAR(255) NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  ingestion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'error')),
  metadata JSONB,
  vector_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT unique_document UNIQUE (source_file, university, program_name)
);

CREATE INDEX idx_documents_university ON documents(university);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_ingestion_date ON documents(ingestion_date DESC);
```

**Columns:**
- `id` - UUID primary key
- `source_file` - Original document file path
- `document_type` - Type of document (program_catalog, etc.)
- `university` - University name
- `program_name` - Program name
- `ingestion_date` - When document was ingested
- `status` - Active, archived, or error status
- `metadata` - JSONB with additional info
- `vector_ids` - Array of Pinecone vector IDs

---

## Indexing Strategy

### Primary Indexes (Performance Critical)
```sql
-- User lookups
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);

-- Profile queries
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_status ON profiles(status);

-- Recommendation queries
CREATE INDEX idx_recommendations_profile_id ON recommendations(profile_id);
CREATE INDEX idx_recommendations_created_at ON recommendations(created_at DESC);

-- Feedback analytics
CREATE INDEX idx_feedback_rating ON feedback(rating);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
```

### JSON Indexes
```sql
-- JSONB queries for structured recommendations
CREATE INDEX idx_recommendations_structured_data 
ON recommendations USING gin(structured_data);

-- JSONB queries for document metadata
CREATE INDEX idx_documents_metadata 
ON documents USING gin(metadata);
```

## Data Relationships

### User Cascade Deletion
When a user is deleted:
- All profiles are cascade deleted
- All academic_records are cascade deleted
- All student_preferences are cascade deleted
- All recommendations are cascade deleted
- All feedback is cascade deleted
- All conversations are cascade deleted

### Profile Status Flow
```
draft → active → archived
 ↑________________↓
    (can revert)
```

## Data Size Considerations

### Estimated Growth

| Table | Avg Record Size | Estimated Annual Growth |
|-------|-----------------|------------------------|
| users | 200 bytes | 1,000 users |
| profiles | 300 bytes | 3,000 profiles |
| recommendations | 5 KB | 10,000 recommendations |
| feedback | 300 bytes | 5,000 feedback records |
| conversations | 500 bytes | 2,000 conversations |
| conversation_messages | 1 KB | 10,000 messages |

**Projected 1-year storage:** ~150 GB (with vector embeddings in Pinecone)

## Migration Management

Migrations use Alembic:

```bash
# Create migration
alembic revision --autogenerate -m "Add new column"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

Current migrations:
- `001_documents.py` - Initial schema
- `002_recommendations.py` - Recommendations table
- `003_conversation_system.py` - Chat system
- `004_add_session_id_to_recommendations.py` - Session tracking

---

**Schema Version:** 1.0.0  
**Last Updated:** January 30, 2026  
**Database:** PostgreSQL 15+
