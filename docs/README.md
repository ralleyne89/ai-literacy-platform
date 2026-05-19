# LitmusAI Platform Documentation

This directory contains all documentation for the LitmusAI platform.

## 📁 Directory Structure

### `/deployment`
Deployment guides, setup instructions, and production deployment documentation.

### `/course-content`
Course content documentation, enhancement strategies, IP compliance, and video sources.

### `/testing`
Testing guides, verification checklists, and quality assurance documentation.

### `/implementation`
Implementation summaries, status reports, and technical implementation details.

### `/archive`
Older documentation and historical records (kept for reference).

### `/database`
Database setup, migration scripts, and readiness checklists.

### `DESIGN_SYSTEM.md`
LitmusAI brand, UI tokens, component rules, and landing-page design guidance.

## 🚀 Quick Start

**New to the project?** Start here:
1. Read the main [README.md](../README.md) in the root directory
2. Check [deployment/DEPLOYMENT_GUIDE.md](deployment/DEPLOYMENT_GUIDE.md) for setup
3. Review [course-content/COURSE_CATALOG.md](course-content/COURSE_CATALOG.md) for available courses

**Local development defaults:**
- Frontend: `http://localhost:5173` via `npm run dev`
- Backend API: `http://localhost:5001` via `npm run backend`
- Auth release path: Clerk only (`VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER`, `CLERK_JWKS_URL`)

**Deploying?** See:
- [deployment/DEPLOYMENT_GUIDE.md](deployment/DEPLOYMENT_GUIDE.md)
- [deployment/PUSH_AND_DEPLOY_GUIDE.md](deployment/PUSH_AND_DEPLOY_GUIDE.md)

**Pre-flight DB checks?** See:
- [database/DB_PRE_FLIGHT_RECOMMENDATION_READINESS.md](database/DB_PRE_FLIGHT_RECOMMENDATION_READINESS.md)

**Adding content?** See:
- [course-content/COURSE_ENHANCEMENT_STRATEGY.md](course-content/COURSE_ENHANCEMENT_STRATEGY.md)
- [course-content/VIDEO_CONTENT_SOURCES.md](course-content/VIDEO_CONTENT_SOURCES.md)

**Testing?** See:
- [testing/TESTING_GUIDE.md](testing/TESTING_GUIDE.md)
- [testing/COMPLETE_TESTING_CHECKLIST.md](testing/COMPLETE_TESTING_CHECKLIST.md)

Current top-level checks:
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:backend`
- `npm run build`
