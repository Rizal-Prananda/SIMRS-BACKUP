import { ArrowLeft, BriefcaseBusiness, CalendarDays, ClipboardClock, Contact, History, Mail, MapPin, Phone, ShieldCheck, Stethoscope, UserRound } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '../../components/ui/PageContainer'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ViewState'
import { doctorsApi, type DoctorDepartment, type DoctorDetail, type DoctorSchedule } from '../../services/doctors'

type Tab = 'profile' | 'assignments' | 'schedules' | 'history'

export function DoctorDetailPage() {
  const { pid = '' } = useParams()
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null)
  const [departments, setDepartments] = useState<DoctorDepartment[]>([])
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([doctorsApi.detail(pid), doctorsApi.departments(pid), doctorsApi.schedules(pid)])
      .then(([profile, assignments, scheduleRows]) => {
        if (!active) return
        setDoctor(profile.data)
        setDepartments(assignments.data)
        setSchedules(scheduleRows.data)
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [pid])

  return (
    <PageContainer className="doctor-detail-page">
      <Link to="/dokter/management" className="back-link"><ArrowLeft size={16} /> Kembali ke Dokter Management</Link>
      {loading ? <LoadingState title="Memuat detail dokter" description="Mengambil profil, penugasan, dan jadwal dari SIMRS..." /> :
        error || !doctor ? <ErrorState title="Detail dokter gagal dimuat" description="Data tidak ditemukan atau koneksi SIMRS sedang bermasalah." /> :
        <DoctorDetailView doctor={doctor} departments={departments} schedules={schedules} activeTab={activeTab} onTab={setActiveTab} />}
    </PageContainer>
  )
}

