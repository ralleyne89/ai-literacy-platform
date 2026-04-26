# LitmusAI

A comprehensive web application that combines the proven Assess → Activate → Certify methodology with modern, engaging design. Built to transform individuals and organizations from AI-curious to AI-proficient through assessment-driven, personalized learning experiences.

## 🚀 Features

### Core Functionality

- **AI Readiness Assessment**: 15-question assessment across AI Fundamentals, Practical Usage, Ethics & Critical Thinking, AI Impact & Applications, and Strategic Understanding
- **Role-Specific Training**: Customized modules for Sales, HR, Marketing, and Operations teams
- **Industry Certifications**: Verifiable credentials that validate practical AI skills
- **Progress Tracking**: Comprehensive dashboard with learning analytics

### Design & UX

- **Modern Interface**: CYPHER Learning-inspired design with teal/purple gradients
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Accessible Components**: Built with accessibility best practices
- **Interactive Elements**: Engaging user experience with smooth animations

### Technical Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase Edge Functions for production, Python Flask as a local fallback
- **Database**: Supabase Postgres for production, SQLite for local Flask fallback
- **Authentication**: Supabase Auth with Google OAuth
- **Deployment**: Netlify frontend + Supabase Auth/Postgres/Edge Functions

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Git

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ralleyne89/ai-literacy-platform.git
cd ai-literacy-platform
```

### 2. Frontend Setup

```bash
# Install frontend dependencies
npm install

# Start the frontend dev server
npm run dev

# In a separate terminal, start the backend (uses the virtualenv at `backend/venv` by default)
# By default this runs on port 5001; override with `PORT=... npm run backend` if needed.
npm run backend
```

The frontend will be available at `http://localhost:5173`

> **Note:** Create a `.env` file in the project root with `VITE_API_URL=http://localhost:5001` for local Flask development. For production builds, set `VITE_API_URL=https://<project-ref>.supabase.co/functions/v1/platform-api` and set Supabase frontend keys in Netlify.

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env file with your configuration

# Start the backend API
cd ..
npm run backend
```

The backend API will be available at `http://localhost:5001`

### 4. Database Migrations & Seeds

Application data such as training modules and certification catalogs now live in the database. After configuring your environment:

```bash
# Run database migrations
cd backend
FLASK_APP=app.py flask db upgrade

# Seed default training modules and certifications
FLASK_APP=app.py flask seed-training-modules
FLASK_APP=app.py flask seed-certifications
```

> The seed commands are idempotent. Re-run them with `--force` to refresh fixture content after editing the seed definitions.

## 🏗️ Project Structure

```
ai-literacy-platform/
├── src/                          # React frontend
│   ├── components/               # Reusable UI components
│   │   ├── course/              # Course viewer components
│   │   │   ├── TextLesson.jsx
│   │   │   ├── VideoLesson.jsx
│   │   │   ├── QuizLesson.jsx
│   │   │   └── InteractiveLesson.jsx
│   │   └── Navbar.jsx
│   ├── pages/                    # Page components
│   │   ├── HomePage.jsx
│   │   ├── AssessmentPage.jsx
│   │   ├── TrainingPage.jsx
│   │   ├── TrainingModulePage.jsx
│   │   ├── CourseViewerPage.jsx
│   │   ├── CertificationPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── App.jsx                   # Main app component
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── backend/                      # Flask backend
│   ├── routes/                   # API route handlers
│   │   ├── auth.py              # Authentication routes
│   │   ├── assessment.py        # Assessment routes
│   │   ├── training.py          # Training routes
│   │   ├── course_content.py    # Course content routes
│   │   └── certification.py     # Certification routes
│   ├── migrations/              # Database migrations
│   ├── seeders/                 # Data seeders
│   │   ├── course_content.py   # Course content seeder
│   │   └── training.py          # Training modules seeder
│   ├── models.py                # Database models
│   └── app.py                   # Flask application
├── docs/                        # Documentation
│   ├── deployment/              # Deployment guides
│   ├── course-content/          # Course content docs
│   ├── testing/                 # Testing guides
│   ├── implementation/          # Implementation details
│   └── archive/                 # Historical docs
├── package.json                 # Frontend dependencies
├── requirements.txt             # Backend dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── README.md                   # This file
```

## 🎯 Current Implementation Status

### ✅ Completed (Phase 1 & 2)

