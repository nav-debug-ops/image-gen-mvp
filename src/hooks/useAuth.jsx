import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth'
import { isAuthenticated as checkAuth } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if there's a stored token on mount
    if (checkAuth()) {
      getMe()
        .then((data) => {
          if (data) setUser(data)
        })
        .catch(() => {
          // Token expired or invalid
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const data = await apiLogin(email, password)
    setUser(data.user)
    return data
  }

  const register = async (email, password, displayName) => {
    const data = await apiRegister(email, password, displayName)
    setUser(data.user)
    return data
  }

  const logout = () => {
    setUser(null)
    apiLogout()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
