import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import AssessmentPage from './pages/AssessmentPage'
import TrainingPage from './pages/TrainingPage'
import TrainingModulePage from './pages/TrainingModulePage'
import CertificationPage from './pages/CertificationPage'
import EnterprisePage from './pages/EnterprisePage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import AuthCallback from './pages/AuthCallback'
import BillingPage from './pages/BillingPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/training/modules/:moduleId" element={<TrainingModulePage />} />
            <Route path="/certification" element={<CertificationPage />} />
            <Route path="/enterprise" element={<EnterprisePage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/billing" element={<BillingPage />} />
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
      </Router>
    </AuthProvider>
  )
}

export default App
