# MeetAt.app - Development Guide

## Getting Started

### Prerequisites

- **Node.js**: 18.x or higher (LTS recommended)
- **npm**: 9.x or higher (comes with Node.js)
- **Git**: Latest version
- **Code Editor**: VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/goodhobak/MeetAt.app.git
cd MeetAt.app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (Vite default).

### Project Commands

```bash
# Development
npm run dev              # Start dev server with HMR
npm run dev:host         # Expose dev server to network (mobile testing)

# Building
npm run build            # Production build (outputs to /dist)
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking (no emit)

# Testing
npm run test             # Run unit tests (Vitest)
npm run test:ui          # Run tests with UI dashboard
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests (Playwright)

# Utilities
npm run clean            # Remove node_modules, dist, .cache
```

## Project Structure

```
MeetAt.app/
├── .github/              # GitHub workflows (CI/CD)
├── .vscode/              # VS Code settings (shared workspace config)
├── docs/                 # Documentation
│   ├── Claude.MD         # Project context for AI
│   ├── ARCHITECTURE.md   # System architecture
│   ├── DEVELOPMENT_GUIDE.md  # This file
│   ├── FEATURE_SPECS.md  # Feature specifications
│   └── DATA_SCHEMA.md    # Data models
├── public/               # Static assets (copied to dist)
│   ├── favicon.ico
│   ├── manifest.json     # PWA manifest
│   └── robots.txt
├── src/
│   ├── assets/           # Images, fonts, etc.
│   ├── components/       # React components
│   │   ├── event/        # Event-related components
│   │   ├── vote/         # Voting interface components
│   │   ├── results/      # Results visualization components
│   │   └── shared/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic & API services
│   │   ├── storage.ts    # LocalStorage/DB abstraction
│   │   ├── crypto.ts     # Password hashing
│   │   └── validation.ts # Input validation
│   ├── types/            # TypeScript type definitions
│   │   ├── event.ts
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   ├── router/           # Route configuration
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── tests/                # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example          # Environment variables template
├── .eslintrc.cjs         # ESLint configuration
├── .prettierrc           # Prettier configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── package.json
```

## Development Workflow

### Feature Development Process

1. **Create Feature Branch**
   ```bash
   git checkout -b claude/feature-name-{sessionId}
   ```

2. **Write Tests First (TDD - Optional but Recommended)**
   ```bash
   npm run test -- --watch
   ```

3. **Implement Feature**
   - Follow component structure guidelines
   - Use TypeScript strict mode
   - Add proper error handling

4. **Run Quality Checks**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   ```

5. **Commit Changes** (Conventional Commits)
   ```bash
   git add .
   git commit -m "feat: add event creation form"
   ```

6. **Push and Create PR**
   ```bash
   git push -u origin claude/feature-name-{sessionId}
   gh pr create --title "feat: Add event creation form" --body "..."
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(event): add password protection to event creation

fix(vote): prevent duplicate participant names

docs: update development guide with testing instructions

refactor(storage): extract LocalStorage logic to service layer
```

## Coding Standards

### TypeScript Guidelines

#### Use Strict Mode
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

#### Prefer Interfaces for Objects
```typescript
// ✅ Good
interface Event {
  id: string;
  name: string;
  duration: number;
}

// ❌ Avoid (use interface instead)
type Event = {
  id: string;
  name: string;
  duration: number;
}
```

#### Use Type for Unions/Intersections
```typescript
// ✅ Good
type Status = 'pending' | 'confirmed' | 'cancelled';
type EventWithVotes = Event & { votes: Vote[] };
```

#### Explicit Return Types for Public Functions
```typescript
// ✅ Good
export function calculateAvailability(event: Event): Map<string, number> {
  // ...
}

// ❌ Avoid (implicit return type)
export function calculateAvailability(event: Event) {
  // ...
}
```

### React Component Guidelines

#### Functional Components with TypeScript
```typescript
// ✅ Good
interface EventFormProps {
  onSubmit: (event: Event) => void;
  initialValues?: Partial<Event>;
}

