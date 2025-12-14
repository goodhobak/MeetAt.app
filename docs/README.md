# MeetAt.app Documentation

Welcome to the MeetAt.app documentation! This directory contains comprehensive documentation for developing, deploying, and maintaining the MeetAt.app scheduling application.

## 📚 Documentation Overview

### 1. [Claude.MD](./Claude.MD)
**Project Context for AI Assistants**

Essential reading for Claude Code or any AI assistant working on this project. Contains:
- Project overview and goals
- Technology stack
- Project structure
- Development workflow
- Success metrics

**Audience**: AI assistants, new developers, project managers

---

### 2. [ARCHITECTURE.md](./ARCHITECTURE.md)
**System Architecture**

Deep dive into the technical architecture of MeetAt.app:
- Architecture diagrams
- Technology stack details
- Component hierarchy
- Data flow diagrams
- Service layer design
- Security architecture
- Performance optimization strategies

**Audience**: Senior developers, architects, technical leads

---

### 3. [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
**Developer Handbook**

Practical guide for developers working on the codebase:
- Getting started (setup, installation)
- Project commands (dev, build, test)
- Coding standards (TypeScript, React, styling)
- State management patterns
- Testing guidelines (unit, component, E2E)
- Debugging tips
- Common pitfalls

**Audience**: All developers, contributors

---

### 4. [FEATURE_SPECS.md](./FEATURE_SPECS.md)
**Detailed Feature Specifications**

Comprehensive specifications for each feature:
- **FR-001**: Event Creation
- **FR-002**: Password Protection
- **FR-003**: URL-based Sharing
- **FR-004**: Time Voting
- **FR-005**: Results Visualization
- **FR-006**: Required Participants
- **FR-007**: Time Confirmation

Each spec includes:
- Acceptance criteria
- User stories
- Detailed business logic
- UI/UX flows
- Error handling

**Audience**: Product managers, developers, QA engineers, designers

---

### 5. [DATA_SCHEMA.md](./DATA_SCHEMA.md)
**Data Models & Storage**

Complete data model documentation:
- TypeScript interfaces (Event, Vote, TimeSlot, etc.)
- LocalStorage schema (MVP)
- IndexedDB schema (future)
- PostgreSQL schema (future)
- Storage operations (CRUD)
- Data validation rules
- Migration strategies
- Sync conflict resolution

**Audience**: Backend developers, database architects, full-stack developers

---

### 6. [TECHNICAL_REQUIREMENTS.md](./TECHNICAL_REQUIREMENTS.md)
**Non-Functional Requirements**

Technical constraints and requirements:
- Browser compatibility
- Performance targets (Core Web Vitals)
- Responsive design breakpoints
- Accessibility (WCAG 2.1 AA)
- Security requirements
- Offline support (PWA)
- Testing requirements
- Deployment requirements
- Third-party dependencies

**Audience**: DevOps engineers, QA engineers, technical leads

---

## 🚀 Quick Start

**For New Developers**:
1. Read [Claude.MD](./Claude.MD) for project overview
2. Follow [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for setup
3. Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand system design

**For Feature Implementation**:
1. Review relevant section in [FEATURE_SPECS.md](./FEATURE_SPECS.md)
2. Check [DATA_SCHEMA.md](./DATA_SCHEMA.md) for data models
3. Follow coding standards in [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

**For AI Assistants (Claude Code)**:
1. Always start with [Claude.MD](./Claude.MD)
2. Reference other docs as needed for specific tasks

---

## 📋 Document Status

| Document | Status | Last Updated | Completeness |
|----------|--------|--------------|--------------|
| Claude.MD | ✅ Draft | 2025-12-14 | 100% |
| ARCHITECTURE.md | ✅ Draft | 2025-12-14 | 100% |
| DEVELOPMENT_GUIDE.md | ✅ Draft | 2025-12-14 | 100% |
| FEATURE_SPECS.md | ✅ Draft | 2025-12-14 | 100% |
| DATA_SCHEMA.md | ✅ Draft | 2025-12-14 | 100% |
| TECHNICAL_REQUIREMENTS.md | ✅ Draft | 2025-12-14 | 100% |

---

## 🔄 Document Maintenance

### When to Update

**Claude.MD**:
- Major technology stack changes
- New MVP scope decisions
- Updated project goals

**ARCHITECTURE.md**:
- New architectural patterns introduced
- Major refactoring
- Technology upgrades

**DEVELOPMENT_GUIDE.md**:
- New development commands
- Updated coding standards
- New testing patterns

**FEATURE_SPECS.md**:
- Feature changes or additions
- Updated acceptance criteria
- New user stories

**DATA_SCHEMA.md**:
- Schema migrations
- New data models
- Storage strategy changes

**TECHNICAL_REQUIREMENTS.md**:
- Browser support changes
- Performance target adjustments
- New dependencies

### Review Process

1. **Quarterly Review**: All documents reviewed every 3 months
2. **Feature Review**: Update specs when implementing new features
3. **Tech Review**: Update architecture/requirements when upgrading tech stack

---

## 🤝 Contributing to Docs

### Writing Guidelines

1. **Be Concise**: Keep explanations clear and to the point
2. **Use Examples**: Include code examples where helpful
3. **Keep Updated**: Update docs when implementing changes
4. **Link References**: Cross-reference related sections

### Markdown Style

- Use `###` for main sections, `####` for subsections
- Use code blocks with language tags: ` ```typescript `
- Use tables for structured data
- Use bullet points for lists
- Use **bold** for emphasis, `code` for technical terms

### Example Template

```markdown
## Feature Name

### Overview
Brief description of the feature.

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Implementation
#### Code Example
\`\`\`typescript
// Example code
\`\`\`

### Testing
How to test this feature.
```

---

## 📞 Questions?

If you have questions about the documentation:
1. Check the relevant doc file first
2. Search for keywords using `Ctrl+F` / `Cmd+F`
3. Ask in the team chat or create a GitHub issue

---

## 📄 License

These documentation files are part of the MeetAt.app project and follow the same license as the main project (MIT License).

---

**Happy coding! 🎉**