- [x] Project setup and configuration
- [x] Modern React frontend with Tailwind CSS
- [x] Flask backend with SQLAlchemy
- [x] Database models and schema
- [x] Assessment engine with 15 questions across 5 domains
- [x] User authentication system (Supabase Google OAuth release path)
- [x] Responsive UI components
- [x] Homepage with hero section and features
- [x] Assessment page with interactive quiz
- [x] Training modules overview
- [x] **Course content management system**
- [x] **Course viewer with 4 lesson types (text, video, quiz, interactive)**
- [x] **3 complete courses with 18 lessons (~5.5 hours content)**
- [x] **Personalized course recommendations based on assessment**
- [x] **Video integration with 2 videos + 10 curated**
- [x] **Enhanced quizzes (8 questions, 80% passing score)**
- [x] **Progress tracking for lessons and courses**
- [x] **Certification framework defined**
- [x] Payment integration (Stripe)
- [x] Dashboard with analytics and recommendations

### 🚧 In Progress (Phase 3)

- [x] Course content enhancement (30% complete)
- [ ] Complete Prompt Engineering Mastery (5 more lessons)
- [ ] Enhance AI Fundamentals with videos
- [ ] Enhance Elements of AI with videos
- [ ] Certificate generation system
- [ ] Final exams for all courses

### 📅 Planned (Phase 4)

- [ ] Email notifications
- [ ] Advanced reporting
- [ ] Enterprise features
- [ ] Mobile app
- [ ] API documentation
- [ ] More courses and content

## 🔐 Authentication

LitmusAI uses Supabase Auth with Google OAuth for the release auth path.

Production config:

- Frontend build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Edge Function runtime: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets, and frontend origin
- API base URL: `VITE_API_URL` pointing at the Supabase `platform-api` Edge Function

Supabase dashboard setup:

1. Enable Google as an OAuth provider in the Supabase project.
2. Add local and production `/auth/callback` URLs to the Supabase redirect URL allow list.
3. Keep the `/auth/callback` route available for the SPA PKCE code exchange.
4. Update Netlify env vars and Supabase Edge Function secrets together, then redeploy.

## 🧪 Testing the Application

### Frontend Testing

```bash
# Run the development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Testing

```bash
# Install backend + test dependencies from repo root
backend/venv/bin/python -m pip install -r requirements-dev.txt

# Start the Flask development server from repo root
npm run backend

# Run backend unit tests
npm run test:backend
```

### End-to-End (Playwright) Preconditions

Automated end-to-end workflows expect these runtime conditions:

- Frontend running at `http://127.0.0.1:5173`
- Backend API running at `http://127.0.0.1:5001`
- Test environment points to the API with `VITE_API_URL=http://127.0.0.1:5001`
- Frontend is started with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- The Supabase project allows the matching `/auth/callback` redirect URL on local and production
- A stable dataset seeded for modules, certifications, and course content
- Backend auth verification accepts Supabase access tokens for protected routes

Run the required seed steps from `backend/`:

```bash
cd backend
FLASK_APP=app.py flask db upgrade
FLASK_APP=app.py flask seed-training-modules --force
FLASK_APP=app.py flask seed-certifications --force
FLASK_APP=app.py flask seed-course-content --force
```

Supabase release verification should validate the real browser flow and preserved return-to behavior:

- `/login` and `/register` open the Google OAuth flow through Supabase
- Supabase returns to `/auth/callback`
- The callback hydrates the backend session and lands on `/dashboard`
- At least one protected route loads successfully after sign-in (for example `/training` or a course module)

Legacy note:

- `npm run e2e:smoke`, `npm run e2e:flow`, and `npm run e2e` should only be treated as release gates after they exercise the Supabase browser flow or the local Supabase stub.
- If you automate against a real Supabase tenant, inject tenant-specific values through CI/local environment variables rather than hard-coding them into the suite.

### Validation runbook (Supabase release path)

Use this sequence before shipping a Supabase build:

```bash
# backend prep (from /backend)
cd backend
source venv/bin/activate
PYTHONPATH=. FLASK_APP=app.py flask db upgrade
PYTHONPATH=. FLASK_APP=app.py flask seed-training-modules --force
PYTHONPATH=. FLASK_APP=app.py flask seed-certifications --force
PYTHONPATH=. FLASK_APP=app.py flask seed-course-content --force
cd ..

# unit coverage for the Supabase provider contract (from repo root)
npm test -- src/contexts/AuthContext.test.jsx

# static checks
npm run lint
npm run typecheck

# backend unit coverage
npm run test:backend

# production-style frontend build with explicit Supabase env
VITE_API_URL=https://your-project.supabase.co/functions/v1/platform-api \
VITE_AUTH_MODE=supabase \
VITE_SUPABASE_URL=https://your-project.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key \
ENFORCE_PROD_ENV=1 \
npm run build

# stack for Supabase browser verification
npm run backend
npm run dev -- --host 127.0.0.1 --port 5173
```

Checklist:

- [x] Backend reachable at `http://127.0.0.1:5001/api/health` (HTTP 200).
- [x] Frontend reachable at `http://127.0.0.1:5173/` (HTTP 200).
- [ ] `/login` opens the Google OAuth flow.
- [ ] `/register` opens the Google OAuth flow.
- [ ] `/auth/callback` completes without an auth error.
- [ ] Dashboard loads with an authenticated backend session.
- [ ] At least one protected route loads successfully after sign-in.

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=sqlite:///ai_literacy.db
FLASK_ENV=development
FLASK_DEBUG=True
VITE_API_URL=http://localhost:5001
VITE_AUTH_MODE=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LOG_LEVEL=INFO
# Optional: Stripe (populate once your Stripe account is ready)
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_PREMIUM=price_live_or_test_premium
STRIPE_PRICE_ENTERPRISE=price_live_or_test_enterprise
FRONTEND_URL=https://your-netlify-site.netlify.app
ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
E2E_TEST_EMAIL=autotest+playwright@example.com
E2E_TEST_PASSWORD=super-secret-test-password
# Optional: override default admin credentials used by E2E fallback path
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=super-secret-admin-password
```

### Production Build Guardrails

`npm run build` runs `scripts/validate-prod-env.mjs` before Vite build. In production contexts (`NETLIFY=true` + `CONTEXT=production`, `NODE_ENV=production`, or `ENFORCE_PROD_ENV=1`), the build will fail when:

- `VITE_API_URL` is missing, invalid, or points to localhost
- `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` is missing
- Legacy Clerk/Auth0 auth release variables are still present in the build environment
- Billing and Stripe webhook state should terminate at the backend API, not at a separate Netlify billing state store.

## 🚀 Deployment workflow (PR -> main -> Netlify)

For production releases, use this path:

1. Push your feature branch and open a pull request targeting `main`.
2. Merge the PR after approval and checks.
3. Keep Netlify configured to deploy automatically from `main`.
4. Optionally run a manual deploy from a clean `main` checkout with `netlify deploy --prod`.

### Database Setup

The application uses SQLite for development. The database will be automatically created when you first run the Flask application.

Production uses Supabase Postgres. Apply the SQL migration in `supabase/migrations/001_create_tables.sql`, deploy `supabase/functions/platform-api`, and import legacy Render data with `scripts/migrate-render-data-to-supabase.sh` if needed.

Migration checklist:

1. Apply Supabase migrations.
2. Deploy `platform-api`.
3. Set Supabase function secrets.
4. Run the Render-to-Supabase data migration script before retiring Render.

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

### Quick Links

- **[Supabase API Consolidation](docs/deployment/SUPABASE_API_CONSOLIDATION.md)** - Supabase Edge Function deployment and cutover
- **[Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Push & Deploy Guide](docs/deployment/PUSH_AND_DEPLOY_GUIDE.md)** - Quick start for deployment
- **[Course Catalog](docs/course-content/COURSE_CATALOG.md)** - Available courses and content
- **[Course Enhancement Strategy](docs/course-content/COURSE_ENHANCEMENT_STRATEGY.md)** - Content roadmap
- **[Testing Guide](docs/testing/TESTING_GUIDE.md)** - Testing procedures
- **[Work Completed Summary](docs/implementation/WORK_COMPLETED_SUMMARY.md)** - Recent updates

### Documentation Structure

```
docs/
├── deployment/          # Deployment and setup guides
├── course-content/      # Course documentation and strategies
├── testing/            # Testing guides and checklists
├── implementation/     # Implementation summaries
└── archive/           # Historical documentation
```

See [docs/README.md](docs/README.md) for the complete documentation index.

## 🔄 Recovery Tooling

When recovering from a paused Supabase project backup, use:

- `scripts/extract_supabase_recovery_sql.py`
- `scripts/import_backup_users_to_backend.py`

Reference usage is documented in `scripts/recovery/README.md`.

## 📱 Usage

1. **Start Assessment**: Visit the homepage and click "Start Free Assessment"
2. **Complete Quiz**: Answer 15 questions across AI literacy domains
3. **View Results**: Get personalized recommendations based on performance
4. **Explore Training**: Browse role-specific training modules
5. **Start Learning**: Click "Start Learning" on recommended courses
6. **Complete Lessons**: Work through text, video, quiz, and interactive lessons
7. **Track Progress**: Monitor your progress on the dashboard
8. **Earn Certifications**: Complete requirements to earn industry credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@ailiteracyplatform.com or create an issue in this repository.

## 🙏 Acknowledgments

- Inspired by GenAIPI's proven methodology
- Design influenced by CYPHER Learning's modern aesthetic
- Built for the Netlify and Supabase deployment path