export function EventForm({ onSubmit, initialValues }: EventFormProps) {
  // ...
}
```

#### Component File Structure
```typescript
// EventForm.tsx
import { useState } from 'react';
import { validateEvent } from '@/services/validation';
import type { Event } from '@/types';

interface EventFormProps {
  // ...
}

export function EventForm({ onSubmit }: EventFormProps) {
  // Component logic
}

// Subcomponents (if not reusable elsewhere)
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
```

#### Custom Hooks
```typescript
// useEvent.ts
import { useState, useEffect } from 'react';
import { getEvent } from '@/services/storage';
import type { Event } from '@/types';

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getEvent(eventId)
      .then(setEvent)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [eventId]);

  return { event, loading, error };
}
```

### State Management Patterns

#### Local State (useState)
Use for component-specific UI state:
```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
```

#### Context for Global State
```typescript
// EventContext.tsx
import { createContext, useContext, useState } from 'react';
import type { Event } from '@/types';

interface EventContextValue {
  event: Event | null;
  updateEvent: (event: Event) => void;
}

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [event, setEvent] = useState<Event | null>(null);

  const updateEvent = (newEvent: Event) => {
    setEvent(newEvent);
    // Also persist to storage
    saveEvent(newEvent);
  };

  return (
    <EventContext.Provider value={{ event, updateEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventContext() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventContext must be used within EventProvider');
  }
  return context;
}
```

### Styling Guidelines

#### Tailwind CSS Conventions
```typescript
// ✅ Good: Use utility classes
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Submit
</button>

// ✅ Good: Extract complex class combinations
const buttonClasses = clsx(
  'px-4 py-2 rounded transition-colors',
  isPrimary ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-200 hover:bg-gray-300',
  disabled && 'opacity-50 cursor-not-allowed'
);

// ❌ Avoid: Inline styles for complex logic
<div style={{ color: isActive ? 'blue' : 'gray' }}>...</div>
```

#### Component-specific Styles (if needed)
```typescript
// EventForm.module.css
.form {
  /* Complex grid layout that's hard to express in Tailwind */
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}
```

### Error Handling

#### Service Layer
```typescript
// storage.ts
export async function getEvent(id: string): Promise<Event> {
  try {
    const stored = localStorage.getItem(`event:${id}`);
    if (!stored) {
      throw new Error(`Event not found: ${id}`);
    }
    return JSON.parse(stored) as Event;
  } catch (error) {
    console.error('Failed to get event:', error);
    throw error; // Re-throw for caller to handle
  }
}
```

#### Component Layer
```typescript
function EventPage({ eventId }: { eventId: string }) {
  const { event, loading, error } = useEvent(eventId);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!event) return <NotFound />;

  return <EventView event={event} />;
}
```

#### Toast Notifications for User-Facing Errors
```typescript
import toast from 'react-hot-toast';

try {
  await saveEvent(event);
  toast.success('Event created successfully!');
} catch (error) {
  toast.error('Failed to create event. Please try again.');
  console.error(error);
}
```

## Testing Guidelines

### Unit Tests (Vitest)

#### Test File Naming
- Component tests: `ComponentName.test.tsx`
- Service tests: `serviceName.test.ts`
- Hook tests: `useHookName.test.ts`

#### Example: Testing a Service
```typescript
// storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { saveEvent, getEvent } from './storage';

describe('storage service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveEvent', () => {
    it('should save event to localStorage', () => {
      const event = { id: 'abc12345', name: 'Team Lunch', /* ... */ };
      saveEvent(event);

      const stored = localStorage.getItem('event:abc12345');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(event);
    });
  });

  describe('getEvent', () => {
    it('should throw error if event not found', () => {
      expect(() => getEvent('nonexistent')).toThrow('Event not found');
    });
  });
});
```

#### Example: Testing a Component
```typescript
// EventForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EventForm } from './EventForm';

