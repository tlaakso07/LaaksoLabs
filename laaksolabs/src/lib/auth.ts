export const SESSION_COOKIE = 'laakso_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

function b64urlEncode(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
  const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function signSession(username: string, secret: string): Promise<string> {
  const payload = { u: username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  return `${payloadB64}.${b64urlEncode(new Uint8Array(sig))}`
}

export async function verifySession(
  token: string | undefined,
  secret: string,
  expectedUsername: string,
): Promise<boolean> {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payloadB64, sigB64] = parts
  try {
    const key = await hmacKey(secret)
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sigB64),
      new TextEncoder().encode(payloadB64),
    )
    if (!ok) return false
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as {
      u: string
      exp: number
    }
    if (payload.u !== expectedUsername) return false
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return false
    return true
  } catch {
    return false
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.AUTH_USERNAME ?? ''
  const expectedPass = process.env.AUTH_PASSWORD ?? ''
  if (!expectedUser || !expectedPass) return false
  return constantTimeEqual(username, expectedUser) && constantTimeEqual(password, expectedPass)
}

export function getAuthSecret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET env var missing')
  return s
}

export function getAuthUsername(): string {
  const u = process.env.AUTH_USERNAME
  if (!u) throw new Error('AUTH_USERNAME env var missing')
  return u
}
