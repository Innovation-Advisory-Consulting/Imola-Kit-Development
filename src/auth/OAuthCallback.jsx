import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { retrieveVerifier, clearVerifier } from './pkce'
import axios from 'axios'

export default function OAuthCallback() {
  const { setTokens } = useAuth()
  const navigate = useNavigate()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      navigate('/login')
      return
    }

    const verifier = retrieveVerifier()
    clearVerifier()

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: import.meta.env.VITE_SF_REDIRECT_URI,
      client_id: import.meta.env.VITE_SF_CLIENT_ID,
      client_secret: import.meta.env.VITE_SF_CLIENT_SECRET,
      code_verifier: verifier
    })

    axios
      .post('/services/oauth2/token', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      .then(async (res) => {
        const { access_token, instance_url, id } = res.data
        let user = null
        try {
          // Use instance URL for identity to avoid CORS on login.salesforce.com
          const idPath = new URL(id).pathname
          const identity = await axios.get(`${instance_url}${idPath}`, {
            headers: { Authorization: `Bearer ${access_token}` }
          })
          const d = identity.data
          user = {
            id: d.user_id,
            name: d.display_name,
            email: d.email,
            avatar: d.photos?.picture || d.photos?.thumbnail || null,
            username: d.username
          }
        } catch (e) {
          console.warn('Could not fetch user identity:', e.message)
        }
        setTokens(access_token, instance_url, user)
        navigate('/dashboard')
      })
      .catch((err) => {
        console.error('OAuth token exchange failed:', err.response?.data || err.message)
        navigate('/login')
      })
  }, [])

  return null
}
