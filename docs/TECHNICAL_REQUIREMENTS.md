# MeetAt.app - Technical Requirements

## Overview

This document outlines the technical requirements, constraints, and non-functional requirements for MeetAt.app.

---

## 1. Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support including PWA |
| Firefox | 88+ | Full support including PWA |
| Safari | 14+ | Full support (iOS 14+) |
| Edge | 90+ | Chromium-based, full support |

### Required Browser Features

- **ES2020**: Modern JavaScript features (optional chaining, nullish coalescing)
- **CSS Grid & Flexbox**: Layout engines
- **LocalStorage**: Minimum 5 MB quota
- **Web Crypto API**: SHA-256 hashing (`crypto.subtle.digest`)
- **Clipboard API**: `navigator.clipboard.writeText()`
- **Service Worker**: For PWA offline functionality (optional in MVP)
- **Canvas or SVG**: For heatmap visualization

### Polyfills & Fallbacks

**Not Required for Target Browsers**:
- All target browsers support ES2020+ features natively

**Clipboard Fallback**:
```typescript
// Fallback for older browsers
if (!navigator.clipboard) {
  // Use document.execCommand('copy') as fallback
}
```

---

## 2. Performance Requirements

### Load Time Targets

| Metric | Target | Measurement Condition |
|--------|--------|----------------------|
| **First Contentful Paint (FCP)** | < 1.0s | Fast 3G (1.6 Mbps) |
| **Time to Interactive (TTI)** | < 2.0s | Fast 3G |
| **Largest Contentful Paint (LCP)** | < 2.5s | Fast 3G |
| **First Input Delay (FID)** | < 100ms | Desktop |
| **Cumulative Layout Shift (CLS)** | < 0.1 | No unexpected shifts |

### Bundle Size Targets

| Asset Type | Target Size (Gzipped) | Notes |
|------------|----------------------|-------|
| **JavaScript (Initial)** | < 150 KB | Main bundle |
| **JavaScript (Lazy-loaded)** | < 50 KB per route | Route chunks |
| **CSS** | < 30 KB | Main stylesheet |
| **Total Initial Load** | < 200 KB | Excluding images |

**Optimization Techniques**:
- Code splitting by route
- Tree shaking (Vite default)
- Minification (Terser)
- Compression (Brotli/gzip)

### Runtime Performance

| Operation | Target Time | Notes |
|-----------|------------|-------|
| **Event Creation** | < 100ms | ID generation + storage write |
| **Vote Submission** | < 50ms | LocalStorage write + UI update |
| **Heatmap Render** | < 100ms | For 500 time slots |
| **Timeline Calculation** | < 200ms | Find continuous blocks |
| **Page Navigation** | < 100ms | Client-side routing |

### Memory Constraints

- **Heap Size**: < 50 MB for typical usage (1 event, 20 participants, 100 slots)
- **LocalStorage**: < 5 MB total (browser limit)
- **No Memory Leaks**: Must pass Chrome DevTools Memory Profiler

---

## 3. Responsive Design Requirements

### Breakpoints

```css
/* Tailwind CSS default breakpoints */
sm: 640px   /* Small devices (landscape phones) */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (laptops) */
xl: 1280px  /* Extra large devices (desktops) */
2xl: 1536px /* 2X large devices (large desktops) */
```

### Device-Specific Requirements

#### Mobile (320px - 767px)
- **Single column layout**: Stack elements vertically
- **Touch targets**: Minimum 44×44 px (Apple HIG, WCAG)
- **Font size**: Minimum 16px for body text (prevent zoom on iOS)
- **Time grid**: Horizontal scroll for multiple dates, or collapse to single date view
- **Navigation**: Bottom navigation bar or hamburger menu

#### Tablet (768px - 1023px)
- **Two-column layout**: Form + preview, or grid split
- **Touch-friendly**: 44×44 px touch targets
- **Landscape optimization**: Maximize horizontal space for time grid

#### Desktop (1024px+)
- **Multi-column layout**: Sidebar + main content
- **Mouse interactions**: Hover states, tooltips
- **Keyboard shortcuts**: Tab navigation, Enter to submit

