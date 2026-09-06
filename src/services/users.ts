export type UserRole = 'Administrator' | 'Dokter' | 'Perawat' | 'Petugas'
export type UserStatus = 'Aktif' | 'Nonaktif'

export type UserAccount = {
  id: number
  pid: number
  username: string
  fullName: string
  initials: string
  role: UserRole
  status: UserStatus
  lastLogin: string
  createdAt: string
}

export type UserListMeta = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number | null
  to: number | null
}

type UserPayload = {
  id: number
  pid: number
  username: string
  full_name: string
  initials: string
  role: UserRole
  status: UserStatus
  last_login: string
  created_at: string
}

type UserListPayload = {
  data: UserPayload[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

type ListFilters = {
  search: string
  role: 'Semua' | UserRole
  status: 'Semua' | UserStatus
  page: number
  perPage?: number
  signal?: AbortSignal
}

function mapUser(user: UserPayload): UserAccount {
  return {
    id: user.id,
    pid: user.pid,
    username: user.username,
    fullName: user.full_name,
    initials: user.initials,
    role: user.role,
    status: user.status,
    lastLogin: user.last_login,
    createdAt: user.created_at,
  }
}

export const userApi = {
  async list(filters: ListFilters): Promise<{ users: UserAccount[]; meta: UserListMeta }> {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.role !== 'Semua') params.set('role', filters.role)
    if (filters.status !== 'Semua') params.set('status', filters.status)
    params.set('page', String(filters.page))
    params.set('per_page', String(filters.perPage ?? 8))

    const response = await fetch(`/api/users?${params.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      signal: filters.signal,
    })
    const payload = await response.json().catch(() => ({})) as UserListPayload & { message?: string }
    if (!response.ok) throw new Error(payload.message || 'Daftar user tidak dapat dimuat.')

    return {
      users: payload.data.map(mapUser),
      meta: {
        currentPage: payload.meta.current_page,
        lastPage: payload.meta.last_page,
        perPage: payload.meta.per_page,
        total: payload.meta.total,
        from: payload.meta.from,
        to: payload.meta.to,
      },
    }
  },
}
