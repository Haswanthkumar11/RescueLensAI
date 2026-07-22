import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import { PERMISSIONS } from './constants/permissions'
import Landing from './pages/Landing'
import Upload from './pages/Upload'
import Result from './pages/Result'
import History from './pages/History'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import ResponderDashboard from './pages/ResponderDashboard'
import AdminDashboard from './pages/AdminDashboard'

// Potentially unused. Left intentionally to preserve backwards compatibility.
function PlaceholderDashboard({ title, description, requiredPermission }) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow mb-3">System Area</p>
      <h1 className="mb-4 text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mb-8 text-paper/60">{description}</p>
      <div className="glass-card p-8 flex flex-col justify-center items-center text-center space-y-4">
        <div className="text-scan-cyan font-mono text-sm">System Status: Operational</div>
        <div className="text-paper/40 text-xs">Access authorized under permission: <code className="text-scan-cyan font-bold">{requiredPermission}</code></div>
      </div>
    </section>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/upload"
            element={
              <ProtectedRoute permission={PERMISSIONS.CAN_ANALYZE}>
                <Upload />
              </ProtectedRoute>
            }
          />

          <Route
            path="/result/:id"
            element={
              <ProtectedRoute permission={PERMISSIONS.CAN_VIEW_HISTORY}>
                <Result />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute permission={PERMISSIONS.CAN_VIEW_HISTORY}>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute permission={PERMISSIONS.CAN_VIEW_HISTORY}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* New Protected Routes for Emergency Workflow */}
          <Route
            path="/responder-dashboard"
            element={
              <ProtectedRoute permission={PERMISSIONS.CAN_VIEW_RESPONDER_DASHBOARD}>
                <ResponderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incident-management"
            element={
              <ProtectedRoute permission={PERMISSIONS.CAN_MANAGE_INCIDENTS}>
                <AdminDashboard defaultTab="incidents" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute permission={PERMISSIONS.CAN_MANAGE_USERS}>
                <AdminDashboard defaultTab="users" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/system-settings"
            element={
              <ProtectedRoute permission={PERMISSIONS.CAN_VIEW_SETTINGS}>
                <AdminDashboard defaultTab="settings" />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
