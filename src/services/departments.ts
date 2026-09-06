import { apiRequest } from './api'

export type DepartmentListItem = {
  did: number
  code: string
  name: string
  short_name: string
  location: string
  specialist_id: string
  is_specialist: string
  active_status: string
  delete_status: string
}

export type DepartmentPaginationMeta = {
  current_page: number
  last_page: number
  limit: number
  total: number
  from: number | null
  to: number | null
}

export const departmentsApi = {
  list(search: string, page: number, limit: number, sort: string, direction: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort, direction })
    if (search) params.set('search', search)
    return apiRequest<{ data: DepartmentListItem[]; meta: DepartmentPaginationMeta }>(`/master/departments?${params}`)
  },
}
