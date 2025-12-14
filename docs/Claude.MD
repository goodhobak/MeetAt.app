# MeetAt.app - Project Context for Claude Code

## Project Overview

**MeetAt.app** is an offline-first, responsive web application for scheduling team and group meetings. It allows users to quickly share scheduling candidates, collect participant availability through voting, and determine optimal meeting times—all without requiring user registration.

### Key Differentiators
- **Offline-First Architecture**: Full functionality with local PostgreSQL database
- **Real-time Bidirectional Sync**: Automatic conflict resolution when online
- **No Registration Required**: Fast, friction-free user experience
- **Optional Password Protection**: SHA-256 encrypted event security
- **Responsive Design**: Consistent UX across desktop, mobile, and tablet

## Target Users
- Team leaders, club organizers, freelancers
- Professionals working in unstable network environments
- Users requiring reliable scheduling in offline/limited connectivity scenarios (field work, business trips, restricted internet access)

## Core User Roles
1. **Organizer**: Creates events and manages scheduling
2. **Participant**: Votes on available time slots

## Technology Stack (To Be Implemented)

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Library**: Tailwind CSS or similar utility-first framework
- **State Management**: React Context API or Zustand
- **Router**: React Router (hash-based routing for offline support)
- **Date/Time**: date-fns or Day.js
- **QR Code**: qrcode.react or similar
- **Visualization**: Recharts or D3.js for heatmap/timeline

### Backend/Storage
- **Primary Storage**: PostgreSQL (local instance for offline)
- **Remote Sync**: PostgreSQL server with bidirectional sync logic
- **Fallback**: LocalStorage for event data (8-character ID as key)
- **Crypto**: Web Crypto API for SHA-256 password hashing

### Deployment
- **Hosting**: Static site hosting (Vercel, Netlify, Cloudflare Pages)
- **PWA**: Service Worker for offline caching
- **Database**: Self-hosted PostgreSQL or managed service (Supabase, Neon)

## Project Structure

```
MeetAt.app/
├── src/
│   ├── components/       # React components
│   │   ├── event/       # Event creation & management
│   │   ├── vote/        # Voting interface
│   │   ├── results/     # Heatmap & timeline visualization
│   │   └── shared/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions (crypto, storage, sync)
│   ├── types/           # TypeScript type definitions
│   ├── services/        # Business logic & API services
│   │   ├── storage.ts   # LocalStorage/PostgreSQL abstraction
│   │   ├── sync.ts      # Offline-online sync logic
│   │   └── crypto.ts    # Password hashing
│   ├── router/          # Route configuration
│   └── App.tsx          # Root component
├── public/              # Static assets
├── docs/                # Documentation
└── tests/               # Test files
```

## Key Features (Functional Requirements)

### FR-001: Event Creation
- Input: Event name, duration, candidate dates, time ranges, exclude lunch option
- Output: 8-character unique ID, stored in LocalStorage
- Route: `#/event/{id}`

### FR-002: Password Protection
- Optional password field during creation
- SHA-256 hash storage
- Lock screen with brute-force protection (5 attempts, 30-min lockout)

### FR-003: URL-based Sharing
- Routes: `#/event/{id}`, `#/event/{id}/vote`, `#/event/{id}/results`
- Auto-generated QR code
- Clipboard copy button with toast notification

### FR-004: Time Voting
- Individual slot toggle (available/unavailable)
- Bulk selection: All, Morning, Afternoon
- Reset button
- Duplicate name prevention
- Edit/delete votes
- "Next participant" flow

### FR-005: Results Visualization
- **Heatmap**: Color-coded availability density, zoom in/out
- **Timeline**: Bar chart of optimal time blocks, hover for details

### FR-006: Required Participants
- Toggle participants as required (⭐ icon)
- Filter results to show only times when all required participants are available

### FR-007: Time Confirmation
- Select final time block from timeline (duration-aware)
- Visual highlight of confirmed time
- Read-only mode after confirmation (Organizer can edit)

## Data Schema

