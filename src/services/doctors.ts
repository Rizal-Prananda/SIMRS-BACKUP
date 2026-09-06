import { apiRequest } from './api'
import type { PaginationMeta } from './medicalRecords'

export type DoctorDepartment = {
  did: number
  name: string
  code: string
  location: string
  is_specialist: string
  is_active: boolean
  bpjs_code: string
  ihs_location: string
}

export type DoctorListItem = {
  pid: number
  doctor_code: string
  name: string
  departments: DoctorDepartment[]
  is_specialist: string
  prefix_code: string
  building: string
  floor: string
  room: string
  bpjs_id: string
  inhealth_id: string
  ihs_id: string
  attendance_status: string
  is_active: boolean
}

export type DoctorDetail = {
  doctor_code: string
  is_active: boolean
  identity: {
    pid: number
    name: string
    sex: string
    birth_place: string
    date_of_birth: string
    religion: string
    marital_status: string
    phone: string
    email: string
    address: string
    ihs_id: string
  }
  employee: {
    empid: string
    doctor_number: string
    sip: string
    kd_dpjp: string
    prefix_code: string
    job_title: string
    working_status: string
    is_discharged: string
    join_date: string
    exit_date: string
  }
  departments: DoctorDepartment[]
}

export type DoctorSchedule = {
  dsid: number
  did: number
  weekday: number
  day: string
  start_time: string
  end_time: string
  department: string
  floor: string
  room: string
  bpjs: string
  hfis_quota: string
}

export const doctorsApi = {
  list(search: string, page: number, perPage: number, sort = 'name', direction = 'asc') {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage), sort, direction })
    if (search) params.set('search', search)
    return apiRequest<{ data: DoctorListItem[]; meta: PaginationMeta }>(`/doctors?${params}`)
  },
  detail(pid: string) {
    return apiRequest<{ data: DoctorDetail }>(`/doctors/${encodeURIComponent(pid)}`)
  },
  departments(pid: string) {
    return apiRequest<{ data: DoctorDepartment[] }>(`/doctors/${encodeURIComponent(pid)}/departments`)
  },
  schedules(pid: string) {
    return apiRequest<{ data: DoctorSchedule[] }>(`/doctors/${encodeURIComponent(pid)}/schedules`)
  },
}