### Orientation Handling

- **Portrait**: Vertical layout, scrollable grids
- **Landscape**: Horizontal layout, maximize time grid width

---

## 4. Accessibility Requirements (WCAG 2.1 AA)

### Perceivable

#### Color Contrast
- **Text**: Minimum 4.5:1 contrast ratio (normal text)
- **Large Text**: Minimum 3:0:1 contrast ratio (18pt or 14pt bold)
- **UI Components**: Minimum 3:1 contrast ratio (buttons, borders)
- **Heatmap**: Use color + text/icons (not color alone)

#### Text Alternatives
- **Images**: Alt text for all images
- **Icons**: ARIA labels for icon-only buttons
- **QR Code**: Alt text + text URL

### Operable

#### Keyboard Navigation
- **Tab Order**: Logical tab order through interactive elements
- **Focus Indicators**: Visible focus ring (2px outline)
- **No Keyboard Trap**: Users can navigate away from all elements
- **Shortcuts**: Document keyboard shortcuts (if any)

**Example Tab Order**:
1. Event name input
2. Duration input
3. Date picker
4. Time range inputs
5. Submit button

#### Touch Targets
- **Minimum Size**: 44×44 px (mobile), 24×24 px (desktop)
- **Spacing**: Minimum 8px between targets

### Understandable

#### Error Handling
- **Validation Messages**: Clear, specific error messages
- **Error Location**: Indicate which field has error
- **Error Prevention**: Confirm destructive actions (delete vote)

**Example Error Messages**:
- ❌ "Invalid input" (too vague)
- ✅ "Event name must be between 1 and 100 characters"

#### Consistent Navigation
- **Predictable**: Same navigation pattern across all pages
- **Breadcrumbs**: Show current location in flow

### Robust

#### Screen Readers
- **ARIA Labels**: Proper labels for all interactive elements
- **ARIA Live Regions**: Announce dynamic updates (vote submitted, error)
- **Semantic HTML**: Use `<button>`, `<input>`, `<nav>`, etc.

**Example ARIA**:
```html
<button aria-label="Copy event link to clipboard">
  <CopyIcon aria-hidden="true" />
</button>

<div role="alert" aria-live="polite">
  Vote submitted successfully!
</div>
```

---

## 5. Security Requirements

### Password Protection

#### Hashing
- **Algorithm**: SHA-256 (client-side only)
- **Library**: Web Crypto API (`crypto.subtle.digest`)
- **No Transmission**: Never send plaintext passwords (client-side only app)

#### Brute-Force Protection
- **Attempt Limit**: 5 failed attempts
- **Lockout Duration**: 30 minutes
- **Storage**: LocalStorage (`lock:{eventId}`)
- **Expiration**: Auto-unlock after timeout

### Input Validation

#### Client-Side Validation (First Line of Defense)
```typescript
// Example: Event name validation
const MAX_EVENT_NAME_LENGTH = 100;
const MIN_EVENT_NAME_LENGTH = 1;

function validateEventName(name: string): boolean {
  if (name.length < MIN_EVENT_NAME_LENGTH || name.length > MAX_EVENT_NAME_LENGTH) {
    return false;
  }
  // Check for HTML/script tags (XSS prevention)
  if (/<script|<iframe|javascript:/i.test(name)) {
    return false;
  }
  return true;
}
```

#### Sanitization
- **Event Names**: Strip HTML tags, limit length
- **Participant Names**: Strip HTML tags, limit length
- **Notes**: Allow basic formatting but sanitize

**Library**: `DOMPurify` (for rich text sanitization, if needed)

### Content Security Policy (CSP)

