const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    })
    if (res.ok) return { ok: true }
    const data = await res.json().catch(() => ({}))
    return { ok: false, error: data.error ?? 'Invalid credentials' }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: 'include' })
}

export async function checkAuth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' })
    return res.ok
  } catch {
    return false
  }
}
