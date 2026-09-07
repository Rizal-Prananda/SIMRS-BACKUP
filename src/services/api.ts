const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiError' }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const signal = init.signal ? AbortSignal.any([controller.signal, init.signal]) : controller.signal
  const timeout = window.setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init, signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
    })
    if (!response.ok) throw new ApiError(response.status, 'Permintaan ke layanan DataGuard gagal.')
    return await response.json() as T
  } finally { window.clearTimeout(timeout) }
}
