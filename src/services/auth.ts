export type AuthUser = { login_name: string; full_name: string }

type AuthResponse = { user: AuthUser }
type CsrfResponse = { csrf_token: string }

export class AuthApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'AuthApiError'
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
  })
  const data = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    throw new AuthApiError(response.status, typeof data.message === 'string' ? data.message : 'Permintaan tidak dapat diproses.')
  }
  return data as T
}

async function csrfToken(): Promise<string> {
  const response = await request<CsrfResponse>('/api/auth/csrf')
  return response.csrf_token
}

export const authApi = {
  me: () => request<AuthResponse>('/api/auth/me'),
  async login(username: string, password: string) {
    const token = await csrfToken()
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': token },
      body: JSON.stringify({ username, password }),
    })
  },
  async logout() {
    const token = await csrfToken()
    return request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': token },
    })
  },
  async changePassword(currentPassword: string, password: string) {
    const token = await csrfToken()
    return request<{ message: string }>('/api/auth/password', {
      method: 'PATCH',
      headers: { 'X-CSRF-TOKEN': token },
      body: JSON.stringify({
        current_password: currentPassword,
        password,
        password_confirmation: password,
      }),
    })
  },
}
