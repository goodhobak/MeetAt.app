# MeetAt.app - System Architecture

## Architecture Overview

MeetAt.app follows an **offline-first, client-centric architecture** with optional server synchronization. The application is designed to function fully without network connectivity, using local storage as the primary data source.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   React Application                   │  │
│  │  ┌────────────┐  ┌──────────┐  ┌─────────────────┐  │  │
│  │  │ Components │  │  Hooks   │  │  State Context  │  │  │
│  │  └────────────┘  └──────────┘  └─────────────────┘  │  │
│  │         │               │                 │          │  │
│  │  ┌──────▼───────────────▼─────────────────▼───────┐  │  │
│  │  │              Service Layer                     │  │  │
│  │  │  • Storage Service  • Crypto Service          │  │  │
│  │  │  • Sync Service     • Validation Service      │  │  │
│  │  └──────┬───────────────┬──────────────────┬──────┘  │  │
│  └─────────┼───────────────┼──────────────────┼─────────┘  │
│            │               │                  │            │
│  ┌─────────▼──────┐  ┌────▼──────┐  ┌────────▼─────────┐  │
│  │  LocalStorage  │  │ IndexedDB │  │  Service Worker  │  │
│  │  (Event Data)  │  │(Optional) │  │   (PWA Cache)    │  │
│  └────────────────┘  └───────────┘  └──────────────────┘  │
└────────────┬────────────────────────────────┬──────────────┘
             │                                │
             │ Sync (when online)             │ Static Assets
             │                                │
┌────────────▼────────────────────────────────▼──────────────┐
│                      Server (Optional)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    REST API / GraphQL                 │  │
│  │  ┌────────────────┐         ┌──────────────────────┐ │  │
│  │  │  Sync Endpoint │         │  Conflict Resolution │ │  │
│  │  └────────┬───────┘         └──────────┬───────────┘ │  │
│  └───────────┼──────────────────────────────┼────────────┘  │
│  ┌───────────▼──────────────────────────────▼────────────┐  │
│  │              PostgreSQL Database                      │  │
│  │  • events table  • votes table  • sync_log table     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

#### Core Framework
- **React 18.3+**: UI library with Concurrent Rendering
- **TypeScript 5+**: Type-safe development
- **Vite 5+**: Fast build tool and dev server

#### Routing
- **React Router 6+**: Client-side routing
- **Hash-based routing**: `#/event/{id}` for offline compatibility

#### State Management
- **React Context API**: Global state (event data, sync status)
- **Zustand** (alternative): Lightweight state management if complexity grows
- **Local State**: Component-level useState/useReducer for UI state

#### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Modules** (alternative): Scoped styling
- **PostCSS**: CSS processing and optimization

#### UI Components
- **Headless UI**: Accessible component primitives
- **Radix UI** (alternative): Unstyled, accessible components
- **Custom Components**: Event-specific UI (time grid, heatmap)

#### Date/Time Handling
- **date-fns**: Lightweight date manipulation
- **Day.js** (alternative): Minimal date library

#### Visualization
- **Recharts**: Declarative charts for timeline
- **Custom Canvas**: Heatmap rendering for performance
- **D3.js** (if needed): Advanced visualizations

#### Utilities
- **qrcode.react**: QR code generation
- **react-hot-toast**: Toast notifications
- **clsx**: Conditional CSS class composition

### Storage Layer

#### Primary Storage (MVP)
- **LocalStorage**: Simple key-value store for event data
  - Key format: `event:{8-char-id}`
  - Max ~5MB per domain (browser dependent)
  - Synchronous API (fast for small datasets)

#### Future Storage (Phase 2)
- **IndexedDB**: Large-scale offline storage
  - Structured object store
  - Asynchronous API
  - Supports complex queries

#### Server-side Database (Future)
- **PostgreSQL 15+**: Relational database
  - ACID compliance for data integrity
  - JSONB columns for flexible event metadata
  - Full-text search for event names
  - Row-level security for multi-tenancy

### Security

#### Cryptography
- **Web Crypto API**: SHA-256 password hashing
  - `crypto.subtle.digest('SHA-256', data)`
  - Client-side only (no plaintext transmission)

#### Content Security Policy (CSP)
- Strict CSP headers for XSS prevention
- No inline scripts or styles (Vite handles this)

#### Input Validation
- **Zod**: TypeScript-first schema validation
- Sanitize user inputs (event names, participant names)
- Length limits on text fields

