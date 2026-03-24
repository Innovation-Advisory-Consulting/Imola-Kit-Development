export function generateCodeVerifier() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function storeVerifier(verifier) {
  sessionStorage.setItem('pkce_verifier', verifier)
}

export function retrieveVerifier() {
  return sessionStorage.getItem('pkce_verifier')
}

export function clearVerifier() {
  sessionStorage.removeItem('pkce_verifier')
}