describe('EventForm', () => {
  it('should call onSubmit with form data', async () => {
    const onSubmit = vi.fn();
    render(<EventForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Event Name'), {
      target: { value: 'Team Meeting' }
    });
    fireEvent.click(screen.getByText('Create Event'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Team Meeting' })
    );
  });

  it('should show validation error for empty name', () => {
    render(<EventForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByText('Create Event'));

    expect(screen.getByText('Event name is required')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/create-event.spec.ts
import { test, expect } from '@playwright/test';

test('user can create event and vote', async ({ page }) => {
  // Create event
  await page.goto('http://localhost:5173');
  await page.fill('[name="eventName"]', 'Team Lunch');
  await page.fill('[name="duration"]', '60');
  await page.click('button:has-text("Create Event")');

  // Should redirect to vote page
  await expect(page).toHaveURL(/\/#\/event\/[a-z0-9]{8}\/vote/);

  // Vote on time slots
  await page.fill('[name="participantName"]', 'Alice');
  await page.click('[data-slot="2025-12-15T12:00"]');
  await page.click('[data-slot="2025-12-15T13:00"]');
  await page.click('button:has-text("Submit Vote")');

  // Check vote appears
  await expect(page.locator('text=Alice')).toBeVisible();
});
```

## Performance Best Practices

### 1. Memoization
```typescript
// ✅ Good: Memoize expensive calculations
const heatmapData = useMemo(() => {
  return calculateHeatmap(event.votes, event.slots);
}, [event.votes, event.slots]);

// ✅ Good: Memoize components
const TimeSlotCell = React.memo(function TimeSlotCell({ slot, selected, onToggle }) {
  return <div onClick={onToggle}>{slot.time}</div>;
});
```

### 2. Debouncing User Input
```typescript
import { debounce } from 'lodash-es';

const debouncedSave = useMemo(
  () => debounce((event: Event) => saveEvent(event), 300),
  []
);

// Use in event handler
const handleSlotToggle = (slotId: string) => {
  const updatedEvent = { ...event, /* toggle logic */ };
  debouncedSave(updatedEvent);
};
```

### 3. Code Splitting
```typescript
// Lazy load route components
import { lazy, Suspense } from 'react';

const ResultsPage = lazy(() => import('./pages/ResultsPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Suspense>
  );
}
```

## Debugging

### React Developer Tools
- Install React DevTools browser extension
- Inspect component hierarchy and props
- Profile performance with the Profiler tab

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug in Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### LocalStorage Inspection
```typescript
// Debug helper
export function debugStorage() {
  console.log('=== LocalStorage Contents ===');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('event:')) {
      console.log(key, JSON.parse(localStorage.getItem(key)!));
    }
  }
}
```

## Common Pitfalls

### ❌ Avoid: Direct State Mutation
```typescript
// Bad
const [event, setEvent] = useState<Event>(initialEvent);
event.votes.push(newVote); // Mutation!
setEvent(event); // Won't trigger re-render

// Good
setEvent({
  ...event,
  votes: [...event.votes, newVote]
});
```

### ❌ Avoid: Missing Dependencies in useEffect
```typescript
// Bad
useEffect(() => {
  fetchEvent(eventId); // eventId not in dependency array!
}, []);

// Good
useEffect(() => {
  fetchEvent(eventId);
}, [eventId]);
```

### ❌ Avoid: Async State Updates
```typescript
// Bad
const handleSubmit = async () => {
  setLoading(true);
  await saveEvent(event);
  setLoading(false); // Component might unmount before this!
};

// Good
const handleSubmit = async () => {
  setLoading(true);
  try {
    await saveEvent(event);
  } finally {
    setLoading(false);
  }
};
```

## Resources

### Official Documentation
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Learning Resources
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Patterns.dev](https://www.patterns.dev/) - React design patterns
- [Web.dev](https://web.dev/) - Performance and best practices

---

**Last Updated**: 2025-12-14
**Maintainer**: Development Team
