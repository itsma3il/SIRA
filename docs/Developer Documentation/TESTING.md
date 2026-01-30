# SIRA Testing Documentation

**Comprehensive Testing Strategy and Documentation**

This document covers all aspects of testing for the SIRA platform, including unit tests, integration tests, end-to-end tests, test infrastructure, coverage goals, and best practices.

---

## Table of Contents

- [Testing Overview](#testing-overview)
- [Test Infrastructure](#test-infrastructure)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [End-to-End Tests](#end-to-end-tests)
- [Test Coverage](#test-coverage)
- [Running Tests](#running-tests)
- [Writing New Tests](#writing-new-tests)
- [Continuous Integration](#continuous-integration)
- [Performance Testing](#performance-testing)

---

## Testing Overview

### Testing Philosophy

**Pyramid Model:**
```
        /\
       /E2E\       Few, critical paths (10%)
      /------\
     /  INT   \    Key workflows (30%)
    /----------\
   /    UNIT    \  Core logic (60%)
  /--------------\
```

**Principles:**
1. **Fast Feedback**: Unit tests run in < 5 seconds
2. **Reliability**: Flaky tests are fixed immediately
3. **Maintainability**: Tests are simple and readable
4. **Coverage**: Aim for 80%+ code coverage
5. **Realistic**: Tests use realistic data and scenarios

### Current Status

**Test Suite Metrics (as of v1.0.0):**
- **Total Tests**: 110
- **Passing**: 100
- **Skipped**: 10 (pending features)
- **Coverage**: 52% (target: 80%)
- **Execution Time**: ~45 seconds
- **Last Run**: January 30, 2026

**Coverage by Component:**
| Component | Coverage | Target | Status |
|-----------|----------|--------|--------|
| Profile Service | 75% | 80% | Near target |
| Recommendation Engine | 45% | 80% | Needs work |
| Conversation System | 60% | 70% | Acceptable |
| Auth & Security | 85% | 90% | Good |
| Database Models | 90% | 90% | Excellent |
| API Endpoints | 55% | 75% | Improving |

---

## Test Infrastructure

### Backend Testing Stack

**Framework:**
- **pytest**: Main testing framework (v8.x)
- **pytest-asyncio**: Async test support
- **pytest-cov**: Coverage reporting
- **faker**: Realistic test data generation

**Database:**
- **SQLite**: In-memory test database (fast, isolated)
- **Fixtures**: Reusable test data and mocks

**Mocking:**
- **unittest.mock**: Python standard mocking
- **pytest-mock**: Pytest integration for mocks

### Test Database Setup

```python
# backend/tests/conftest.py
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.db import Base, get_session

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture
async def test_db():
    """Create test database with schema"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session
    
    await engine.dispose()

@pytest.fixture
def override_get_session(test_db):
    """Override database dependency"""
    async def _override():
        yield test_db
    return _override
```

### Test Fixtures

**User Fixtures:**
```python
@pytest.fixture
def test_user_id():
    """Valid test user ID"""
    return "user_test_123456"

@pytest.fixture
def test_profile_data():
    """Complete profile data for testing"""
    return {
        "name": "Engineering Track 2026",
        "status": "active",
        "current_status": "high_school_student",
        "institution_name": "Test High School",
        "field_of_study": "Science",
        "language_preference": "en",
        "gpa": 16.5,
        "favorite_subjects": "Math, Physics, Computer Science",
        "avoided_subjects": "History, Literature",
        "soft_skills": "Problem solving, Leadership",
        "hobbies": "Coding, Reading",
        "location": "Casablanca",
        "budget_min": 50000,
        "budget_max": 150000,
        "career_goals": "Become a software engineer specializing in AI"
    }

@pytest.fixture
def test_academic_records():
    """Academic records for testing"""
    return [
        {"subject": "Mathematics", "grade": 18.5, "coefficient": 4.0},
        {"subject": "Physics", "grade": 17.0, "coefficient": 3.0},
        {"subject": "Computer Science", "grade": 19.0, "coefficient": 2.0}
    ]
```

---

## Unit Tests

### Profile Service Tests

**File:** `backend/tests/test_profile_services.py`

**Coverage:**
- Profile creation (CRUD)
- Validation logic
- Data transformation
- Error handling

**Examples:**
```python
@pytest.mark.asyncio
async def test_create_profile(test_db, test_user_id, test_profile_data):
    """Test profile creation with valid data"""
    from app.services.profile_service import ProfileService
    
    service = ProfileService(test_db)
    profile = await service.create_profile(test_user_id, test_profile_data)
    
    assert profile.id is not None
    assert profile.user_id == test_user_id
    assert profile.name == test_profile_data["name"]
    assert profile.gpa == test_profile_data["gpa"]

@pytest.mark.asyncio
async def test_create_profile_invalid_gpa(test_db, test_user_id):
    """Test profile creation fails with invalid GPA"""
    from app.services.profile_service import ProfileService
    
    service = ProfileService(test_db)
    
    with pytest.raises(ValueError, match="GPA must be between 0 and 20"):
        await service.create_profile(test_user_id, {"gpa": 25.0, ...})

@pytest.mark.asyncio
async def test_get_user_profiles(test_db, test_user_id):
    """Test fetching all user profiles"""
    from app.services.profile_service import ProfileService
    
    service = ProfileService(test_db)
    
    # Create multiple profiles
    await service.create_profile(test_user_id, {"name": "Profile 1", ...})
    await service.create_profile(test_user_id, {"name": "Profile 2", ...})
    
    profiles = await service.get_user_profiles(test_user_id)
    
    assert len(profiles) == 2
    assert profiles[0].name == "Profile 1"
    assert profiles[1].name == "Profile 2"
```

### Recommendation Engine Tests

**File:** `backend/tests/test_recommendation_pipeline.py`

**Coverage:**
- Query generation
- Semantic search
- Match scoring
- Result formatting

**Examples:**
```python
@pytest.mark.asyncio
async def test_generate_recommendations(mock_pinecone, mock_mistral, test_profile):
    """Test full recommendation pipeline"""
    from app.services.recommendation_service import RecommendationService
    
    service = RecommendationService()
    
    # Mock Pinecone response
    mock_pinecone.query.return_value = {
        "matches": [
            {"id": "prog_1", "score": 0.95, "metadata": {"name": "CS Program"}},
            {"id": "prog_2", "score": 0.89, "metadata": {"name": "SE Program"}}
        ]
    }
    
    # Mock Mistral response
    mock_mistral.generate.return_value = {
        "recommendations": [
            {
                "program_id": "prog_1",
                "match_score": 95,
                "reasoning": "Perfect fit based on grades and interests"
            }
        ]
    }
    
    results = await service.generate_recommendations(test_profile)
    
    assert len(results) >= 1
    assert results[0]["match_score"] >= 80
    assert "reasoning" in results[0]
```

### Conversation System Tests

**File:** `backend/tests/test_conversation_api.py`

**Coverage:**
- Message creation
- Context management
- SSE streaming
- Conversation history

**Examples:**
```python
@pytest.mark.asyncio
async def test_send_message(test_client, test_user_id, test_conversation_id):
    """Test sending a message"""
    response = await test_client.post(
        f"/conversations/{test_conversation_id}/messages",
        json={"content": "What programs do you recommend?"},
        headers={"Authorization": f"Bearer {mock_jwt_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "user"
    assert data["content"] == "What programs do you recommend?"

@pytest.mark.asyncio
async def test_stream_response(test_client, test_conversation_id):
    """Test SSE streaming response"""
    response = await test_client.get(
        f"/conversations/{test_conversation_id}/stream",
        headers={"Authorization": f"Bearer {mock_jwt_token}"}
    )
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream"
    
    # Collect streamed chunks
    chunks = []
    async for line in response.iter_lines():
        if line.startswith("data: "):
            chunks.append(line[6:])  # Remove "data: " prefix
    
    assert len(chunks) > 0
    assert chunks[-1] == "[DONE]"
```

---

## Integration Tests

### API Integration Tests

**File:** `backend/tests/test_complete_models.py`

**Coverage:**
- Full API workflows
- Database interactions
- Authentication flow
- Error scenarios

**Examples:**
```python
@pytest.mark.asyncio
async def test_profile_workflow(test_client, test_user_id):
    """Test complete profile creation workflow"""
    
    # 1. Create profile
    create_response = await test_client.post(
        "/profiles",
        json={
            "name": "Test Profile",
            "gpa": 16.5,
            "budget_min": 50000,
            "budget_max": 150000
        },
        headers={"Authorization": f"Bearer {mock_jwt_token}"}
    )
    assert create_response.status_code == 201
    profile_id = create_response.json()["id"]
    
    # 2. Fetch profile
    get_response = await test_client.get(
        f"/profiles/{profile_id}",
        headers={"Authorization": f"Bearer {mock_jwt_token}"}
    )
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Test Profile"
    
    # 3. Update profile
    update_response = await test_client.put(
        f"/profiles/{profile_id}",
        json={"name": "Updated Profile"},
        headers={"Authorization": f"Bearer {mock_jwt_token}"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Updated Profile"
    
    # 4. Delete profile
    delete_response = await test_client.delete(
        f"/profiles/{profile_id}",
        headers={"Authorization": f"Bearer {mock_jwt_token}"}
    )
    assert delete_response.status_code == 204
```

### Database Integration Tests

**File:** `backend/tests/test_db.py`

**Coverage:**
- Database connection
- Model relationships
- Transactions
- Cascading deletes

**Examples:**
```python
@pytest.mark.asyncio
async def test_profile_academic_records_relationship(test_db, test_user_id):
    """Test one-to-many relationship"""
    from app.models import Profile, AcademicRecord
    
    # Create profile
    profile = Profile(user_id=test_user_id, name="Test", gpa=16.0)
    test_db.add(profile)
    await test_db.commit()
    
    # Create academic records
    record1 = AcademicRecord(profile_id=profile.id, subject="Math", grade=18.0)
    record2 = AcademicRecord(profile_id=profile.id, subject="Physics", grade=17.0)
    test_db.add_all([record1, record2])
    await test_db.commit()
    
    # Verify relationship
    await test_db.refresh(profile, ["academic_records"])
    assert len(profile.academic_records) == 2
    assert profile.academic_records[0].subject == "Math"

@pytest.mark.asyncio
async def test_cascade_delete(test_db, test_user_id):
    """Test cascading delete removes related records"""
    from app.models import Profile, AcademicRecord
    
    # Create profile with records
    profile = Profile(user_id=test_user_id, name="Test", gpa=16.0)
    test_db.add(profile)
    await test_db.commit()
    
    record = AcademicRecord(profile_id=profile.id, subject="Math", grade=18.0)
    test_db.add(record)
    await test_db.commit()
    
    # Delete profile
    await test_db.delete(profile)
    await test_db.commit()
    
    # Verify records also deleted
    result = await test_db.execute(
        select(AcademicRecord).where(AcademicRecord.profile_id == profile.id)
    )
    assert result.scalar_one_or_none() is None
```

---

## End-to-End Tests

### User Journey Tests

**Tools:** Playwright (browser automation)

**Coverage:**
- Complete user flows
- UI interactions
- Real backend integration

**Example Flows:**

**1. Sign Up & Profile Creation:**
```python
# tests/e2e/test_user_journey.py
@pytest.mark.e2e
async def test_signup_and_create_profile(page):
    """Test complete signup and profile creation flow"""
    
    # 1. Navigate to homepage
    await page.goto("https://sira.itsma3il.com")
    
    # 2. Click sign up
    await page.click("text=Sign Up")
    
    # 3. Fill Clerk signup form
    await page.fill('input[name="emailAddress"]', "test@example.com")
    await page.fill('input[name="password"]', "SecurePassword123!")
    await page.click("button:has-text('Continue')")
    
    # 4. Verify redirect to dashboard
    await page.wait_for_url("**/dashboard")
    await expect(page.locator("h1")).to_have_text("Dashboard")
    
    # 5. Create profile
    await page.click("text=Create New Profile")
    await page.fill('input[name="name"]', "Engineering Track")
    await page.fill('input[name="gpa"]', "16.5")
    await page.click("button:has-text('Save')")
    
    # 6. Verify profile created
    await expect(page.locator(".profile-card")).to_contain_text("Engineering Track")
```

**2. Generate Recommendations in Chat:**
```python
@pytest.mark.e2e
async def test_generate_recommendations_in_chat(page, authenticated_user):
    """Test chat-integrated recommendation generation flow"""
    
    # 1. Navigate to chat
    await page.goto("https://sira.itsma3il.com/dashboard/chat")
    
    # 2. Verify profile is attached to session
    await expect(page.locator(".profile-indicator")).to_be_visible()
    
    # 3. Click generate recommendations button in chat
    await page.click("button:has-text('Generate Recommendations')")
    
    # 4. Wait for streaming to complete in chat interface
    await page.wait_for_selector(".chat-message.recommendation", timeout=30000)
    
    # 5. Verify recommendations displayed in chat
    recommendation_message = await page.query_selector(".chat-message.recommendation")
    assert recommendation_message is not None
    
    # 6. Verify match scores in chat response
    await expect(recommendation_message).to_contain_text("Match:")
    await expect(recommendation_message).to_contain_text("%")
    
    # 7. Test follow-up discussion
    await page.fill('textarea[placeholder="Ask a question..."]', "Tell me more about the first program")
    await page.click("button[type='submit']")
    
    # 8. Verify AI responds with context
    await page.wait_for_selector(".chat-message:last-child")
    last_message = await page.query_selector(".chat-message:last-child")
    await expect(last_message).to_be_visible()
```

---

## Test Coverage

### Current Coverage Report

```bash
$ pytest --cov=app --cov-report=term-missing

Name                                    Stmts   Miss  Cover   Missing
---------------------------------------------------------------------
app/__init__.py                             2      0   100%
app/main.py                                45      8    82%   12-15, 45-48
app/db.py                                  25      2    92%   34-35
app/models/__init__.py                      8      0   100%
app/models/profile.py                      45      3    93%   78-80
app/models/recommendation.py               38      2    95%   65-66
app/models/conversation.py                 32      5    84%   45-49
app/services/profile_service.py            95     24    75%   45-52, 89-95, 112-118
app/services/recommendation_service.py    120     66    45%   Multiple lines
app/services/conversation_service.py       78     31    60%   Multiple lines
app/api/deps.py                            18      2    89%   23-24
app/api/routes/profiles.py                 67     18    73%   45-51, 78-85
app/api/routes/recommendations.py          89     42    53%   Multiple lines
app/api/routes/conversations.py            72     35    51%   Multiple lines
app/core/security.py                       42      6    86%   67-72
app/core/config.py                         15      1    93%   29
---------------------------------------------------------------------
TOTAL                                     791    245    69%
```

### Coverage Goals

**Priority 1 (Critical - Target 90%+):**
- Authentication & authorization
- Data validation
- Profile CRUD operations
- Database models

**Priority 2 (Important - Target 75%+):**
- Recommendation engine core logic
- Conversation management
- File uploads
- API endpoints

**Priority 3 (Nice to Have - Target 60%+):**
- Utility functions
- Helper methods
- Admin features

---

## Running Tests

### Basic Commands

```bash
# Run all tests
cd backend
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_profile_services.py

# Run specific test
pytest tests/test_profile_services.py::test_create_profile

# Run tests matching pattern
pytest -k "profile"

# Run with verbose output
pytest -v

# Stop on first failure
pytest -x

# Show print statements
pytest -s
```

### Advanced Options

```bash
# Run in parallel (faster)
pytest -n auto

# Generate XML report (for CI)
pytest --junit-xml=report.xml

# Run only failed tests from last run
pytest --lf

# Show slowest 10 tests
pytest --durations=10

# Run with specific marker
pytest -m "not slow"
```

### Frontend Tests (Future Enhancement)

```bash
# Run Jest tests
cd frontend
bun test

# With coverage
bun test --coverage

# Watch mode
bun test --watch

# E2E tests with Playwright
bun run test:e2e
```

---

## Writing New Tests

### Test Structure

**AAA Pattern: Arrange, Act, Assert**

```python
@pytest.mark.asyncio
async def test_example(test_db, test_user_id):
    # Arrange: Set up test data
    profile_data = {"name": "Test", "gpa": 16.0}
    service = ProfileService(test_db)
    
    # Act: Perform the action
    profile = await service.create_profile(test_user_id, profile_data)
    
    # Assert: Verify the result
    assert profile.id is not None
    assert profile.name == "Test"
```

### Naming Conventions

```python
# Good test names (descriptive)
def test_create_profile_with_valid_data()
def test_create_profile_fails_with_invalid_gpa()
def test_get_profiles_returns_empty_list_for_new_user()

# Bad test names (vague)
def test_profile()
def test_1()
def test_error()
```

### Mocking External Services

```python
from unittest.mock import patch, MagicMock

@pytest.mark.asyncio
async def test_generate_recommendations_with_mock_pinecone():
    """Mock Pinecone to avoid external API calls"""
    
    with patch("app.services.recommendation_service.pinecone_index") as mock_index:
        # Configure mock
        mock_index.query.return_value = {
            "matches": [
                {"id": "1", "score": 0.95, "metadata": {"name": "Program 1"}}
            ]
        }
        
        # Run test
        service = RecommendationService()
        results = await service.search_programs(query_vector=[0.1, 0.2, ...])
        
        # Verify mock was called
        mock_index.query.assert_called_once()
        assert len(results) == 1
```

### Async Test Best Practices

```python
#  Good: Use async fixtures and await
@pytest.mark.asyncio
async def test_async_function(test_db):
    result = await some_async_function()
    assert result is not None

#  Bad: Forget async/await
def test_async_function(test_db):  # Missing @pytest.mark.asyncio
    result = some_async_function()  # Missing await
    assert result is not None
```

---

## Continuous Integration

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      
      - name: Install dependencies
        run: |
          pip install uv
          cd backend
          uv pip install -r requirements.txt
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
        run: |
          cd backend
          pytest --cov=app --cov-report=xml --cov-report=term
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./backend/coverage.xml
          fail_ci_if_error: true

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install bun
        run: npm install -g bun
      
      - name: Install dependencies
        run: |
          cd frontend
          bun install
      
      - name: Run tests
        run: |
          cd frontend
          bun test --coverage
      
      - name: Build check
        run: |
          cd frontend
          bun run build
```

### Pre-Commit Hooks

**File:** `.pre-commit-config.yaml`

```yaml
repos:
  - repo: local
    hooks:
      - id: backend-tests
        name: Backend Tests
        entry: bash -c 'cd backend && pytest'
        language: system
        pass_filenames: false
        always_run: true
```

---

## Performance Testing

### Load Testing with Locust

**File:** `tests/load/locustfile.py`

```python
from locust import HttpUser, task, between

class SIRAUser(HttpUser):
    wait_time = between(1, 5)
    
    def on_start(self):
        """Login and get token"""
        response = self.client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "password"
        })
        self.token = response.json()["token"]
    
    @task(3)
    def get_profiles(self):
        """Fetch user profiles"""
        self.client.get(
            "/profiles",
            headers={"Authorization": f"Bearer {self.token}"}
        )
    
    @task(2)
    def create_profile(self):
        """Create new profile"""
        self.client.post(
            "/profiles",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "name": "Load Test Profile",
                "gpa": 16.0,
                "budget_min": 50000,
                "budget_max": 150000
            }
        )
    
    @task(1)
    def generate_recommendations(self):
        """Generate recommendations (expensive)"""
        self.client.post(
            "/recommendations/generate",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"profile_id": "123"}
        )
```

**Running Load Tests:**
```bash
# Install locust
pip install locust

# Run test
locust -f tests/load/locustfile.py --host=http://localhost:8000

# Open web UI: http://localhost:8089
# Configure: 100 users, spawn rate 10/second
# Run for 5 minutes
```

---

## Test Maintenance

### Regular Tasks

**Weekly:**
- [ ] Run full test suite
- [ ] Review failed tests
- [ ] Fix flaky tests

**Monthly:**
- [ ] Update test data/fixtures
- [ ] Review coverage report
- [ ] Add tests for new code

**Quarterly:**
- [ ] Performance test review
- [ ] Update testing documentation
- [ ] Refactor old tests

---

## Additional Resources

- **Developer Guide**: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)
- **Database Schema**: [DATABASE.md](./DATABASE.md)

**External Resources:**
- pytest Documentation: https://docs.pytest.org/
- Testing Best Practices: https://testdriven.io/
- Playwright Docs: https://playwright.dev/

---

**Last Updated:** January 30, 2026  
**Version:** 1.0.0  
**Test Coverage:** 52% → 80% (goal)  
**Questions?** dev@sira.platform