### PWA (Progressive Web App)

#### Service Worker
- **Vite PWA Plugin**: Auto-generated service worker
- **Workbox**: Precaching and runtime caching strategies
- **Offline fallback**: Display cached UI when offline

#### Manifest
- App name, icons, theme colors
- Install prompt for mobile devices

### Build & Development

#### Build Tool
- **Vite**: Fast HMR, optimized production builds
- **esbuild**: Fast TypeScript compilation
- **Rollup**: Bundling and code splitting

#### Code Quality
- **ESLint**: Linting with Airbnb/Standard config
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Run linters on staged files

#### Testing
- **Vitest**: Unit and integration tests (Vite-native)
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **MSW (Mock Service Worker)**: API mocking

## Data Flow

### Event Creation Flow

```
User Input (Form)
      │
      ▼
┌─────────────────┐
│  Validation     │ ← Zod schema
└────────┬────────┘
         │ valid
         ▼
┌─────────────────┐
│  Generate ID    │ ← crypto.randomUUID().slice(0,8)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Hash Password  │ ← SHA-256 (if password set)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Create Slots   │ ← Generate time slots from date range
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store Locally   │ ← LocalStorage.setItem(`event:${id}`, JSON)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sync Queue     │ ← Add to pending sync (if online)
└────────┬────────┘
         │
         ▼
   Redirect to #/event/{id}/vote
```

### Voting Flow

```
Load Event (by ID)
      │
      ▼
┌─────────────────┐
│ Check Password  │ ── Locked? ──► Show lock screen
└────────┬────────┘
         │ unlocked
         ▼
┌─────────────────┐
│  Display Grid   │ ← Render time slots
└────────┬────────┘
         │
         ▼
   User toggles slots
         │
         ▼
┌─────────────────┐
│ Check Duplicate │ ← Prevent same participant name
└────────┬────────┘
         │ unique
         ▼
┌─────────────────┐
│  Save Vote      │ ← Update event.votes array
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Update Storage │ ← LocalStorage.setItem
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sync Queue     │ ← Queue vote update
└────────┬────────┘
         │
         ▼
   Show success → Next participant or View results
```

### Results Calculation Flow

```
Load Event + Votes
      │
      ▼
┌─────────────────┐
│ Filter Required │ ← If required attendees set
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Aggregate Votes │ ← Count per time slot
└────────┬────────┘
         │
         ├────────────────────┐
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│  Build Heatmap  │  │ Build Timeline  │
│  (Color scale)  │  │ (Continuous     │
│                 │  │  blocks)        │
└─────────────────┘  └─────────────────┘
         │                    │
         └────────┬───────────┘
                  ▼
           Render visualizations
```

### Offline Sync Flow (Future)

```
┌─────────────────┐
│  Client Action  │ (create, vote, update)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Write Locally   │ ← Immediate LocalStorage write
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sync Queue     │ ← { action, data, timestamp }
└────────┬────────┘
         │
         ▼
    Online? ──No──► Queue persists
         │ Yes
         ▼
┌─────────────────┐
│  POST to Server │ ← Send queued changes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Server Merge    │ ← Conflict resolution logic
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │ ← Updated server state
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Local    │ ← Merge server changes
└────────┬────────┘
         │
         ▼
   Clear from sync queue
```

## Component Architecture

### Component Hierarchy

```
App
├── Router (HashRouter)
│   ├── HomePage (/)
│   │   └── CreateEventForm
│   ├── EventPage (/event/:id)
│   │   ├── PasswordLock (conditional)
│   │   └── EventLayout
│   │       ├── EventHeader
│   │       ├── SharePanel (QR, copy link)
│   │       └── TabNav (Vote / Results)
│   ├── VotePage (/event/:id/vote)
│   │   ├── VoteGrid
│   │   │   ├── TimeSlotCell
│   │   │   └── BulkSelectBar
│   │   ├── ParticipantForm
│   │   └── VoteList (edit/delete)
│   └── ResultsPage (/event/:id/results)
│       ├── RequiredFilter
│       ├── Heatmap
│       │   ├── HeatmapGrid
│       │   ├── ZoomControls
│       │   └── Tooltip
│       ├── Timeline
│       │   ├── TimeBlock
│       │   └── ConfirmModal
│       └── ParticipantList
└── Providers
    ├── EventProvider (Context)
    ├── SyncProvider (Context)
    └── ToastProvider
```

