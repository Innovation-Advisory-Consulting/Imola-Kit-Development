import { createContext, useContext, useState, useCallback } from 'react'
import { generateCodeVerifier, generateCodeChallenge, storeVerifier } from './pkce'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = sessionStorage.getItem('sf_auth')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    storeVerifier(verifier)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: import.meta.env.VITE_SF_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_SF_REDIRECT_URI,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      prompt: 'login'
    })

    window.location.href = `${import.meta.env.VITE_SF_LOGIN_URL}/services/oauth2/authorize?${params}`
  }, [])

  const setTokens = useCallback((accessToken, instanceUrl, user) => {
    const authData = { accessToken, instanceUrl, user: user || null }
    setAuth(authData)
    sessionStorage.setItem('sf_auth', JSON.stringify(authData))
  }, [])

  const logout = useCallback(() => {
    setAuth(null)
    sessionStorage.removeItem('sf_auth')
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, setTokens, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
