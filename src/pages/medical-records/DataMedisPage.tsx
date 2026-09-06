import { CalendarRange, ChevronRight, CircleUserRound, Eye, Search, ShieldCheck, UserRoundSearch, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageContainer } from '../../components/ui/PageContainer'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ViewState'
import { medicalRecordsApi, type PatientListItem, type PatientSummary, type PatientVisit } from '../../services/medicalRecords'

export function DataMedisPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialPid = Number(searchParams.get('pid'))
  const [selectedPid, setSelectedPid] = useState<number | null>(Number.isInteger(initialPid) && initialPid > 0 ? initialPid : null)
  const [draftSearch, setDraftSearch] = useState('')
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [patient, setPatient] = useState<PatientSummary | null>(null)
  const [visits, setVisits] = useState<PatientVisit[]>([])
  const [visitsLoading, setVisitsLoading] = useState(Boolean(selectedPid))
  const [visitsError, setVisitsError] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [period, setPeriod] = useState({ from: '', to: '' })
  const [draftVisitSearch, setDraftVisitSearch] = useState('')
  const [visitSearch, setVisitSearch] = useState('')

  const normalizedVisitSearch = visitSearch.trim().toLowerCase()
  const filteredVisits = visits.filter((visit) => visit.registration_number.toLowerCase().includes(normalizedVisitSearch))

  useEffect(() => {
    if (!selectedPid) return
    let active = true
    medicalRecordsApi.visits(selectedPid, period.from, period.to)
      .then((response) => {
        if (!active) return
        setPatient(response.data.patient)
        setVisits(response.data.visits)
      })
      .catch(() => active && setVisitsError(true))
      .finally(() => active && setVisitsLoading(false))
    return () => { active = false }
  }, [selectedPid, period])

  async function searchPatients(event: FormEvent) {
    event.preventDefault()
    const search = draftSearch.trim()
    if (!search) {
      setPatients([])
      return
    }
    setSearching(true)
    setSearchError(false)
    try {
      const response = await medicalRecordsApi.patients(search)
      setPatients(response.data)
    } catch {
      setSearchError(true)
    } finally {
      setSearching(false)
    }
  }

  function selectPatient(nextPatient: PatientListItem) {
    setSelectedPid(nextPatient.pid)
    setPatient(null)
    setVisits([])
    setVisitsLoading(true)
    setVisitsError(false)
    setPatients([])
    setSearchParams({ pid: String(nextPatient.pid) })
  }

  function resetPatient() {
    setSelectedPid(null)
    setPatient(null)
    setVisits([])
    setPatients([])
    setDraftVisitSearch('')
    setVisitSearch('')
    setSearchParams({})
  }

  function applyPeriod(event: FormEvent) {
    event.preventDefault()
    if (dateFrom && dateTo && dateFrom > dateTo) return
    setVisitsLoading(true)
    setVisitsError(false)
    setPeriod({ from: dateFrom, to: dateTo })
  }

  function searchVisits(event: FormEvent) {
    event.preventDefault()
    setVisitSearch(draftVisitSearch.trim())
  }

  return (
    <PageContainer className="medical-records-page data-medis-page">
      <header className="module-heading">
        <div><p>Rekam Medis</p><h2>Data Medis</h2><span>Pilih pasien untuk melihat riwayat kunjungan dan catatan medisnya.</span></div>
        <div className="readonly-pill"><ShieldCheck size={16} /> 100% Read-only</div>
      </header>

      <section className="patient-finder-card">
        <div className="patient-finder-title"><span><UserRoundSearch size={19} /></span><div><h3>Pencarian Pasien</h3><p>Cari berdasarkan No. RM atau nama pasien</p></div></div>
        <form className="records-search patient-finder-search" onSubmit={searchPatients}>
          <Search size={17} />
          <input value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Masukkan No. RM atau nama pasien..." aria-label="Cari berdasarkan No RM atau nama" />
          {draftSearch && <button type="button" onClick={() => { setDraftSearch(''); setPatients([]) }} aria-label="Hapus pencarian"><X size={15} /></button>}
          <button type="submit" className="search-submit">Cari Pasien</button>
        </form>

        {searching ? <div className="patient-search-state"><span className="small-spinner" /> Mencari pasien...</div> :
          searchError ? <div className="patient-search-error">Pencarian pasien gagal. Periksa koneksi SIMRS.</div> :
          patients.length > 0 && <div className="patient-search-results">{patients.map((item) => <button type="button" key={item.pid} onClick={() => selectPatient(item)}>
            <span className="patient-result-avatar"><CircleUserRound size={20} /></span>
            <span><strong>{item.name}</strong><small>{item.medical_record_number} · {item.date_of_birth} · {item.sex}</small></span>
            <span>Pilih <ChevronRight size={15} /></span>
          </button>)}</div>}
      </section>

      {!selectedPid ? <section className="medical-flow-empty"><CircleUserRound size={29} /><h3>Belum ada pasien dipilih</h3><p>Cari pasien terlebih dahulu untuk menampilkan riwayat kunjungannya.</p></section> :
        visitsLoading && !patient ? <LoadingState title="Memuat riwayat pasien" description="Mengambil identitas dan kunjungan dari SIMRS..." /> :
        visitsError || !patient ? <ErrorState title="Riwayat pasien gagal dimuat" description="Data tidak ditemukan atau koneksi SIMRS sedang bermasalah." /> : <>
          <section className="selected-patient-card">
            <div className="selected-patient-main"><span><CircleUserRound size={28} /></span><div><small>PASIEN TERPILIH</small><h3>{patient.name}</h3><p>No. RM <strong>{patient.medical_record_number}</strong></p></div></div>
            <div className="selected-patient-facts"><PatientFact label="NIK" value={patient.national_id} /><PatientFact label="Tanggal Lahir" value={patient.date_of_birth} /><PatientFact label="Umur" value={patient.age} /><PatientFact label="Jenis Kelamin" value={patient.sex} /></div>
            <button type="button" className="change-patient-button" onClick={resetPatient}>Ganti Pasien</button>
          </section>

          <section className="visit-history-panel">
            <header><div><p>RIWAYAT PASIEN</p><h3>Riwayat Kunjungan</h3><span>{visitSearch ? `${filteredVisits.length} dari ${visits.length}` : visits.length} kunjungan ditemukan</span></div>
              <div className="visit-history-tools">
                <form className="visit-number-search" onSubmit={searchVisits}>
                  <Search size={15} />
                  <input value={draftVisitSearch} onChange={(event) => setDraftVisitSearch(event.target.value)} placeholder="Cari No. Registrasi..." aria-label="Cari No. Registrasi" />
                  {draftVisitSearch && <button type="button" className="visit-search-clear" onClick={() => { setDraftVisitSearch(''); setVisitSearch('') }} aria-label="Hapus pencarian No. Registrasi"><X size={14} /></button>}
                  <button type="submit" className="visit-search-submit">Cari</button>
                </form>
                <form className="visit-period-filter" onSubmit={applyPeriod}><CalendarRange size={16} /><label>Dari<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label>Sampai<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label><button type="submit">Terapkan</button></form>
              </div>
            </header>
            {visitsLoading ? <LoadingState title="Memuat kunjungan" description="Menerapkan periode riwayat pasien..." /> : visits.length === 0 ? <EmptyState title="Belum ada riwayat kunjungan" description="Tidak ada kunjungan pada pasien atau periode yang dipilih." icon={CalendarRange} /> : filteredVisits.length === 0 ? <EmptyState title="No. Registrasi tidak ditemukan" description={`Tidak ada kunjungan dengan No. Registrasi “${visitSearch}”.`} icon={Search} /> :
              <div className="records-table-wrap"><table className="records-table visit-history-table"><thead><tr><th>No. Registrasi</th><th>Tanggal Kunjungan</th><th>Bagian / Poli</th><th>Dokter</th><th>Penanggung</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filteredVisits.map((visit) => <tr key={visit.regpid}>
                <td><span className="registration-number">{visit.registration_number}</span><small>REGPID {visit.regpid}</small></td><td>{visit.visit_date}</td><td><strong>{visit.department}</strong></td><td>{visit.doctor}</td><td>{visit.guarantor}</td><td><VisitStatus value={visit.status} /></td>
                <td><Link className="detail-button" to={`/rekam-medis/data-medis/kunjungan/${visit.regpid}`}><Eye size={15} /> Lihat Kunjungan</Link></td>
              </tr>)}</tbody></table></div>}
          </section>
        </>}
    </PageContainer>
  )
}

function PatientFact({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>
}

function VisitStatus({ value }: { value: string }) {
  const style = value === 'Selesai' ? 'complete' : value === 'Deleted' ? 'deleted' : 'open'
  return <span className={`visit-status visit-status--${style}`}>{value}</span>
}
