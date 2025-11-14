import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import ToastContainer from './components/ToastContainer'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AIPostPage from './pages/AIPostPage'
import DualPublishPage from './pages/DualPublishPage'
import OAuthConfigPage from './pages/OAuthConfigPage'
import ProtectedRoute from './components/ProtectedRoute'
import TestSocketIO from './components/TestSocketIO'

function App() {
  const { toast } = useApp()

  return (
    <Router>
      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ai-post"
          element={
            <ProtectedRoute>
              <AIPostPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dual-publish"
          element={
            <ProtectedRoute>
              <DualPublishPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/oauth-config"
          element={
            <ProtectedRoute>
              <OAuthConfigPage />
            </ProtectedRoute>
          }
        />
        
        {/* Test Socket.IO */}
        <Route
          path="/test-socket"
          element={
            <ProtectedRoute>
              <TestSocketIO />
            </ProtectedRoute>
          }
        />
        
        {/* Redirect root to dashboard or login */}
        <Route
          path="/"
          element={
            localStorage.getItem('token') ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
