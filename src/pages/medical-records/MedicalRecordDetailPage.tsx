import { ArrowLeft, BriefcaseBusiness, CalendarDays, Contact, HeartPulse, Mail, MapPin, Phone, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '../../components/ui/PageContainer'
import { ErrorState, LoadingState } from '../../components/ui/ViewState'
import { medicalRecordsApi, type PatientDetail } from '../../services/medicalRecords'

export function MedicalRecordDetailPage() {
  const { pid = '' } = useParams()
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    medicalRecordsApi.detail(pid)
      .then((response) => active && setPatient(response.data))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [pid])

  return (
    <PageContainer className="medical-detail-page">
      <Link to="/rekam-medis" className="back-link"><ArrowLeft size={16} /> Kembali ke daftar pasien</Link>
      {loading ? <LoadingState title="Memuat detail pasien" description="Mengambil identitas pasien dari SIMRS..." /> :
        error || !patient ? <ErrorState title="Detail pasien gagal dimuat" description="Data tidak ditemukan atau koneksi SIMRS sedang bermasalah." /> : <PatientDetailView patient={patient} />}
    </PageContainer>
  )
}

function PatientDetailView({ patient }: { patient: PatientDetail }) {
  return <>
    <section className="patient-hero">
      <div className="patient-avatar"><UserRound size={31} /></div>
      <div className="patient-hero__identity"><span>Identitas Pasien</span><h2>{patient.identity.name}</h2><p><CalendarDays size={14} /> {patient.identity.date_of_birth} · {patient.identity.age} <i /> {patient.identity.sex}</p></div>
      <div className="patient-rm"><span>NO. REKAM MEDIS</span><strong>{patient.medical_record_number}</strong><small>PID {patient.identity.pid}</small></div>
      <div className="readonly-pill"><ShieldCheck size={15} /> Read-only</div>
    </section>

    <div className="detail-grid">
      <DetailCard icon={<Contact size={18} />} title="Identitas Pasien">
        <Info label="PID" value={String(patient.identity.pid)} /><Info label="Nama Lengkap" value={patient.identity.name} />
        <Info label="Tempat Lahir" value={patient.identity.birth_place} /><Info label="Tanggal Lahir" value={patient.identity.date_of_birth} />
        <Info label="Umur" value={patient.identity.age} /><Info label="Jenis Kelamin" value={patient.identity.sex} />
        <Info label="Status Perkawinan" value={patient.identity.marital_status} /><Info label="Agama" value={patient.identity.religion} />
        <Info label="Kewarganegaraan" value={patient.identity.citizenship} />
      </DetailCard>
      <DetailCard icon={<MapPin size={18} />} title="Kontak & Alamat">
        <Info icon={<Phone size={14} />} label="Nomor Telepon" value={patient.contact.phone} />
        <Info icon={<Mail size={14} />} label="Email" value={patient.contact.email} />
        <Info wide icon={<MapPin size={14} />} label="Alamat Lengkap" value={patient.contact.address} />
      </DetailCard>
      <DetailCard icon={<UsersRound size={18} />} title="Penanggung Jawab">
        <Info label="Nama" value={patient.guardian.name} /><Info label="Hubungan" value={patient.guardian.relationship} />
        <Info label="Nomor Telepon" value={patient.guardian.phone} /><Info wide label="Alamat" value={patient.guardian.address} />
      </DetailCard>
      <DetailCard icon={<BriefcaseBusiness size={18} />} title="Data Tambahan">
        <Info label="Golongan Darah" value={patient.additional.blood_group} /><Info label="Pekerjaan" value={patient.additional.occupation} />
        <Info label="Pendidikan Terakhir" value={patient.additional.education} /><Info label="NIK" value={patient.additional.national_id} />
        <Info label="Jenis Identitas Lain" value={patient.additional.other_id_type} /><Info label="Nomor Identitas Lain" value={patient.additional.other_id_number} />
        <Info label="Pegawai" value={patient.additional.is_employee} /><Info label="Meninggal" value={patient.additional.is_dead} />
        <Info icon={<HeartPulse size={14} />} label="Daftar Hitam" value={patient.additional.is_blacklist} />
      </DetailCard>
    </div>
  </>
}

function DetailCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <section className="detail-card"><header><span>{icon}</span><h3>{title}</h3></header><div className="detail-card__body">{children}</div></section>
}

function Info({ label, value, icon, wide = false }: { label: string; value: string; icon?: ReactNode; wide?: boolean }) {
  return <div className={`info-item ${wide ? 'info-item--wide' : ''}`}><span>{icon}{label}</span><strong>{value || '-'}</strong></div>
}