### Service Layer

```
services/
├── storage.ts
│   ├── getEvent(id)
│   ├── saveEvent(event)
│   ├── deleteEvent(id)
│   └── listEvents()
├── crypto.ts
│   ├── hashPassword(password)
│   └── verifyPassword(input, hash)
├── sync.ts (future)
│   ├── queueChange(change)
│   ├── syncToServer()
│   └── mergeFromServer(serverData)
├── validation.ts
│   ├── eventSchema (Zod)
│   ├── voteSchema (Zod)
│   └── validateDuplicateName(event, name)
└── calculation.ts
    ├── aggregateVotes(event)
    ├── filterByRequired(slots, required)
    └── findContinuousBlocks(slots, duration)
```

## Security Architecture

### Password Protection Flow

```
Event Creation
      │
      ▼
   Password input? ──No──► passwordHash = null
      │ Yes
      ▼
┌─────────────────┐
│  Validate (≥6)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SHA-256 Hash   │ ← crypto.subtle.digest
└────────┬────────┘
         │
         ▼
  Store hash in event.passwordHash

───── Later: Event Access ─────

Load Event
      │
      ▼
  passwordHash exists? ──No──► Allow access
      │ Yes
      ▼
┌─────────────────┐
│  Show Lock UI   │
└────────┬────────┘
         │
         ▼
   User enters password
         │
         ▼
┌─────────────────┐
│  Hash Input     │ ← SHA-256
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Compare Hash   │ ── Match? ──► Allow access
└────────┬────────┘
         │ No match
         ▼
┌─────────────────┐
│ Increment Fails │ ← Store in LocalStorage
└────────┬────────┘
         │
    Fails ≥ 5? ──Yes──► Lock for 30 minutes
         │ No
         ▼
   Show error, allow retry
```

### Brute-Force Protection

```typescript
interface LockState {
  eventId: string;
  attempts: number;
  lockedUntil: number | null; // timestamp
}

// Stored in LocalStorage: `lock:${eventId}`
```

## Performance Optimization

### Rendering Optimization
- **React.memo**: Memoize TimeSlotCell to prevent re-renders
- **useMemo**: Cache expensive calculations (heatmap data)
- **useCallback**: Stable event handlers
- **Virtual scrolling**: For events with 100+ time slots

### Storage Optimization
- **Debounce writes**: Batch LocalStorage updates (300ms)
- **Compression**: Consider LZ-string for large events (future)
- **Selective loading**: Load only required event data

### Network Optimization (Future)
- **Request batching**: Combine multiple sync operations
- **Delta sync**: Send only changed fields
- **ETag caching**: HTTP cache headers
- **WebSocket**: Real-time updates (optional)

## Deployment Architecture

### Static Hosting
```
CDN (Cloudflare, Vercel, Netlify)
      │
      ▼
┌─────────────────────────────┐
│  Static Assets              │
│  • index.html               │
│  • JS bundles (hashed)      │
│  • CSS bundles              │
│  • Service Worker           │
│  • Manifest.json            │
└─────────────────────────────┘
```

### Database Hosting (Future)
- **Supabase**: Managed PostgreSQL + REST API + Realtime
- **Neon**: Serverless PostgreSQL with branching
- **Self-hosted**: PostgreSQL + PostgREST/Hasura

## Scalability Considerations

### MVP (LocalStorage-only)
- **Limit**: ~1000 events per browser (5MB total)
- **Performance**: No network latency, instant operations

### Phase 2 (IndexedDB)
- **Limit**: ~50MB-1GB (browser-dependent)
- **Performance**: Async API, indexed queries

### Phase 3 (PostgreSQL Sync)
- **Horizontal scaling**: Read replicas for query load
- **Vertical scaling**: Increase instance size for write load
- **Partitioning**: Partition events table by creation date
- **Archival**: Move old events to cold storage (S3 + metadata in DB)

## Monitoring & Observability (Future)

### Error Tracking
- **Sentry**: Client-side error monitoring
- **Source maps**: Upload to Sentry for stack traces

### Analytics
- **Plausible/Fathom**: Privacy-friendly analytics
- **Custom events**: Track create/vote/confirm actions

### Performance Monitoring
- **Web Vitals**: LCP, FID, CLS, TTFB
- **Lighthouse CI**: Automated performance audits

---

**Last Updated**: 2025-12-14
**Status**: Initial Architecture Draft
