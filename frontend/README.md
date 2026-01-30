# SIRA Frontend

**Modern RAG-Powered Academic Recommendation System**

Built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 18+ (recommended: 20+)
- **Bun**: Latest version (recommended package manager)
- **Backend**: SIRA backend API running on port 8000

### Installation

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── providers.tsx            # App providers (theme, etc.)
│   ├── (auth)/                  # Authentication routes
│   │   ├── sign-in/
│   │   └── sign-up/
│   └── dashboard/               # Main application
│       ├── (chat)/              # Chat interface
│       ├── (with-sidebar)/      # Profile & recommendations
│       └── layout.tsx
│
├── components/                   # React components
│   ├── ui/                      # Shadcn/ui components
│   ├── profile/                 # Profile wizard components
│   ├── prompt-kit/              # Chat interface components
│   ├── doc-search.tsx           # Documentation search (Ctrl+K)
│   ├── recommendation-card.tsx  # Program recommendation cards
│   └── user-nav.tsx             # User navigation
│
├── lib/                         # Utilities & APIs
│   ├── api/                     # API client functions
│   ├── types/                   # TypeScript type definitions
│   ├── profile-api.ts           # Profile management API
│   ├── profile-form-schema.ts   # Zod validation schemas
│   └── utils.ts                 # Helper functions
│
├── hooks/                       # Custom React hooks
│   ├── use-conversation-stream.ts  # SSE chat streaming
│   ├── use-recommendation-stream.ts # SSE recommendations
│   └── use-mobile.ts            # Responsive utilities
│
├── stores/                      # Zustand state management
│   └── profile-wizard-store.ts  # Multi-step wizard state
│
└── public/                      # Static assets
```

---

## 🎨 Key Features

### For Students
- **Multi-Profile Management**: Create and manage multiple academic profiles
- **AI Chat Advisor**: Real-time conversational AI with streaming responses
- **Smart Recommendations**: Personalized program suggestions with match scores
- **Visual Insights**: Charts showing compatibility, timelines, and comparisons
- **Feedback System**: Rate and improve recommendations
- **Responsive Design**: Fully mobile-optimized interface

### Technical Features
- **Server Components**: Optimized performance with React Server Components
- **Client Components**: Interactive UI with minimal JavaScript
- **SSE Streaming**: Real-time Server-Sent Events for chat and recommendations
- **Type Safety**: Full TypeScript coverage across the codebase
- **State Management**: Zustand for global state (profiles, wizard)
- **Form Validation**: Zod schemas with TanStack Form
- **Authentication**: Clerk integration with JWT tokens
- **Documentation Search**: Ctrl+K search across all docs (see `components/doc-search.tsx`)

---

## 🛠️ Development

### Available Scripts

```bash
# Development server with hot reload
bun dev

# Production build
bun run build

# Start production server
bun start

# Run linting
bun run lint

# Run type checking
bun run type-check

# Format code
bun run format
```

### Environment Variables

Create a `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Coding Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **Components**: Functional components with TypeScript props
- **Styling**: Tailwind CSS utility classes (no CSS modules)
- **State**: Server Components by default, Client Components only when needed
- **Imports**: Absolute imports using `@/` prefix

---

## 📚 Documentation

### Full Documentation
See [../docs/README.md](../docs/README.md) for complete project documentation.

### Key Documents for Frontend Developers
- **[Developer Guide](../docs/Developer%20Documentation/DEVELOPER_GUIDE.md)** - Setup and workflow
- **[Architecture](../docs/Developer%20Documentation/ARCHITECTURE.md)** - System design
- **[API Reference](../docs/Developer%20Documentation/API_REFERENCE.md)** - Backend API endpoints
- **[Tech Stack](../docs/Developer%20Documentation/TECH_STACK.md)** - Technologies explained