**Recommended CSP Headers** (for server deployment):
```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

**Notes**:
- `'unsafe-inline'` for styles is acceptable with Tailwind CSS
- `data:` for QR code images (base64)

### Data Privacy

#### No Server Tracking (MVP)
- **No Analytics**: No Google Analytics or third-party trackers in MVP
- **No Cookies**: No tracking cookies
- **Local-Only**: All data stored in browser

#### Future Considerations (with Server Sync)
- **GDPR Compliance**: Right to deletion, data export
- **Data Retention**: Auto-delete events after X months (configurable)
- **Privacy Policy**: Clear privacy policy

---

## 6. Offline Support (PWA)

### Service Worker Strategy

#### Precaching (Install Event)
- **Critical Assets**: HTML, CSS, JS bundles
- **Static Assets**: Fonts, icons
- **Total Size**: < 1 MB precached

#### Runtime Caching
- **Network First**: API calls (future server sync)
- **Cache First**: Static assets (images, fonts)
- **Stale While Revalidate**: Event data (background sync)

### Offline Functionality

**Available Offline**:
- ✅ Create events
- ✅ Vote on existing events (if previously loaded)
- ✅ View results (if previously loaded)
- ✅ Edit/delete votes
- ✅ QR code generation

**Not Available Offline** (Future):
- ❌ Sync with server
- ❌ Real-time updates from other users

### Manifest.json

```json
{
  "name": "MeetAt - Team Scheduling",
  "short_name": "MeetAt",
  "description": "Offline-first team scheduling app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 7. Testing Requirements

### Unit Testing

**Coverage Target**: 80% code coverage

**Test Cases**:
- **Utility Functions**: ID generation, password hashing, time slot generation
- **Validation**: Event schema, vote schema, duplicate name check
- **Calculation**: Vote aggregation, continuous block finding
- **Storage**: CRUD operations (with mocked LocalStorage)

**Framework**: Vitest

### Component Testing

**Test Cases**:
- **EventForm**: Renders, validates, submits
- **VoteGrid**: Renders slots, toggles, bulk selects
- **Heatmap**: Renders with correct colors, tooltips
- **Timeline**: Renders blocks, handles confirmation

**Framework**: React Testing Library

### E2E Testing

**Critical User Flows**:
1. **Create Event Flow**:
   - Fill form → Submit → Redirect to vote page
   - Verify event stored in LocalStorage

2. **Vote Flow**:
   - Load event → Enter name → Select slots → Submit
   - Verify vote added to event

3. **Results Flow**:
   - Load event with votes → View heatmap → View timeline
   - Verify aggregation is correct

4. **Password Protection Flow**:
   - Create password-protected event → Access event → Enter password
   - Verify lock screen and unlock

**Framework**: Playwright

**Test Environments**:
- Chrome (desktop)
- Firefox (desktop)
- Safari (desktop)
- Chrome (mobile emulation)

### Performance Testing

**Tools**:
- **Lighthouse CI**: Automated performance audits
- **WebPageTest**: Real-world performance testing
- **Chrome DevTools**: Manual profiling

**Metrics**:
- Core Web Vitals (LCP, FID, CLS)
- Bundle size analysis
- Memory profiling

---

## 8. Browser Storage Limits

### LocalStorage

| Browser | Quota | Notes |
|---------|-------|-------|
| Chrome | 10 MB | Per origin |
| Firefox | 10 MB | Per origin |
| Safari | 5 MB | Per origin (strict) |
| Edge | 10 MB | Per origin |

**Strategy**: Use Safari's 5 MB as target limit

### IndexedDB (Future)

| Browser | Quota | Notes |
|---------|-------|-------|
| Chrome | ~60% of disk space | Pooled with other APIs |
| Firefox | ~50% of disk space | Pooled with other APIs |
| Safari | ~1 GB | User can increase |
| Edge | ~60% of disk space | Pooled with other APIs |

**Quota API**:
```typescript
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { usage, quota } = await navigator.storage.estimate();
    console.log(`Using ${usage} bytes out of ${quota} bytes.`);
    const percentUsed = (usage / quota) * 100;
    if (percentUsed > 80) {
      // Warn user
    }
  }
}
```

---

## 9. Deployment Requirements

### Static Hosting

**Platforms**:
- Vercel (recommended for Vite projects)
- Netlify
- Cloudflare Pages
- GitHub Pages

**Build Output**:
- **Directory**: `dist/`
- **Index**: `dist/index.html`
- **Routing**: Single-page app (hash-based routing)

### Environment Variables

**Development**:
```bash
VITE_APP_NAME=MeetAt
VITE_API_URL=http://localhost:3000 # Future API server
```

**Production**:
```bash
VITE_APP_NAME=MeetAt
VITE_API_URL=https://api.meetat.app # Future
```

### CI/CD Pipeline

**GitHub Actions** (example):
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 10. Monitoring & Observability (Future)

### Error Tracking

**Sentry** (recommended):
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ]
});
```

### Analytics

**Plausible Analytics** (privacy-friendly):
```html
<script defer data-domain="meetat.app" src="https://plausible.io/js/script.js"></script>
```

**Custom Events**:
```typescript
// Track event creation
window.plausible?.('Event Created', {
  props: { duration: event.duration, dates: event.candidateDates.length }
});
```

---

## 11. Third-Party Dependencies

### Core Dependencies

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| react | ^18.3.0 | UI library | MIT |
| react-dom | ^18.3.0 | React DOM renderer | MIT |
| react-router-dom | ^6.20.0 | Client-side routing | MIT |
| typescript | ^5.3.0 | Type safety | Apache 2.0 |
| vite | ^5.0.0 | Build tool | MIT |

### UI/Utility Dependencies

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| tailwindcss | ^3.4.0 | Styling | MIT |
| date-fns | ^3.0.0 | Date manipulation | MIT |
| qrcode.react | ^3.1.0 | QR code generation | MIT |
| react-hot-toast | ^2.4.1 | Toast notifications | MIT |
| clsx | ^2.1.0 | Class name utility | MIT |
| zod | ^3.22.0 | Schema validation | MIT |

### Development Dependencies

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| vitest | ^1.0.0 | Test runner | MIT |
| @testing-library/react | ^14.1.0 | Component testing | MIT |
| playwright | ^1.40.0 | E2E testing | Apache 2.0 |
| eslint | ^8.55.0 | Linting | MIT |
| prettier | ^3.1.0 | Code formatting | MIT |

### Bundle Size Impact

**Estimated Production Bundle** (minified + gzipped):
- React + ReactDOM: ~45 KB
- React Router: ~12 KB
- Date-fns: ~15 KB (tree-shaken)
- Tailwind CSS: ~10 KB (purged)
- App Code: ~50 KB
- **Total**: ~132 KB ✅ (under 150 KB target)

---

## 12. Internationalization (Future)

### i18n Strategy

**Library**: `react-i18next`

**Supported Languages** (Phase 2):
- English (en)
- Korean (ko)
- Japanese (ja)
- Spanish (es)

**Date/Time Formatting**:
- Use `Intl.DateTimeFormat` for locale-aware formatting
- Store dates in ISO format internally

---

## 13. Legal & Compliance

### Open Source License

**Recommended**: MIT License

**Includes**:
- Permissions: Commercial use, modification, distribution
- Conditions: Include license and copyright notice
- Limitations: No liability or warranty

### Privacy Policy

**Required Disclosures** (if server sync is added):
- What data is collected (event names, participant names, votes)
- How data is stored (browser local storage, server database)
- Data retention policy
- User rights (access, deletion)

### Terms of Service

**Include**:
- Acceptable use policy
- Disclaimer of warranties
- Limitation of liability

---

## Summary Checklist

### MVP Requirements

- [x] Browser compatibility (Chrome 90+, Firefox 88+, Safari 14+)
- [x] Performance targets (TTI < 2s, bundle < 200 KB)
- [x] Responsive design (mobile, tablet, desktop)
- [x] Accessibility (WCAG 2.1 AA)
- [x] Security (SHA-256 hashing, input validation, CSP)
- [x] LocalStorage-based storage (< 5 MB)
- [x] Unit + component + E2E tests (80% coverage)
- [x] PWA manifest (optional offline support)

### Future Requirements

- [ ] IndexedDB migration
- [ ] PostgreSQL server sync
- [ ] Real-time updates (WebSocket)
- [ ] Error tracking (Sentry)
- [ ] Analytics (Plausible)
- [ ] Internationalization (i18n)
- [ ] GDPR compliance

---

**Last Updated**: 2025-12-14
**Status**: Initial Draft