### Event Object (LocalStorage: `event:{id}`)
```typescript
interface Event {
  id: string;                    // 8-character alphanumeric
  name: string;
  duration: number;              // minutes
  candidateDates: string[];      // ISO date strings
  timeRange: {
    start: string;               // HH:mm
    end: string;                 // HH:mm
  };
  excludeLunch: boolean;
  passwordHash: string | null;   // SHA-256 hash
  createdAt: string;             // ISO timestamp
  slots: TimeSlot[];
  votes: Vote[];
  requiredAttendees: string[];   // participant names
  confirmed: {
    start: string;               // ISO datetime
    end: string;                 // ISO datetime
    by: string;                  // Organizer name
  } | null;
}

interface TimeSlot {
  date: string;                  // ISO date
  time: string;                  // HH:mm
}

interface Vote {
  name: string;
  selections: boolean[];         // parallel to Event.slots
  isRequired: boolean;
}
```

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **Component Structure**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities
- **Import Order**: React → third-party → local utilities → components → types

### Testing Strategy
- **Unit Tests**: Vitest for utility functions and hooks
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright for critical flows (create → vote → results)

### Performance Considerations
- Lazy load route components
- Debounce voting UI updates
- Memoize expensive calculations (heatmap aggregation)
- Virtual scrolling for large time slot grids

### Security
- Never store raw passwords
- Validate all user inputs
- Sanitize event names and participant names
- Implement rate limiting on password attempts

### Accessibility
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast mode for heatmap
- Screen reader announcements for vote updates

## Offline-First Sync Strategy

### Local-First Flow
1. All operations write to LocalStorage immediately
2. Background sync queue tracks pending changes
3. When online, bidirectional sync with PostgreSQL server
4. Conflict resolution: Last-write-wins with timestamp comparison
5. Merge votes by participant name (no duplicates)

### Sync Conflict Resolution
- **Event metadata**: Organizer changes win
- **Votes**: Merge by participant name, keep latest timestamp
- **Required attendees**: Union of both sets
- **Confirmation**: Server version wins (prevent double-booking)

## MVP Scope (Phase 1)

**In Scope:**
- FR-001 to FR-005 (Event creation, password, sharing, voting, visualization)
- LocalStorage-only (no PostgreSQL sync in MVP)
- Desktop and mobile responsive UI
- QR code generation

**Out of Scope (Future):**
- PostgreSQL sync implementation
- Calendar export (iCal, Google Calendar)
- Email notifications
- Recurring events
- Multi-language support

## Development Workflow

1. **Setup**: Clone repo, install dependencies (`npm install`)
2. **Development**: `npm run dev` (Vite dev server)
3. **Type Check**: `npm run type-check`
4. **Lint**: `npm run lint`
5. **Test**: `npm run test` (unit), `npm run test:e2e` (Playwright)
6. **Build**: `npm run build`
7. **Preview**: `npm run preview`

## Git Workflow

- **Main branch**: `main` (production-ready)
- **Feature branches**: `claude/feature-name-{sessionId}` (auto-generated by Claude Code)
- **Commit messages**: Conventional Commits (feat, fix, docs, refactor, test)
- **PR reviews**: Required before merge to main

## Questions for Clarification (TBD)

- [ ] Preferred UI library (Tailwind vs. Styled Components vs. Material-UI)?
- [ ] PostgreSQL sync timeline (MVP or Phase 2)?
- [ ] Hosting preference (Vercel, Netlify, self-hosted)?
- [ ] Analytics requirements (GA, Plausible, none)?
- [ ] Maximum number of participants per event (for performance tuning)?
- [ ] Time slot granularity (15min, 30min, 1hr)?

## Success Metrics

- **Performance**: Time-to-interactive < 2s on 3G
- **Usability**: < 30s to create and share an event
- **Reliability**: 100% offline functionality for core features
- **Accessibility**: WCAG 2.1 AA compliance

---

**Last Updated**: 2025-12-14
**Document Owner**: Development Team
**Status**: Initial Draft
