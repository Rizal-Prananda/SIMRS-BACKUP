import { ArrowDownAZ, ChevronLeft, ChevronRight, Eye, Search, ShieldCheck, Stethoscope, X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../../components/ui/PageContainer'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ViewState'
import { doctorsApi, type DoctorListItem } from '../../services/doctors'
import type { PaginationMeta } from '../../services/medicalRecords'

export function DoctorManagementPage() {
  const [doctors, setDoctors] = useState<DoctorListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [draftSearch, setDraftSearch] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sort, setSort] = useState('name')
  const [direction, setDirection] = useState('asc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    doctorsApi.list(search, page, perPage, sort, direction)
      .then((response) => {
        if (!active) return
        setDoctors(response.data)
        setMeta(response.meta)
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [search, page, perPage, sort, direction])

  function prepareLoad() {
    setLoading(true)
    setError(false)
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    const nextSearch = draftSearch.trim()
    if (nextSearch === search && page === 1) return
    prepareLoad()
    setPage(1)
    setSearch(nextSearch)
  }

  function clearSearch() {
    if (search === '' && page === 1) {
      setDraftSearch('')
      return
    }
    prepareLoad()
    setDraftSearch('')
    setPage(1)
    setSearch('')
  }

  function changePage(nextPage: number) {
    if (nextPage === page) return
    prepareLoad()
    setPage(nextPage)
  }

  const pages = paginationWindow(meta?.current_page ?? 1, meta?.last_page ?? 1)

  return (
    <PageContainer className="doctor-management-page">
      <header className="module-heading">
        <div><p>Dokter</p><h2>Management</h2><span>Direktori dokter SIMRS beserta unit dan identitas integrasinya.</span></div>
        <div className="readonly-pill"><ShieldCheck size={16} /> 100% Read-only</div>
      </header>

      <section className="records-panel doctor-panel">
        <div className="records-toolbar doctor-toolbar">
          <form className="records-search" onSubmit={submitSearch}>
            <Search size={17} />
            <input value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Cari dokter atau kode dokter..." aria-label="Search dokter" />
            {draftSearch && <button type="button" onClick={clearSearch} aria-label="Hapus pencarian"><X size={15} /></button>}
            <button type="submit" className="search-submit">Cari</button>
          </form>
          <div className="doctor-filters">
            <label className="compact-select"><ArrowDownAZ size={15} /><span>Urutkan</span>
              <select value={`${sort}:${direction}`} onChange={(event) => { prepareLoad(); const [nextSort, nextDirection] = event.target.value.split(':'); setSort(nextSort); setDirection(nextDirection); setPage(1) }}>
                <option value="name:asc">Nama A–Z</option><option value="name:desc">Nama Z–A</option><option value="code:asc">Kode terkecil</option><option value="code:desc">Kode terbesar</option>
              </select>
            </label>
            <label className="per-page">Tampilkan<select value={perPage} onChange={(event) => { prepareLoad(); setPerPage(Number(event.target.value)); setPage(1) }}>{[10, 25, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}</select>data</label>
          </div>
        </div>

        {loading ? <LoadingState title="Memuat data dokter" description="Mengambil direktori dokter dari SIMRS..." /> :
          error ? <ErrorState title="Data dokter gagal dimuat" description="Periksa koneksi SIMRS lalu muat ulang halaman." /> :
          doctors.length === 0 ? <EmptyState title="Data dokter tidak ditemukan" description={search ? 'Coba gunakan nama atau kode dokter yang berbeda.' : 'Belum ada dokter yang dapat ditampilkan.'} icon={Stethoscope} /> : <>
            <div className="records-table-wrap">
              <table className="records-table doctor-table">
                <thead><tr><th>Kode Dokter</th><th>Nama Dokter</th><th>Bagian / Poli</th><th>Spesial</th><th>Kode Prefix</th><th>Gedung</th><th>Lantai</th><th>Ruang</th><th>ID BPJS</th><th>ID Inhealth</th><th>IHS ID</th><th>Status Hadir</th><th>Aksi</th></tr></thead>
                <tbody>{doctors.map((doctor) => <tr key={doctor.pid}>
                  <td><span className="doctor-code">{doctor.doctor_code}</span></td>
                  <td><strong>{doctor.name}</strong><small>PID {doctor.pid} · <span className={doctor.is_active ? 'text-active' : 'text-inactive'}>{doctor.is_active ? 'Aktif' : 'Nonaktif'}</span></small></td>
                  <td className="doctor-departments">{doctor.departments.length ? doctor.departments.map((department) => <span key={department.did}>{department.name}</span>) : '-'}</td>
                  <td><BooleanBadge value={doctor.is_specialist} /></td><td>{doctor.prefix_code}</td><td>{doctor.building}</td><td>{doctor.floor}</td><td>{doctor.room}</td>
                  <td>{doctor.bpjs_id}</td><td>{doctor.inhealth_id}</td><td>{doctor.ihs_id}</td><td><BooleanBadge value={doctor.attendance_status} /></td>
                  <td><Link className="detail-button" to={`/dokter/management/${doctor.pid}`}><Eye size={15} /> Detail</Link></td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="records-pagination">
              <p>Menampilkan <strong>{meta?.from ?? 0}–{meta?.to ?? 0}</strong> dari <strong>{meta?.total ?? 0}</strong> dokter</p>
              <div><button disabled={!meta || meta.current_page <= 1} onClick={() => changePage(page - 1)} aria-label="Halaman sebelumnya"><ChevronLeft size={16} /></button>{pages.map((value) => <button key={value} className={value === meta?.current_page ? 'active' : ''} onClick={() => changePage(value)}>{value}</button>)}<button disabled={!meta || meta.current_page >= meta.last_page} onClick={() => changePage(page + 1)} aria-label="Halaman berikutnya"><ChevronRight size={16} /></button></div>
            </div>
          </>}
      </section>
    </PageContainer>
  )
}

function BooleanBadge({ value }: { value: string }) {
  const tone = value === 'Ya' ? 'yes' : value === 'Tidak' ? 'no' : 'neutral'
  return <span className={`boolean-badge boolean-badge--${tone}`}>{value}</span>
}

function paginationWindow(current: number, last: number): number[] {
  const start = Math.max(1, Math.min(current - 2, last - 4))
  const end = Math.min(last, start + 4)
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index)
}