### Quick Links
- **Documentation Search**: Press `Ctrl+K` (or `⌘K`) from anywhere
- **API Docs**: http://localhost:8000/docs (when backend is running)
- **Component Library**: Built with [Shadcn/ui](https://ui.shadcn.com/)

---

## 🔌 API Integration

### Backend Connection

The frontend connects to the FastAPI backend at `http://localhost:8000`.

**Key Endpoints**:
```
GET    /api/profiles           # List user profiles
POST   /api/profiles           # Create profile
GET    /api/profiles/{id}      # Get profile details
PUT    /api/profiles/{id}      # Update profile
DELETE /api/profiles/{id}      # Delete profile

POST   /api/recommendations/stream          # Get recommendations (SSE)
POST   /api/conversations/stream            # Chat with AI (SSE)
POST   /api/recommendations/{id}/feedback   # Submit feedback
```

### Server-Sent Events (SSE)

The app uses SSE for real-time streaming:

```typescript
// Example: Streaming chat responses
import { useConversationStream } from '@/hooks/use-conversation-stream';

const { messages, sendMessage } = useConversationStream();

await sendMessage('What programs match my profile?');
// Response streams in real-time
```

---

## 🎨 UI Components

Built with **Shadcn/ui** + **Tailwind CSS** + **Radix UI**:

### Core Components
- `components/ui/` - Base UI primitives (button, dialog, card, etc.)
- `components/profile/` - Profile wizard steps
- `components/prompt-kit/` - Chat interface
- `components/doc-search.tsx` - Documentation search with Ctrl+K

### Custom Components
- `<RecommendationCard />` - Program recommendation display
- `<FeedbackModal />` - Recommendation rating
- `<UserNav />` - User menu and profile switcher
- `<ThemeToggle />` - Light/dark mode

---

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

### E2E Tests
```bash
# Run Playwright tests
bun test:e2e

# Run in UI mode
bun test:e2e --ui
```

---

## 🚢 Deployment

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun start
```

### Docker Deployment

```bash
# Build image
docker build -t sira-frontend .

# Run container
docker run -p 3000:3000 sira-frontend
```

### Environment Configuration

**Production checklist**:
- ✅ Set `NEXT_PUBLIC_API_BASE_URL` to production backend
- ✅ Configure Clerk production keys
- ✅ Enable HTTPS/SSL
- ✅ Set up CDN for static assets
- ✅ Configure monitoring (Sentry, etc.)

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow coding standards**: Run `bun run lint` before committing
4. **Write tests**: Add tests for new features
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**

See [Developer Guide](../docs/Developer%20Documentation/DEVELOPER_GUIDE.md) for detailed contribution guidelines.

---

## 📦 Tech Stack

**Core**:
- [Next.js 16](https://nextjs.org/) - React Framework with App Router
- [React 19](https://react.dev/) - UI Library
- [TypeScript 5](https://www.typescriptlang.org/) - Type Safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling

**UI Components**:
- [Shadcn/ui](https://ui.shadcn.com/) - Component Library
- [Radix UI](https://www.radix-ui.com/) - Headless UI Primitives
- [Lucide Icons](https://lucide.dev/) - Icon Library

**State & Forms**:
- [Zustand](https://zustand-demo.pmnd.rs/) - State Management
- [TanStack Form](https://tanstack.com/form) - Form Management
- [Zod](https://zod.dev/) - Schema Validation

**Authentication**:
- [Clerk](https://clerk.com/) - User Authentication & Management

**Data Visualization**:
- [Chart.js](https://www.chartjs.org/) - Charts & Graphs

---

## 📞 Support

**For Developers**:
- 🐛 Issues: [GitHub Issues](https://github.com/yourorg/sira/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourorg/sira/discussions)
- 📚 Docs: [Full Documentation](../docs/README.md)

**For Users**:
- 📧 Support: support@sira.platform
- 📖 User Guide: [User Documentation](../docs/User%20Documentation/USER_GUIDE.md)

---

## 📄 License

[Your License Here]

---

**Built with ❤️ by the SIRA Team**

**Last Updated**: January 30, 2026  
**Version**: 1.0.0
