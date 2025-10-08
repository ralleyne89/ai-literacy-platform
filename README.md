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
- **Authentication**: JWT-based auth system
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

> **Note:** Create a `.env` file in the project root with `VITE_API_URL=http://localhost:5001` (or your deployed API URL) so the frontend can reach the backend when built outside of Vite's dev server.

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
│   │   └── Navbar.jsx
│   ├── pages/                    # Page components
│   │   ├── HomePage.jsx
│   │   ├── AssessmentPage.jsx
│   │   ├── TrainingPage.jsx
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
│   │   └── certification.py     # Certification routes
│   ├── models.py                # Database models
│   └── app.py                   # Flask application
├── package.json                 # Frontend dependencies
├── requirements.txt             # Backend dependencies
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── README.md                   # This file
```

## 🎯 Current Implementation Status

### ✅ Completed (Phase 1)

- [x] Project setup and configuration
- [x] Modern React frontend with Tailwind CSS
- [x] Flask backend with SQLAlchemy
- [x] Database models and schema
- [x] Assessment engine with sample questions
- [x] User authentication system
- [x] Responsive UI components
- [x] Homepage with hero section and features
- [x] Assessment page with interactive quiz
- [x] Training modules overview
- [x] Certification system framework

### 🚧 In Progress (Phase 2)

- [ ] Complete user authentication integration
- [ ] Database initialization and migrations
- [ ] Assessment results persistence
- [ ] Training module content delivery
- [ ] User progress tracking
- [ ] Dashboard analytics

### 📅 Planned (Phase 3)

- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] Advanced reporting
- [ ] Enterprise features
- [ ] Mobile app
- [ ] API documentation

## 🔐 Social Sign-In Setup

LitmusAI uses Supabase authentication with optional Google and Facebook OAuth providers.

1. In Supabase → Authentication → Providers, enable Google and Facebook.
2. Supply each provider’s client ID and secret. Add both your local URL (`http://localhost:5173`) and deployed domain (e.g., Netlify) to the authorized redirect list.
3. Supabase automatically handles the OAuth callback at `/auth/callback`. No additional frontend configuration is needed beyond the environment variables already in place.
4. After issuing new keys, redeploy so the environment has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

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
# Start the Flask development server
cd backend
python app.py

# Test API endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/assessment/questions

# Run backend unit tests
pip install -r ../requirements-dev.txt
pytest
```

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
```

Create a Supabase project (or use an existing one) and copy the Project URL and public `anon` API key into the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values. The frontend uses these values to communicate with Supabase for authentication. You'll also need the project's JWT secret (Settings → API → `JWT Secret`) and place it in `SUPABASE_JWT_SECRET` so the Flask API can validate Supabase-issued access tokens.

### Database Setup

The application uses SQLite for development. The database will be automatically created when you first run the Flask application.

## 📱 Usage

1. **Start Assessment**: Visit the homepage and click "Start Free Assessment"
2. **Complete Quiz**: Answer 15 questions across AI literacy domains
3. **View Results**: Get personalized recommendations based on performance
4. **Explore Training**: Browse role-specific training modules
5. **Earn Certifications**: Complete requirements to earn industry credentials

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
