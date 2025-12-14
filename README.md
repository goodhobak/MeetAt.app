# MeetAt.app

> Offline-first, responsive web app for team and group scheduling

**MeetAt.app** is a lightweight scheduling application that allows teams to quickly coordinate meeting times without requiring user registration. It features offline-first architecture, password protection, and real-time voting visualization.

## ✨ Key Features

- **🚀 No Registration Required**: Create and share events instantly with an 8-character ID
- **🔒 Optional Password Protection**: Secure events with SHA-256 encrypted passwords
- **📱 Fully Responsive**: Optimized for mobile, tablet, and desktop
- **⚡ Offline-First**: Full functionality without internet connection
- **📊 Visual Results**: Interactive heatmap and timeline visualization
- **🎯 Smart Scheduling**: Filter by required participants and find optimal time blocks
- **🔗 Easy Sharing**: QR code generation and one-click URL copying

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/goodhobak/MeetAt.app.git
cd MeetAt.app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run dev:host         # Expose dev server to network (for mobile testing)

# Building
npm run build            # Production build
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run unit tests
npm run test:ui          # Run tests with UI dashboard
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI

# Utilities
npm run clean            # Clean build artifacts and dependencies
```

## 🏗️ Project Structure

```
MeetAt.app/
├── docs/                 # Documentation
│   ├── Claude.MD         # Project context for AI assistants
│   ├── ARCHITECTURE.md   # System architecture
│   ├── DEVELOPMENT_GUIDE.md
│   ├── FEATURE_SPECS.md
│   ├── DATA_SCHEMA.md
│   └── TECHNICAL_REQUIREMENTS.md
├── src/
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic & API services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── router/           # Route configuration
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── public/               # Static assets
├── tests/                # Test files
└── index.html            # HTML entry point
```

## 🛠️ Technology Stack

### Core
- **React 18.3+**: UI library
- **TypeScript 5+**: Type-safe development
- **Vite 5+**: Build tool and dev server

### Styling
- **Tailwind CSS 3.4+**: Utility-first CSS framework

### State & Routing
- **React Router 6+**: Client-side routing (hash-based)
- **React Context**: Global state management

### Utilities
- **date-fns**: Date manipulation
- **qrcode.react**: QR code generation
- **react-hot-toast**: Toast notifications
- **zod**: Schema validation

### Development
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Vitest**: Unit testing
- **Playwright**: E2E testing

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs) folder:

- **[Claude.MD](./docs/Claude.MD)**: Project overview and context
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)**: System architecture and design
- **[DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)**: Developer handbook
- **[FEATURE_SPECS.md](./docs/FEATURE_SPECS.md)**: Detailed feature specifications
- **[DATA_SCHEMA.md](./docs/DATA_SCHEMA.md)**: Data models and storage
- **[TECHNICAL_REQUIREMENTS.md](./docs/TECHNICAL_REQUIREMENTS.md)**: Technical constraints

## 🎯 Roadmap

### MVP (Phase 1) - Current
- [x] Documentation setup
- [ ] Event creation and management
- [ ] Password protection
- [ ] URL-based sharing with QR codes
- [ ] Time slot voting
- [ ] Results visualization (heatmap & timeline)
- [ ] Required participants filter
- [ ] Time confirmation

### Future (Phase 2)
- [ ] IndexedDB migration for larger storage
- [ ] PostgreSQL server synchronization
- [ ] Real-time updates (WebSocket)
- [ ] Calendar export (iCal, Google Calendar)
- [ ] Email notifications
- [ ] Internationalization (i18n)
- [ ] Analytics and monitoring

## 🧪 Testing

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

**Coverage Target**: 80%

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder, ready for static hosting.

### Supported Platforms

- **Vercel** (recommended)
- **Netlify**
- **Cloudflare Pages**
- **GitHub Pages**

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Tested with [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/)

---

**Made with ❤️ by the MeetAt.app team**
