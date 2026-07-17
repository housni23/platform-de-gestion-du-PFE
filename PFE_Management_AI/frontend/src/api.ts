export type Role = 'student' | 'supervisor' | 'chef' | 'admin'

export interface AuthUser {
  id: number
  first_name: string
  last_name: string
  email: string
  role: Role
  role_label: string
  filiere?: { id: number; name: string; code: string } | null
  locale: string
}

export interface AuthSession {
  user: AuthUser
  role: Role
  token_type: 'Bearer'
  access_token: string
  refresh_token: string
  expires_at: string
  refresh_expires_at: string
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

const API_URL = import.meta.env.VITE_API_URL || '/api'
const SESSION_KEY = 'gestpfe_session'
let refreshPromise: Promise<boolean> | null = null

export function getSession(): AuthSession | null {
  try {
    const value = sessionStorage.getItem(SESSION_KEY)
    return value ? JSON.parse(value) as AuthSession : null
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function saveSession(session: AuthSession | null): void {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else sessionStorage.removeItem(SESSION_KEY)
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return response.json()
  return response.text()
}

async function refreshAccessToken(): Promise<boolean> {
  const session = getSession()
  if (!session?.refresh_token) return false

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  })
  if (!response.ok) {
    saveSession(null)
    return false
  }
  const tokens = await response.json() as Pick<AuthSession, 'token_type' | 'access_token' | 'refresh_token' | 'expires_at' | 'refresh_expires_at'>
  saveSession({ ...session, ...tokens })
  return true
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const session = getSession()
  const isFormData = options.body instanceof FormData
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (!isFormData && options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (response.status === 401 && retry && session?.refresh_token) {
    refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null })
    if (await refreshPromise) return apiRequest<T>(path, options, false)
  }

  const payload = await parseResponse(response)
  if (!response.ok) {
    const data = typeof payload === 'object' && payload ? payload as { message?: string; errors?: Record<string, string[]> } : {}
    const firstValidationError = data.errors ? Object.values(data.errors).flat()[0] : undefined
    throw new ApiError(firstValidationError || data.message || `Erreur HTTP ${response.status}`, response.status, data.errors)
  }
  return payload as T
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  })
  saveSession(session)
  return session
}

export async function getGoogleUrl(): Promise<string> {
  const result = await apiRequest<{ url: string }>('/auth/google/url')
  return result.url
}

export async function completeGoogleLogin(code: string, state: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>('/auth/google/callback', {
    method: 'POST', body: JSON.stringify({ code, state }),
  })
  saveSession(session)
  return session
}

export async function logout(): Promise<void> {
  try { await apiRequest('/auth/logout', { method: 'POST' }) } finally { saveSession(null) }
}

export async function verifySession(): Promise<AuthUser> {
  const response = await apiRequest<{ user: AuthUser }>('/auth/me')
  const session = getSession()
  if (session) saveSession({ ...session, user: response.user, role: response.user.role })
  return response.user
}

export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const request = () => {
    const session = getSession()
    return fetch(`${API_URL}${path}`, {
      headers: { Accept: '*/*', Authorization: `Bearer ${session?.access_token || ''}` },
    })
  }
  let response = await request()
  if (response.status === 401 && await refreshAccessToken()) response = await request()
  if (!response.ok) {
    const payload = await parseResponse(response)
    const message = typeof payload === 'object' && payload && 'message' in payload ? String(payload.message) : 'Téléchargement impossible.'
    throw new ApiError(message, response.status)
  }
  const disposition = response.headers.get('content-disposition') || ''
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const regular = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  const fileName = encoded ? decodeURIComponent(encoded) : regular || fallbackName
  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
