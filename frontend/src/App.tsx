import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import api from './service/api'
import type { User } from './service/api'
import LoginForm from './components/LoginForm.tsx'
import RegisterForm from './components/RegisterForm.tsx'
import Dashboard from './components/Dashboard.tsx'
import GoogleCallback from './components/GoogleCallback.tsx'

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [showRegister, setShowRegister] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const userData: User = await api.getProfile()
          setUser(userData)
          setIsAuthenticated(true)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const handleLoginSuccess = async (): Promise<void> => {
    const userData: User = await api.getProfile()
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = async (): Promise<void> => {
    await api.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-600 font-medium">Carregando...</div>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 w-full max-w-md">
        <div className="transform transition-all duration-500 ease-in-out">
          {showRegister ? (
            <RegisterForm
              onSuccess={handleLoginSuccess}
              onSwitchToLogin={() => setShowRegister(false)}
            />
          ) : (
            <LoginForm
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setShowRegister(true)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
      </Routes>
    </Router>
  )
}

export default App
