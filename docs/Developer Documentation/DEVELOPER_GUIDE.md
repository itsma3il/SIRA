# SIRA Developer Guide

## Getting Started

Welcome to the SIRA development team! This guide covers coding standards, development workflow, and best practices.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Coding Standards](#coding-standards)
4. [Common Tasks](#common-tasks)
5. [Testing](#testing)
6. [Debugging](#debugging)
7. [Performance Optimization](#performance-optimization)
8. [Security Best Practices](#security-best-practices)

---

## Development Setup

### Prerequisites

- **Node.js:** 18.17+ or later
- **Python:** 3.11+
- **Docker & Docker Compose:** Latest versions
- **Git:** Latest version
- **VS Code:** (recommended) with extensions:
  - Python (Microsoft)
  - Pylance
  - ESLint
  - Prettier
  - Docker
  - REST Client

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourorg/sira.git
   cd sira
   ```

2. **Install system dependencies:**
   ```bash
   # macOS
   brew install postgres python@3.11 node bun

   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql python3.11 nodejs npm

   # Install bun (all platforms)
   curl -fsSL https://bun.sh/install | bash
   ```

3. **Start Docker services:**
   ```bash
   docker-compose up -d
   ```

4. **Frontend setup:**
   ```bash
   cd frontend
   bun install
   bun run dev
   # Opens http://localhost:3000
   ```

5. **Backend setup:**
   ```bash
   cd backend
   uv venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   uv pip install -e .
   python -m uvicorn app.main:app --reload
   # API available at http://localhost:8000
   # Docs at http://localhost:8000/docs
   ```

### Environment Configuration

1. **Copy example files:**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure environment variables:**
   ```
   # .env.local
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_public_key
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   
   DATABASE_URL=postgresql://postgres:password@localhost:5432/sira_dev
   MISTRAL_API_KEY=your_mistral_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_env
   ```

3. **Database initialization:**
   ```bash
   cd backend
   alembic upgrade head
   ```

---

## Project Structure

### Frontend Structure
```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Protected dashboard routes
│   ├── admin/             # Admin routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── error.tsx          # Error page
├── components/            # React components
│   ├── ui/               # Shadcn/Radix components
│   ├── profile/          # Profile-related components
│   ├── recommendation/   # Recommendation components
│   └── admin/            # Admin components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and services
│   ├── api/             # API service functions
│   ├── types/           # TypeScript type definitions
│   └── utils.ts         # General utilities
├── stores/              # Zustand stores
├── public/              # Static assets
├── tsconfig.json        # TypeScript configuration
├── next.config.ts       # Next.js configuration
└── tailwind.config.ts   # Tailwind configuration
```

### Backend Structure
```
backend/
├── app/
│   ├── main.py                # Application entry point
│   ├── db.py                  # Database connection
│   ├── api/
│   │   ├── routes/           # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── profiles.py
│   │   │   ├── recommendations.py
│   │   │   ├── admin.py
│   │   │   └── health.py
│   │   └── deps.py           # Dependency injection
│   ├── core/
│   │   ├── config.py         # Configuration
│   │   ├── security.py       # Security utilities
│   │   └── constants.py      # Constants
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic schemas
│   ├── services/             # Business logic
│   ├── repositories/         # Database access
│   ├── middleware/           # Custom middleware
│   └── utils/                # Utilities
├── alembic/                  # Database migrations
├── tests/                    # Test suite
├── requirements.txt          # Python dependencies
├── pyproject.toml           # Project configuration
└── Dockerfile              # Container definition
```

---

## Coding Standards

### Frontend (TypeScript/React)

**Code Style:**
- Use **ESLint** and **Prettier** for formatting
- ESLint config: `eslint.config.mjs`
- Run before committing: `bun run lint` and `bun run format`

**TypeScript Rules:**
- No `any` types - use explicit types
- Enable strict mode in `tsconfig.json`
- Use discriminated unions for complex types
- Document complex types with JSDoc

**React Component Rules:**
```typescript
// ✅ Good
interface UserCardProps {
  userId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function UserCard({ userId, onSelect, className }: UserCardProps) {
  return (
    <button onClick={() => onSelect(userId)} className={className}>
      User: {userId}
    </button>
  );
}

// ❌ Bad
export function UserCard(props: any) {
  return <button onClick={() => props.onSelect(props.id)}>{props.id}</button>;
}
```

**Component Organization:**
1. Imports
2. Type definitions (Props interface)
3. Component function
4. Helper functions
5. Export statement

**Naming Conventions:**
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: Lowercase with `use` prefix (`useAuthentication.ts`)
- Services: camelCase with `service` suffix (`profileService.ts`)
- Types: PascalCase with `Type` or `Props` suffix

### Backend (Python/FastAPI)

**Code Style:**
- Follow PEP 8 standard
- Use type hints on all functions
- Run formatters:
  ```bash
  black app/
  isort app/
  ```

**Function Documentation:**
```python
async def create_profile(user_id: UUID, profile_data: ProfileCreate) -> Profile:
    """
    Create a new academic profile for a user.
    
    Args:
        user_id: The ID of the authenticated user
        profile_data: Profile creation data (validated Pydantic schema)
    
    Returns:
        Created Profile object
    
    Raises:
        HTTPException: 400 if profile_data is invalid
        HTTPException: 404 if user not found
    """
    # Implementation
```

**API Endpoint Pattern:**
```python
@router.post("/profiles", response_model=ProfileResponse, status_code=201)
async def create_profile(
    current_user: User = Depends(get_current_user),
    profile_data: ProfileCreate = Body(...)
) -> ProfileResponse:
    """Create a new profile for the authenticated user."""
    try:
        profile = await profile_service.create_profile(
            current_user.id,
            profile_data
        )
        return profile
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

**Model Definition:**
```python
class Profile(SQLModel, table=True):
    """Academic profile for a student."""
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id")
    profile_name: str = Field(min_length=3, max_length=255)
    status: str = Field(default="draft")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: User = Relationship(back_populates="profiles")
```

**Error Handling:**
```python
# ✅ Good
try:
    result = await database_operation()
except ValueError as e:
    logger.warning(f"Validation error: {str(e)}")
    raise HTTPException(status_code=400, detail="Invalid input")
except Exception as e:
    logger.error(f"Unexpected error: {str(e)}", exc_info=True)
    raise HTTPException(status_code=500, detail="Internal server error")

# ❌ Bad
try:
    result = await database_operation()
except:
    pass  # Never silently catch all exceptions
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Define Pydantic schema** in `app/schemas/`:
   ```python
   class NewResourceCreate(BaseModel):
       name: str
       description: Optional[str] = None
   ```

2. **Create database model** in `app/models/`:
   ```python
   class NewResource(SQLModel, table=True):
       id: UUID = Field(default_factory=uuid4, primary_key=True)
       name: str
       description: Optional[str] = None
   ```

3. **Create service** in `app/services/`:
   ```python
   async def create_resource(data: NewResourceCreate) -> NewResource:
       # Business logic here
       pass
   ```

4. **Create route** in `app/api/routes/`:
   ```python
   @router.post("/resources", response_model=NewResourceResponse)
   async def create_resource(
       data: NewResourceCreate,
       current_user: User = Depends(get_current_user)
   ):
       return await resource_service.create_resource(data)
   ```

5. **Register route** in `app/main.py`:
   ```python
   app.include_router(resource_router, prefix="/api")
   ```

### Adding a New Frontend Component

1. **Create component file:**
   ```typescript
   // components/MyComponent.tsx
   interface MyComponentProps {
     title: string;
     onAction: () => void;
   }
   
   export function MyComponent({ title, onAction }: MyComponentProps) {
     return (
       <div>
         <h2>{title}</h2>
         <button onClick={onAction}>Action</button>
       </div>
     );
   }
   ```

2. **Create stories for Storybook** (optional):
   ```typescript
   // components/MyComponent.stories.tsx
   export default {
     component: MyComponent,
     title: "Components/MyComponent"
   };
   ```

3. **Use in pages:**
   ```typescript
   // app/dashboard/page.tsx
   import { MyComponent } from "@/components/MyComponent";
   
   export default function DashboardPage() {
     return <MyComponent title="Dashboard" onAction={() => {}} />;
   }
   ```

### Running Tests

**Frontend tests:**
```bash
cd frontend
bun run test
bun run test:watch
bun run test:coverage
```

**Backend tests:**
```bash
cd backend
pytest
pytest -v              # Verbose
pytest --cov          # With coverage
pytest -k "profile"   # Filter by name
pytest --lf           # Last failed
```

### Database Migrations

**Create migration:**
```bash
cd backend
alembic revision --autogenerate -m "Add new column to profiles"
```

**Review migration** in `alembic/versions/`:
```python
def upgrade() -> None:
    op.add_column('profiles', sa.Column('new_field', sa.String()))

def downgrade() -> None:
    op.drop_column('profiles', 'new_field')
```

**Apply migration:**
```bash
alembic upgrade head
```

**Rollback migration:**
```bash
alembic downgrade -1
```

---

## Testing

### Frontend Testing Strategy

**Unit Tests:** Component logic and utilities
```typescript
import { render, screen } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders title", () => {
    render(<MyComponent title="Test" onAction={() => {}} />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

**Integration Tests:** Multiple components working together
```typescript
describe("Profile Form", () => {
  it("submits valid profile data", async () => {
    const { user } = render(<ProfileForm />);
    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.click(screen.getByText("Submit"));
    expect(onSubmit).toHaveBeenCalled();
  });
});
```

### Backend Testing Strategy

**Unit Tests:** Individual functions
```python
def test_sanitize_html():
    result = sanitize_html("<script>alert('xss')</script>Safe")
    assert "script" not in result
    assert "Safe" in result
```

**Integration Tests:** Full endpoint testing
```python
@pytest.mark.asyncio
async def test_create_profile_endpoint(client: TestClient, auth_token: str):
    response = client.post(
        "/api/profiles",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"profile_name": "Test", "gpa": 15.5}
    )
    assert response.status_code == 201
    assert response.json()["profile_name"] == "Test"
```

### Test Coverage Goals

- **Target:** > 70% overall
- **Critical paths:** > 90%
- **Utilities:** > 80%
- **Models/Schemas:** > 75%

---

## Debugging

### Frontend Debugging

**Chrome DevTools:**
1. Open DevTools (F12)
2. Check Console tab for errors
3. Use Debugger tab to step through code
4. Check Network tab for API calls

**VS Code Debugging:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/frontend/node_modules/.bin/next",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/frontend"
    }
  ]
}
```

**Useful Next.js Tools:**
```bash
# React DevTools extension for Chrome/Firefox
# Redux DevTools for Zustand (optional)
# Next.js Error UI shows detailed error information
```

### Backend Debugging

**FastAPI Interactive Docs:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

**Python Debugger:**
```python
import pdb

def my_function():
    x = 10
    pdb.set_trace()  # Execution pauses here
    return x
```

**Logging:**
```python
import logging

logger = logging.getLogger(__name__)

logger.debug("Debug info")
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")
```

**VS Code Debugging:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload"],
      "jinja": true,
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

---

## Performance Optimization

### Frontend Optimization

**Code Splitting:**
```typescript
// Use dynamic imports for heavy components
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <LoadingSpinner />
});
```

**Image Optimization:**
```typescript
import Image from "next/image";

// Always use Next.js Image component for optimization
<Image src="/logo.png" alt="Logo" width={100} height={100} />
```

**Bundle Analysis:**
```bash
bun add -D @next/bundle-analyzer
# Update next.config.ts to use analyzer
bun run build
# View bundle report at .next/server/chunks/app/_analyzeFile.html
```

**Memoization:**
```typescript
import { memo } from "react";

const UserCard = memo(function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>;
});
```

### Backend Optimization

**Database Query Optimization:**
```python
# ❌ Slow - N+1 query problem
users = await db.query(User)
for user in users:
    profiles = await db.query(Profile).filter(Profile.user_id == user.id)

# ✅ Fast - Eager loading
users = await db.query(User).options(joinedload(User.profiles))
```

**Caching:**
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_computation(value: str) -> str:
    # Cached result returned on repeated calls
    return result
```

**Async Operations:**
```python
# ✅ Good - Concurrent requests
results = await asyncio.gather(
    api_call_1(),
    api_call_2(),
    api_call_3()
)

# ❌ Bad - Sequential (slow)
result1 = await api_call_1()
result2 = await api_call_2()
result3 = await api_call_3()
```

---

## Security Best Practices

### Frontend Security

**Protecting Sensitive Data:**
```typescript
// ✅ Good - Don't log sensitive data
console.log("User created"); // ✓

// ❌ Bad - Never log sensitive data
console.log(jwt_token); // ✗
console.log(user_password); // ✗
```

**XSS Prevention:**
```typescript
// ✅ Good - React auto-escapes by default
<div>{user_input}</div>

// ❌ Bad - Never use dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: user_input }} />
```

**CSRF Protection:**
- Clerk handles CSRF for authentication
- For custom endpoints, ensure POST/PUT/DELETE require CSRF tokens

**Content Security Policy:**
```typescript
// Configure in next.config.ts or headers
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
`;
```

### Backend Security

**Input Validation:**
```python
# ✅ Use Pydantic for validation
class UserCreate(BaseModel):
    email: EmailStr  # Automatically validates email format
    password: str = Field(min_length=8)

# ❌ Never trust user input
user_email = request.email  # Could be invalid
```

**SQL Injection Prevention:**
```python
# ✅ Good - SQLAlchemy prevents SQL injection
users = await db.query(User).filter(User.email == email)

# ❌ Bad - Never use string formatting for queries
query = f"SELECT * FROM users WHERE email = '{email}'"  # Vulnerable!
```

**Authentication:**
```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Verify JWT token and return authenticated user."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)
    
    user = await get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404)
    return user
```

**Rate Limiting:**
```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(credentials: LoginRequest):
    # Prevents brute force attacks
    pass
```

**Environment Secrets:**
```bash
# ✅ Good - Use environment variables
API_KEY=os.getenv("API_KEY")

# ❌ Bad - Hardcoded secrets
API_KEY = "sk-1234567890"  # Never!
```

---

## Getting Help

- **Documentation:** Check [docs/INDEX.md](./INDEX.md)
- **API Docs:** http://localhost:8000/docs (when running)
- **GitHub Issues:** Search existing issues before creating new ones
- **Team Communication:** Use team chat for real-time help
- **Code Review:** Submit PR for feedback on your changes

---

**Developer Guide Version:** 1.0.0  
**Last Updated:** January 30, 2026  
**Status:** Production Ready
