import { createContext, useContext, useState, useEffect } from 'react'
import { getToken } from '../utils/token'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      // Assume user is logged in if token exists
      setUser({ token })
    }
    setLoading(false)
  }, [])

  const login = (token) => {
    setUser({ token })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}