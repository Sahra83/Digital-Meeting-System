import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api'
import { AuthContext } from './auth-context'

const TOKEN_KEY = 'auth-token'
const SESSION_MESSAGE_KEY = 'session-message'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [sessionMessage, setSessionMessage] = useState(() => window.sessionStorage.getItem(SESSION_MESSAGE_KEY) || '')

  const logout = useCallback((message = '') => {
    window.localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)

    if (message) {
      window.sessionStorage.setItem(SESSION_MESSAGE_KEY, message)
      setSessionMessage(message)
    } else {
      window.sessionStorage.removeItem(SESSION_MESSAGE_KEY)
      setSessionMessage('')
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const result = await authApi.login(credentials)
    window.localStorage.setItem(TOKEN_KEY, result.token)
    window.sessionStorage.removeItem(SESSION_MESSAGE_KEY)
    
    // Set user first then token to avoid redundant validateSession trigger if token changed
    setUser(result.user)
    setToken(result.token)
    setSessionMessage('')
    return result.user
  }, [])

  const updateCurrentUser = useCallback((nextUser) => {
    setUser(nextUser)
  }, [])

  useEffect(() => {
    let active = true

    async function validateSession() {
      // If we already have a user, no need to validate (unless we implement periodic validation)
      if (!token || user) {
        setLoading(false)
        return
      }

      try {
        const result = await authApi.session()
        if (active) setUser(result.user)
      } catch (error) {
        // Only logout if it's explicitly an authentication error (401)
        // Network errors or server 500s shouldn't force a logout
        if (active && error.status === 401) {
          logout('Your session expired. Please login again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    validateSession()

    return () => {
      active = false
    }
  }, [logout, token, user])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      logout,
      sessionMessage,
      token,
      updateCurrentUser,
      user,
    }),
    [loading, login, logout, sessionMessage, token, updateCurrentUser, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
