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
- **Backend**: Python Flask + SQLAlchemy
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: Supabase auth by default, with optional backend JWT auth fallback via `VITE_AUTH_MODE=backend`
- **Deployment**: Replit-ready configuration

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

> **Note:** Create a `.env` file in the project root with `VITE_API_URL=http://localhost:5001` for local development. For production builds, `VITE_API_URL` must be a deployed non-localhost API URL.

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
cp ../.env.example .env
# Edit .env file with your configuration

# Initialize database
python app.py
```

The backend API will be available at `http://localhost:5000`

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
├── vite.config.js              # Vite configuration
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
- [x] User authentication system (Supabase)
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

## 🔐 Authentication Modes

The app supports two authentication modes:

- **Supabase-first mode (default)**: uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for email/password and OAuth providers.
- **Backend compatibility mode (`VITE_AUTH_MODE=backend`)**: uses `/api/auth/register` and `/api/auth/login`; JWT tokens are stored client-side and sent with API requests.
  - Keep Supabase vars set to enable Google/Facebook OAuth while backend mode remains active.

Notes:

- Backend mode is useful when you want legacy credential-based auth only or when Supabase credentials are not available.
- Google/Facebook OAuth is available whenever `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured, even when `VITE_AUTH_MODE=backend` is set.
- Set `VITE_AUTH_MODE=backend` to use backend-auth for email/password while still allowing OAuth if Supabase variables are present.

## 🔐 Social Sign-In Setup

In Supabase mode, LitmusAI supports optional Google and Facebook OAuth providers.

1. In Supabase → Authentication → Providers, enable Google and Facebook.
2. Supply each provider’s client ID and secret. Add both your local URL (`http://localhost:5173`) and deployed domain (e.g., Netlify) to the authorized redirect list.
3. Supabase automatically handles the OAuth callback at `/auth/callback`. No additional frontend configuration is needed beyond the environment variables already in place.
4. After issuing new keys, redeploy so the environment has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

In legacy-only backend mode (when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are intentionally absent), social login is unavailable and authentication uses backend email/password endpoints only.
If those vars are set, provider login remains enabled while backend compatibility mode stays active.

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
# Install backend + test dependencies
pip install -r requirements-dev.txt

# Start the Flask development server
npm run backend

# Run backend unit tests
python -m pytest -q
```

### End-to-End (Playwright) Preconditions

Automated end-to-end workflows expect these runtime conditions:

- Frontend running at `http://127.0.0.1:5173`
- Backend API running at `http://127.0.0.1:5001`
- Test environment points to the API with `VITE_API_URL=http://127.0.0.1:5001`
- A stable dataset seeded for modules, certifications, and course content
- Supabase auth configured for deterministic automated signup/login in test environments

Required test credentials must come from CI/local env:

- `E2E_TEST_EMAIL` (required)
- `E2E_TEST_PASSWORD` (required)

Optional admin fallback credentials (recommended in CI):

- `E2E_ADMIN_EMAIL` (defaults to `reggiealleyne89@gmail.com` if unset in the test runner)
- `E2E_ADMIN_PASSWORD` (must be supplied with `E2E_ADMIN_EMAIL`)

Run the required seed steps from `backend/`:

```bash
cd backend
FLASK_APP=app.py flask db upgrade
FLASK_APP=app.py flask seed-training-modules --force
FLASK_APP=app.py flask seed-certifications --force
FLASK_APP=app.py flask seed-course-content --force
```

For fully automated runs, keep Supabase email confirmation disabled (or ensure the test account used by automation is already confirmed), and avoid relying on social OAuth providers. The Playwright flow uses direct form-driven registration/login flows, so email confirmation/pending states or provider redirects can cause non-deterministic behavior.

Recommended Playwright command usage:

- CI (auth smoke):

```bash
E2E_TEST_EMAIL=test+ci@example.com E2E_TEST_PASSWORD=strong-password \
E2E_ADMIN_EMAIL=admin@example.com E2E_ADMIN_PASSWORD=admin-password \
npm run e2e:smoke
```

- Local/full verification:

```bash
E2E_TEST_EMAIL=test+local@example.com E2E_TEST_PASSWORD=strong-password \
npm run e2e:flow
```

`npm run e2e` maps to `npm run e2e:flow` for the full journey and is kept for local/manual compatibility.

### Validation runbook (latest execution)

Executed: `2026-02-28` at `09:10 UTC`.

```bash
# backend prep (from /backend)
cd backend
source venv/bin/activate
PYTHONPATH=. FLASK_APP=app.py flask db upgrade
PYTHONPATH=. FLASK_APP=app.py flask seed-training-modules --force
PYTHONPATH=. FLASK_APP=app.py flask seed-certifications --force
PYTHONPATH=. FLASK_APP=app.py flask seed-course-content --force

# stack + Playwright execution
npm run backend
npm run dev -- --host 127.0.0.1 --port 5173
npm run e2e:install
npm run e2e:smoke
```

Checklist:

- [x] Backend reachable at `http://127.0.0.1:5001/api/health` (HTTP 200).
- [x] Frontend reachable at `http://127.0.0.1:5173/` (HTTP 200).
- [x] `npm run e2e:install` completed.
- [ ] Backend DB seed/runbook prep completed end-to-end. `flask db upgrade` and seed chain failed at migration step due pre-existing DB state (`sqlite3.OperationalError: table certification_type already exists` in local workspace).
- [ ] `npm run e2e` completed with tests. Current run reported `Error: No tests found`.

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
VITE_AUTH_MODE=backend
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
LOG_LEVEL=INFO
# Optional: Stripe (populate once your Stripe account is ready)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_PREMIUM=price_live_or_test_premium
STRIPE_PRICE_ENTERPRISE=price_live_or_test_enterprise
FRONTEND_URL=https://your-netlify-site.netlify.app
E2E_TEST_EMAIL=autotest+playwright@example.com
E2E_TEST_PASSWORD=super-secret-test-password
# Optional: override default admin credentials used by E2E fallback path
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=super-secret-admin-password
```

### Production Build Guardrails

`npm run build` runs `scripts/validate-prod-env.mjs` before Vite build. In production contexts (`NETLIFY=true` + `CONTEXT=production`, `NODE_ENV=production`, or `ENFORCE_PROD_ENV=1`), the build will fail when:

- `VITE_API_URL` is missing, invalid, or points to localhost
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required for Supabase/social flows; they are optional only for intentional legacy-only backend mode.

Create a Supabase project (or use an existing one) and copy the Project URL and public `anon` API key into the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values. The frontend uses these values to communicate with Supabase for authentication. You'll also need the project's JWT secret (Settings → API → `JWT Secret`) and place it in `SUPABASE_JWT_SECRET` so the Flask API can validate Supabase-issued access tokens.

### Database Setup

The application uses SQLite for development. The database will be automatically created when you first run the Flask application.

Common production databases (free or low-cost):

- Neon
- Render PostgreSQL
- Railway PostgreSQL
- Supabase Postgres
- Aiven PostgreSQL
- ElephantSQL (availability may vary)

Migration checklist:

1. Update `DATABASE_URL`
2. Run `cd backend && FLASK_APP=app.py flask db upgrade`
3. Re-run seeders where required (`flask seed-training-modules`, `flask seed-certifications`, `flask seed-course-content`)

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

### Quick Links

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
- Built for the Replit platform ecosystem
