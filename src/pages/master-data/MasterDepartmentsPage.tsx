import { ArrowDownAZ, Building2, ChevronLeft, ChevronRight, Search, ShieldCheck, X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { PageContainer } from '../../components/ui/PageContainer'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ViewState'
import { departmentsApi, type DepartmentListItem, type DepartmentPaginationMeta } from '../../services/departments'

export function MasterDepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentListItem[]>([])
  const [meta, setMeta] = useState<DepartmentPaginationMeta | null>(null)
  const [draftSearch, setDraftSearch] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sort, setSort] = useState('code')
  const [direction, setDirection] = useState('asc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    departmentsApi.list(search, page, limit, sort, direction)
      .then((response) => {
        if (!active) return
        setDepartments(response.data)
        setMeta(response.meta)
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [search, page, limit, sort, direction])

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
    setSearch('')
    setPage(1)
  }

  function changePage(nextPage: number) {
    if (nextPage === page) return
    prepareLoad()
    setPage(nextPage)
  }

  const pages = paginationWindow(meta?.current_page ?? 1, meta?.last_page ?? 1)

  return (
    <PageContainer className="master-departments-page">
      <header className="module-heading">
        <div><p>Master Data</p><h2>Master Bagian</h2><span>Data master bagian/unit pelayanan SIMRS</span></div>
        <div className="readonly-pill"><ShieldCheck size={16} /> 100% Read-only</div>
      </header>

      <section className="records-panel">
        <div className="records-toolbar master-toolbar">
          <form className="records-search" onSubmit={submitSearch}>
            <Search size={17} />
            <input value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Cari kode atau nama bagian..." aria-label="Cari master bagian" />
            {draftSearch && <button type="button" onClick={clearSearch} aria-label="Hapus pencarian"><X size={15} /></button>}
            <button type="submit" className="search-submit">Cari</button>
          </form>
          <div className="doctor-filters">
            <label className="compact-select"><ArrowDownAZ size={15} /><span>Urutkan</span>
              <select value={`${sort}:${direction}`} onChange={(event) => { prepareLoad(); const [nextSort, nextDirection] = event.target.value.split(':'); setSort(nextSort); setDirection(nextDirection); setPage(1) }}>
                <option value="code:asc">Kode A–Z</option><option value="code:desc">Kode Z–A</option>
                <option value="name:asc">Nama A–Z</option><option value="name:desc">Nama Z–A</option>
                <option value="short_name:asc">Nama Singkat A–Z</option><option value="short_name:desc">Nama Singkat Z–A</option>
                <option value="active:asc">Status Aktif</option><option value="deleted:asc">Status Delete</option>
              </select>
            </label>
            <label className="per-page">Tampilkan<select value={limit} onChange={(event) => { prepareLoad(); setLimit(Number(event.target.value)); setPage(1) }}>{[10, 25, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}</select>data</label>
          </div>
        </div>

        {loading ? <LoadingState title="Memuat master bagian" description="Mengambil data department dari SIMRS..." /> :
          error ? <ErrorState title="Master bagian gagal dimuat" description="Periksa koneksi SIMRS lalu muat ulang halaman." /> :
          departments.length === 0 ? <EmptyState title="Master bagian tidak ditemukan" description={search ? 'Coba gunakan kode atau nama bagian yang berbeda.' : 'Belum ada data department yang dapat ditampilkan.'} icon={Building2} /> : <>
            <div className="records-table-wrap">
              <table className="records-table master-departments-table">
                <thead><tr><th>Kode</th><th>Nama Bagian</th><th>Nama Singkat</th><th>Lokasi</th><th>Spesialis</th><th>Status Aktif</th><th>Status Delete</th></tr></thead>
                <tbody>{departments.map((department) => <tr key={department.did}>
                  <td><span className="department-code">{department.code}</span><small>DID {department.did}</small></td>
                  <td><strong>{department.name}</strong></td><td>{department.short_name}</td><td>{department.location}</td>
                  <td><StateBadge value={department.is_specialist} /></td>
                  <td><StateBadge value={department.active_status} /></td>
                  <td><StateBadge value={department.delete_status} /></td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="records-pagination">
              <p>Menampilkan <strong>{meta?.from ?? 0}–{meta?.to ?? 0}</strong> dari <strong>{meta?.total ?? 0}</strong> bagian</p>
              <div><button disabled={!meta || meta.current_page <= 1} onClick={() => changePage(page - 1)} aria-label="Halaman sebelumnya"><ChevronLeft size={16} /></button>{pages.map((value) => <button key={value} className={value === meta?.current_page ? 'active' : ''} onClick={() => changePage(value)}>{value}</button>)}<button disabled={!meta || meta.current_page >= meta.last_page} onClick={() => changePage(page + 1)} aria-label="Halaman berikutnya"><ChevronRight size={16} /></button></div>
            </div>
          </>}
      </section>
    </PageContainer>
  )
}

function StateBadge({ value }: { value: string }) {
  const positive = value === 'Aktif' || value === 'Ya' || value === 'Normal'
  const negative = value === 'Nonaktif' || value === 'Deleted'
  return <span className={`master-status ${positive ? 'master-status--positive' : negative ? 'master-status--negative' : 'master-status--empty'}`}>{value}</span>
}

function paginationWindow(current: number, last: number): number[] {
  const start = Math.max(1, Math.min(current - 2, last - 4))
  const end = Math.min(last, start + 4)
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index)
}