function DoctorDetailView({ doctor, departments, schedules, activeTab, onTab }: { doctor: DoctorDetail; departments: DoctorDepartment[]; schedules: DoctorSchedule[]; activeTab: Tab; onTab: (tab: Tab) => void }) {
  const primaryDepartment = departments[0]
  return <>
    <section className="doctor-hero">
      <div className="doctor-avatar"><UserRound size={34} /></div>
      <div className="doctor-hero__identity"><span>Profil Dokter</span><h2>{doctor.identity.name}</h2><p><Stethoscope size={14} /> {primaryDepartment?.name ?? '-'} <i /> {primaryDepartment?.is_specialist === 'Ya' ? 'Spesialis' : 'Dokter'}</p></div>
      <div className="doctor-hero__codes"><span>KODE DOKTER</span><strong>{doctor.doctor_code}</strong><small>PID {doctor.identity.pid}</small></div>
      <span className={`doctor-active-badge ${doctor.is_active ? 'doctor-active-badge--yes' : 'doctor-active-badge--no'}`}>{doctor.is_active ? 'Aktif' : 'Nonaktif'}</span>
      <div className="doctor-readonly"><ShieldCheck size={14} /> Read-only</div>
    </section>

    <nav className="doctor-tabs" aria-label="Detail dokter">
      <TabButton active={activeTab === 'profile'} onClick={() => onTab('profile')} icon={<Contact size={16} />}>Profil</TabButton>
      <TabButton active={activeTab === 'assignments'} onClick={() => onTab('assignments')} icon={<BriefcaseBusiness size={16} />}>Penugasan</TabButton>
      <TabButton active={activeTab === 'schedules'} onClick={() => onTab('schedules')} icon={<CalendarDays size={16} />}>Jadwal</TabButton>
      <TabButton active={activeTab === 'history'} onClick={() => onTab('history')} icon={<History size={16} />}>Riwayat</TabButton>
    </nav>

    {activeTab === 'profile' && <div className="doctor-profile-grid">
      <DetailCard icon={<Contact size={18} />} title="Informasi Dokter">
        <Info label="Nama Lengkap" value={doctor.identity.name} /><Info label="PID" value={String(doctor.identity.pid)} />
        <Info label="Jenis Kelamin" value={doctor.identity.sex} /><Info label="Tempat Lahir" value={doctor.identity.birth_place} />
        <Info label="Tanggal Lahir" value={doctor.identity.date_of_birth} /><Info label="Agama" value={doctor.identity.religion} />
        <Info label="Status Pernikahan" value={doctor.identity.marital_status} /><Info icon={<Phone size={14} />} label="No. Telepon" value={doctor.identity.phone} />
        <Info icon={<Mail size={14} />} label="Email" value={doctor.identity.email} /><Info wide icon={<MapPin size={14} />} label="Alamat" value={doctor.identity.address} />
      </DetailCard>
      <DetailCard icon={<BriefcaseBusiness size={18} />} title="Informasi Kepegawaian">
        <Info label="Employee ID" value={doctor.employee.empid} /><Info label="Nomor Dokter" value={doctor.employee.doctor_number} />
        <Info label="SIP" value={doctor.employee.sip} /><Info label="Kode DPJP / BPJS" value={doctor.employee.kd_dpjp} />
        <Info label="Kode Prefix" value={doctor.employee.prefix_code} /><Info label="Jabatan" value={doctor.employee.job_title} />
        <Info label="Status Kerja" value={doctor.employee.working_status} /><Info label="Discharged" value={doctor.employee.is_discharged} />
        <Info label="Tanggal Bergabung" value={doctor.employee.join_date} /><Info label="Tanggal Keluar" value={doctor.employee.exit_date} />
        <Info wide label="IHS ID Tenaga Kesehatan" value={doctor.identity.ihs_id} />
      </DetailCard>
      <section className="detail-card doctor-units-card"><header><span><Stethoscope size={18} /></span><h3>Unit / Poli</h3></header><DepartmentList departments={departments} /></section>
    </div>}

    {activeTab === 'assignments' && <section className="detail-card doctor-tab-card"><header><span><BriefcaseBusiness size={18} /></span><h3>Penugasan Dokter</h3></header><DepartmentList departments={departments} /></section>}

    {activeTab === 'schedules' && <section className="detail-card doctor-tab-card"><header><span><CalendarDays size={18} /></span><h3>Jadwal Praktik</h3></header>{schedules.length === 0 ? <EmptyState title="Jadwal belum tersedia" description="Tidak ada jadwal dokter yang ditemukan di SIMRS." icon={ClipboardClock} /> : <div className="records-table-wrap"><table className="records-table schedule-table"><thead><tr><th>Hari</th><th>Jam Mulai</th><th>Jam Selesai</th><th>Poli</th><th>Ruang</th><th>BPJS</th><th>Kuota HFIS</th></tr></thead><tbody>{schedules.map((schedule) => <tr key={schedule.dsid}><td><strong>{schedule.day}</strong></td><td>{schedule.start_time}</td><td>{schedule.end_time}</td><td>{schedule.department}</td><td>{schedule.room}</td><td><BooleanBadge value={schedule.bpjs} /></td><td>{schedule.hfis_quota}</td></tr>)}</tbody></table></div>}</section>}

    {activeTab === 'history' && <section className="detail-card doctor-tab-card doctor-history"><History size={28} /><h3>Riwayat</h3><p>Riwayat aktivitas dokter akan ditampilkan di sini.</p></section>}
  </>
}

function DepartmentList({ departments }: { departments: DoctorDepartment[] }) {
  if (departments.length === 0) return <EmptyState title="Penugasan belum tersedia" description="Tidak ada relasi unit atau poli untuk dokter ini." icon={Stethoscope} />
  return <div className="department-list">{departments.map((department) => <article key={department.did}><div><strong>{department.name}</strong><span>Kode: {department.code} · Lokasi: {department.location}</span></div><div><BooleanBadge value={department.is_specialist} label="Spesialis" /><span className={`assignment-status ${department.is_active ? 'assignment-status--active' : 'assignment-status--inactive'}`}>{department.is_active ? 'Aktif' : 'Nonaktif'}</span></div></article>)}</div>
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return <button type="button" className={active ? 'active' : ''} onClick={onClick}>{icon}{children}</button>
}

function DetailCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <section className="detail-card"><header><span>{icon}</span><h3>{title}</h3></header><div className="detail-card__body">{children}</div></section>
}

function Info({ label, value, icon, wide = false }: { label: string; value: string; icon?: ReactNode; wide?: boolean }) {
  return <div className={`info-item ${wide ? 'info-item--wide' : ''}`}><span>{icon}{label}</span><strong>{value || '-'}</strong></div>
}

function BooleanBadge({ value, label }: { value: string; label?: string }) {
  const tone = value === 'Ya' ? 'yes' : value === 'Tidak' ? 'no' : 'neutral'
  return <span className={`boolean-badge boolean-badge--${tone}`}>{label ? `${label}: ${value}` : value}</span>
}
