import { apiRequest } from './api'

export type PatientListItem = {
  pid: number
  medical_record_number: string
  name: string
  date_of_birth: string
  sex: string
  birth_place: string
  phone: string
  address: string
}

export type PatientSummary = {
  pid: number
  medical_record_number: string
  name: string
  national_id: string
  date_of_birth: string
  age: string
  sex: string
}

export type PatientVisit = {
  regpid: number
  registration_number: string
  visit_date: string
  department: string
  doctor: string
  guarantor: string
  status: string
}

export type VisitDetail = {
  regpid: number
  registration_number: string
  admission_date: string
  discharge_date: string
  department: string
  primary_doctor: string
  guarantor: string
  status: string
  discharge_condition: string
  sep_number: string
}

export type SoapEntry = {
  entry_id: string
  entry_type: 'doctor' | 'nurse'
  source: 'kunjungan_dokter' | 'ops_diagnosa' | 'ops_diagnosa_perawat' | 'ops_catper'
  role_label: 'Dokter' | 'SOAP Perawat'
  kdid: number | null
  odid?: number | null
  odpid: number | null
  catperid?: number | null
  author_id: number
  author_name: string
  doctor_pid: number | null
  doctor_name: string | null
  recorded_at: string
  subjective: string
  objective: string
  assessment: string
  planning: string
}

export type ProcedureCostItem = {
  description: string
  quantity: number
  unit_price: number
  gross_amount: number
  deduction_amount: number
  patient_amount: number
  period: string
}

export type ProcedureBillingData = {
  groups: Array<{
    category_id: number
    category: string
    items: ProcedureCostItem[]
  }>
  summary: {
    gross_amount: number
    deduction_amount: number
    patient_amount: number
  }
}

export type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export type PatientDetail = {
  medical_record_number: string
  identity: {
    pid: number
    name: string
    birth_place: string
    date_of_birth: string
    age: string
    sex: string
    marital_status: string
    religion: string
    citizenship: string
  }
  contact: { phone: string; email: string; address: string }
  guardian: { name: string; relationship: string; phone: string; address: string }
  additional: {
    blood_group: string
    occupation: string
    education: string
    national_id: string
    other_id_type: string
    other_id_number: string
    is_employee: string
    is_dead: string
    is_blacklist: string
  }
}

export const medicalRecordsApi = {
  list(search: string, page: number, perPage: number) {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (search) params.set('search', search)
    return apiRequest<{ data: PatientListItem[]; meta: PaginationMeta }>(`/medical-records?${params}`)
  },
  detail(pid: string) {
    return apiRequest<{ data: PatientDetail }>(`/medical-records/${encodeURIComponent(pid)}`)
  },
  patients(search: string, page = 1, perPage = 10, signal?: AbortSignal) {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (search) params.set('search', search)
    return apiRequest<{ data: PatientListItem[]; meta: PaginationMeta }>(`/medical-records/patients?${params}`, { signal })
  },
  visits(pid: number, dateFrom = '', dateTo = '', signal?: AbortSignal) {
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    const query = params.size ? `?${params}` : ''
    return apiRequest<{ data: { patient: PatientSummary; visits: PatientVisit[] } }>(`/medical-records/patients/${encodeURIComponent(pid)}/visits${query}`, { signal })
  },
  visit(regpid: string) {
    return apiRequest<{ data: { patient: PatientSummary; visit: VisitDetail } }>(`/medical-records/visits/${encodeURIComponent(regpid)}`)
  },
  soap(regpid: string) {
    return apiRequest<{ data: SoapEntry[] }>(`/medical-records/visits/${encodeURIComponent(regpid)}/soap`)
  },
  procedures(regpid: string) {
    return apiRequest<{ data: ProcedureBillingData }>(`/medical-records/visits/${encodeURIComponent(regpid)}/procedures`)
  },
}
