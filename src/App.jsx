import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AUTH0_CALLBACK_PATH } from './config/authRoutes'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import AssessmentPage from './pages/AssessmentPage'
import TrainingPage from './pages/TrainingPage'
import TrainingModulePage from './pages/TrainingModulePage'
import CourseViewerPage from './pages/CourseViewerPage'
import CertificationPage from './pages/CertificationPage'
import EnterprisePage from './pages/EnterprisePage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import AuthCallback from './pages/AuthCallback'
import BillingPage from './pages/BillingPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/training/modules/:moduleId" element={<TrainingModulePage />} />
            <Route path="/training/modules/:moduleId/learn" element={
              <ProtectedRoute>
                <CourseViewerPage />
              </ProtectedRoute>
            } />
            <Route path="/certification" element={<CertificationPage />} />
            <Route path="/enterprise" element={<EnterprisePage />} />
            <Route path={AUTH0_CALLBACK_PATH} element={<AuthCallback />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
