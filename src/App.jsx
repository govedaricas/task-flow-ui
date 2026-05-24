import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthContext'
import { LoadingProvider } from './components/LoadingContext'
import Loader from './components/Loader'
import Login from './Login'
import Register from './Register'
import Dashboard from './components/Dashboard'
import './App.css'

function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth()
  if (authLoading) return <div>Loading...</div>
  return user ? children : <Navigate to="/login" />
}

function DefaultRoute() {
  const { user, authLoading } = useAuth()
  if (authLoading) return <div>Loading...</div>
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <Loader />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*" element={<DefaultRoute />} />
        </Routes>
      </AuthProvider>
    </LoadingProvider>
  )
}

export default App
