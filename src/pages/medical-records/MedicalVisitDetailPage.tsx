import { ArrowLeft, CalendarClock, ClipboardList, FileHeart, FlaskConical, HeartPulse, History, ReceiptText, ShieldCheck, Stethoscope, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '../../components/ui/PageContainer'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ViewState'
import { medicalRecordsApi, type PatientSummary, type ProcedureBillingData, type SoapEntry, type VisitDetail } from '../../services/medicalRecords'

type DetailTab = 'soap' | 'diagnosis' | 'procedures' | 'supporting' | 'history'

export function MedicalVisitDetailPage() {
  const { regpid = '' } = useParams()
  const [patient, setPatient] = useState<PatientSummary | null>(null)
  const [visit, setVisit] = useState<VisitDetail | null>(null)
  const [soapEntries, setSoapEntries] = useState<SoapEntry[]>([])
  const [procedureBilling, setProcedureBilling] = useState<ProcedureBillingData>({ groups: [], summary: { gross_amount: 0, deduction_amount: 0, patient_amount: 0 } })
  const [activeTab, setActiveTab] = useState<DetailTab>('soap')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([medicalRecordsApi.visit(regpid), medicalRecordsApi.soap(regpid), medicalRecordsApi.procedures(regpid)])
      .then(([visitResponse, soapResponse, procedureResponse]) => {
        if (!active) return
        setPatient(visitResponse.data.patient)
        setVisit(visitResponse.data.visit)
        setSoapEntries(soapResponse.data)
        setProcedureBilling(procedureResponse.data)
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [regpid])

  return (
    <PageContainer className="visit-detail-page">
      <Link to={patient ? `/rekam-medis/data-medis?pid=${patient.pid}` : '/rekam-medis/data-medis'} className="back-link visit-back-link"><ArrowLeft size={16} /> Kembali ke Data Medis</Link>
      {loading ? <LoadingState title="Memuat detail kunjungan" description="Mengambil data registrasi dan SOAP dari SIMRS..." /> :
        error || !patient || !visit ? <ErrorState title="Detail kunjungan gagal dimuat" description="Data tidak ditemukan atau koneksi SIMRS sedang bermasalah." /> : <VisitDetailView patient={patient} visit={visit} soapEntries={soapEntries} procedureBilling={procedureBilling} activeTab={activeTab} onTab={setActiveTab} />}
    </PageContainer>
  )
}

function VisitDetailView({ patient, visit, soapEntries, procedureBilling, activeTab, onTab }: { patient: PatientSummary; visit: VisitDetail; soapEntries: SoapEntry[]; procedureBilling: ProcedureBillingData; activeTab: DetailTab; onTab: (tab: DetailTab) => void }) {
  return <>
    <section className="visit-patient-hero">
      <div className="visit-patient-avatar"><UserRound size={31} /></div>
      <div className="visit-patient-identity"><span>REKAM MEDIS PASIEN</span><h2>{patient.name}</h2><p>{patient.sex} · {patient.date_of_birth} / {patient.age}</p></div>
      <div className="visit-patient-numbers"><small>NO. REKAM MEDIS</small><strong>{patient.medical_record_number}</strong><span>NIK {patient.national_id}</span></div>
      <div className="visit-readonly"><ShieldCheck size={14} /> Read-only</div>
    </section>

    <section className="visit-information-card">
      <header><span><ClipboardList size={18} /></span><div><p>INFORMASI KUNJUNGAN</p><h3>{visit.registration_number}</h3></div><VisitStatus value={visit.status} /></header>
      <div className="visit-information-grid">
        <VisitInfo label="No. Registrasi" value={visit.registration_number} /><VisitInfo label="Tanggal Masuk" value={visit.admission_date} />
        <VisitInfo label="Tanggal Pulang" value={visit.discharge_date} /><VisitInfo label="Bagian / Poli" value={visit.department} />
        <VisitInfo label="Dokter Utama" value={visit.primary_doctor} /><VisitInfo label="Penanggung" value={visit.guarantor} />
        <VisitInfo label="Status Kunjungan" value={visit.status} /><VisitInfo label="No. SEP" value={visit.sep_number} />
      </div>
    </section>

    <nav className="visit-tabs" aria-label="Detail kunjungan">
      <TabButton active={activeTab === 'soap'} onClick={() => onTab('soap')} icon={<FileHeart size={16} />} label="Data Medis (SOAP)" />
      <TabButton active={activeTab === 'diagnosis'} onClick={() => onTab('diagnosis')} icon={<Stethoscope size={16} />} label="Diagnosis" />
      <TabButton active={activeTab === 'procedures'} onClick={() => onTab('procedures')} icon={<ClipboardList size={16} />} label="Tindakan" />
      <TabButton active={activeTab === 'supporting'} onClick={() => onTab('supporting')} icon={<FlaskConical size={16} />} label="Penunjang" />
      <TabButton active={activeTab === 'history'} onClick={() => onTab('history')} icon={<History size={16} />} label="Riwayat" />
    </nav>

    {activeTab === 'soap' ? <SoapPanel entries={soapEntries} /> : activeTab === 'procedures' ? <ProceduresPanel data={procedureBilling} /> : <section className="visit-tab-placeholder"><span><ClipboardList size={24} /></span><h3>Data {tabLabel(activeTab)}</h3><p>Mapping data pada tab ini akan ditambahkan setelah relasinya terverifikasi.</p></section>}
  </>
}

function ProceduresPanel({ data }: { data: ProcedureBillingData }) {
  if (data.groups.length === 0) return <section className="procedure-empty"><EmptyState title="Belum ada tindakan atau rincian biaya pada kunjungan ini." description="Belum ditemukan row biaya yang terhubung dengan registrasi ini." icon={ReceiptText} /></section>

  const itemCount = data.groups.reduce((total, group) => total + group.items.length, 0)

  return <section className="procedure-panel">
    <header className="procedure-panel-heading">
      <div><p>RINCIAN KUNJUNGAN</p><h3>Rincian Tindakan & Biaya</h3><span>{data.groups.length} kategori · {itemCount} rincian teragregasi dari billing SIMRS.</span></div>
      <span><ShieldCheck size={14} /> Read-only</span>
    </header>
    <div className="procedure-group-list">
      {data.groups.map((group) => <section className="procedure-group" key={group.category_id}>
        <header><div><span><ReceiptText size={17} /></span><div><small>KATEGORI BIAYA</small><h4>{group.category}</h4></div></div><strong>{group.items.length} rincian</strong></header>
        <div className="procedure-table-wrap">
          <table className="procedure-table">
            <thead><tr><th>Tindakan / Biaya</th><th>Periode</th><th>Tarif</th><th>Jumlah</th><th>Nilai</th><th>Potongan / Penjamin</th><th>Tagihan Pasien</th></tr></thead>
            <tbody>{group.items.map((item) => <tr key={`${item.description}-${item.unit_price}`}>
              <td><strong>{item.description}</strong></td>
              <td><span className="procedure-period"><CalendarClock size={13} />{item.period}</span></td>
              <td>{formatRupiah(item.unit_price)}</td>
              <td>{formatQuantity(item.quantity)}</td>
              <td>{formatRupiah(item.gross_amount)}</td>
              <td>{formatRupiah(item.deduction_amount)}</td>
              <td><strong className="procedure-patient-amount">{formatRupiah(item.patient_amount)}</strong></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>)}
    </div>
    <footer className="procedure-summary">
      <div><span>Nilai Kotor</span><strong>{formatRupiah(data.summary.gross_amount)}</strong></div>
      <div><span>Potongan / Penjamin</span><strong>{formatRupiah(data.summary.deduction_amount)}</strong></div>
      <div className="procedure-summary__total"><span>Total Tagihan Pasien</span><strong>{formatRupiah(data.summary.patient_amount)}</strong></div>
      <p>*Total akhir belum termasuk nilai pembulatan ketika pembayaran.</p>
    </footer>
  </section>
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value)
}

function SoapPanel({ entries }: { entries: SoapEntry[] }) {
  if (entries.length === 0) return <section className="soap-empty"><EmptyState title="Belum ada catatan SOAP pada kunjungan ini." description="Kunjungan ini tidak memiliki SOAP Dokter maupun SOAP Perawat." icon={FileHeart} /></section>

  const doctorCount = entries.filter((entry) => entry.entry_type === 'doctor').length
  const nurseCount = entries.filter((entry) => entry.entry_type === 'nurse').length

  return <section className="soap-panel">
    <header className="soap-panel-heading"><div><p>CATATAN MEDIS</p><h3>Data Medis (SOAP)</h3><span>{doctorCount} SOAP Dokter · {nurseCount} SOAP Perawat, diurutkan berdasarkan waktu pencatatan.</span></div><span><ShieldCheck size={14} /> Final · Read-only</span></header>
    <div className="soap-entry-list">{entries.map((entry, index) => <article className={`soap-entry soap-entry--${entry.entry_type}`} key={entry.entry_id}>
      <header><div className="soap-sequence">SOAP #{index + 1}</div><div className="soap-author"><span>{entry.entry_type === 'nurse' ? <HeartPulse size={15} /> : <Stethoscope size={15} />}</span><div><strong>{entry.author_name}</strong><small><CalendarClock size={13} /> {entry.recorded_at}</small></div></div><span className={`doctor-entry-badge doctor-entry-badge--${entry.entry_type}`}>{entry.role_label}</span></header>
      <div className="soap-grid">
        <SoapSection code="S" title="Subjective" value={entry.subjective} tone="blue" />
        <SoapSection code="O" title="Objective" value={entry.objective} tone="cyan" />
        <SoapSection code="A" title="Assessment" value={entry.assessment} tone="amber" />
        <SoapSection code="P" title="Planning" value={entry.planning} tone="green" />
      </div>
    </article>)}</div>
  </section>
}

function SoapSection({ code, title, value, tone }: { code: string; title: string; value: string; tone: string }) {
  return <section className={`soap-section soap-section--${tone}`}><header><span>{code}</span><h4>{title}</h4></header><p>{value || '-'}</p></section>
}

function VisitInfo({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value || '-'}</strong></div>
}

function VisitStatus({ value }: { value: string }) {
  const style = value === 'Selesai' ? 'complete' : value === 'Deleted' ? 'deleted' : 'open'
  return <span className={`visit-status visit-status--${style}`}>{value}</span>
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button type="button" className={active ? 'active' : ''} onClick={onClick}>{icon}{label}</button>
}

function tabLabel(tab: DetailTab) {
  return tab === 'diagnosis' ? 'Diagnosis' : tab === 'procedures' ? 'Tindakan' : tab === 'supporting' ? 'Penunjang' : 'Riwayat'
}
