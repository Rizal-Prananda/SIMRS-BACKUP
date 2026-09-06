import { ChevronLeft, ChevronRight, Eye, Search, ShieldCheck, UsersRound, X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '../../components/ui/PageContainer'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ViewState'
import { medicalRecordsApi, type PaginationMeta, type PatientListItem } from '../../services/medicalRecords'

export function MedicalRecordsPage() {
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [draftSearch, setDraftSearch] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    medicalRecordsApi.list(search, page, perPage)
      .then((response) => {
        if (!active) return
        setPatients(response.data)
        setMeta(response.meta)
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [search, page, perPage])

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    const nextSearch = draftSearch.trim()
    if (nextSearch === search && page === 1) return
    setLoading(true)
    setError(false)
    setPage(1)
    setSearch(nextSearch)
  }

  function clearSearch() {
    setDraftSearch('')
    if (search === '' && page === 1) return
    setLoading(true)
    setError(false)
    setSearch('')
    setPage(1)
  }

  const pages = paginationWindow(meta?.current_page ?? 1, meta?.last_page ?? 1)

  function changePage(nextPage: number) {
    setLoading(true)
    setError(false)
    setPage(nextPage)
  }

  return (
    <PageContainer className="medical-records-page">
      <header className="module-heading">
        <div>
          <p>Data Pasien</p>
          <h2>Rekam Medis</h2>
          <span>Informasi identitas pasien dari SIMRS dalam mode aman baca-saja.</span>
        </div>
        <div className="readonly-pill"><ShieldCheck size={16} /> 100% Read-only</div>
      </header>

      <section className="records-panel">
        <div className="records-toolbar">
          <form className="records-search" onSubmit={submitSearch}>
            <Search size={17} />
            <input value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Cari No. RM atau nama pasien..." aria-label="Cari No. RM atau nama pasien" />
            {draftSearch && <button type="button" onClick={clearSearch} aria-label="Hapus pencarian"><X size={15} /></button>}
            <button type="submit" className="search-submit">Cari</button>
          </form>
          <label className="per-page">Tampilkan
            <select value={perPage} onChange={(event) => { setLoading(true); setError(false); setPerPage(Number(event.target.value)); setPage(1) }}>
              {[10, 25, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            data
          </label>
        </div>

        {loading ? <LoadingState title="Memuat data pasien" description="Mengambil data terbaru dari SIMRS..." /> :
          error ? <ErrorState title="Data pasien gagal dimuat" description="Periksa koneksi SIMRS lalu muat ulang halaman." /> :
          patients.length === 0 ? <EmptyState title="Data pasien tidak ditemukan" description={search ? 'Coba gunakan No. RM atau nama pasien yang berbeda.' : 'Belum ada data pasien yang dapat ditampilkan.'} icon={UsersRound} /> : (
            <>
              <div className="records-table-wrap">
                <table className="records-table">
                  <thead><tr><th>No. RM</th><th>Nama Pasien</th><th>Tanggal Lahir</th><th>Jenis Kelamin</th><th>Tempat Lahir</th><th>No. Telepon</th><th>Alamat</th><th>Aksi</th></tr></thead>
                  <tbody>{patients.map((patient) => (
                    <tr key={patient.pid}>
                      <td><span className="rm-number">{patient.medical_record_number}</span></td>
                      <td><strong>{patient.name}</strong><small>PID {patient.pid}</small></td>
                      <td>{patient.date_of_birth}</td><td>{patient.sex}</td><td>{patient.birth_place}</td><td>{patient.phone}</td>
                      <td className="address-cell" title={patient.address}>{patient.address}</td>
                      <td><Link className="detail-button" to={`/rekam-medis/${patient.pid}`}><Eye size={15} /> Lihat Detail</Link></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="records-pagination">
                <p>Menampilkan <strong>{meta?.from ?? 0}–{meta?.to ?? 0}</strong> dari <strong>{meta?.total ?? 0}</strong> pasien</p>
                <div>
                  <button disabled={!meta || meta.current_page <= 1} onClick={() => changePage(page - 1)} aria-label="Halaman sebelumnya"><ChevronLeft size={16} /></button>
                  {pages.map((value) => <button key={value} className={value === meta?.current_page ? 'active' : ''} onClick={() => changePage(value)}>{value}</button>)}
                  <button disabled={!meta || meta.current_page >= meta.last_page} onClick={() => changePage(page + 1)} aria-label="Halaman berikutnya"><ChevronRight size={16} /></button>
                </div>
              </div>
            </>
          )}
      </section>
    </PageContainer>
  )
}

function paginationWindow(current: number, last: number): number[] {
  const start = Math.max(1, Math.min(current - 2, last - 4))
  const end = Math.min(last, start + 4)
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index)
}
