import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { DoctorDetailPage } from './pages/doctors/DoctorDetailPage'
import { DoctorManagementPage } from './pages/doctors/DoctorManagementPage'
import { HomePage } from './pages/home/HomePage'
import { MedicalRecordDetailPage } from './pages/medical-records/MedicalRecordDetailPage'
import { MedicalRecordsPage } from './pages/medical-records/MedicalRecordsPage'
import { DataMedisPage } from './pages/medical-records/DataMedisPage'
import { MedicalVisitDetailPage } from './pages/medical-records/MedicalVisitDetailPage'
import { MasterDepartmentsPage } from './pages/master-data/MasterDepartmentsPage'
import { UserManagementPage } from './pages/users/UserManagementPage'
import { USER_ADMIN_USERNAME } from './routes/navigation'
import { authApi, type AuthUser } from './services/auth'

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    authApi.me()
      .then((response) => setUser(response.user))
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false))
  }, [])

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }

  if (checkingSession) {
    return <div className="auth-loading"><span /><p>Memverifikasi sesi aman...</p></div>
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  return (
    <Routes>
      <Route element={<AppLayout user={user} onLogout={logout} />}>
        <Route index element={<HomePage />} />
        <Route path="rekam-medis" element={<MedicalRecordsPage />} />
        <Route path="rekam-medis/:pid" element={<MedicalRecordDetailPage />} />
        <Route path="rekam-medis/data-medis" element={<DataMedisPage />} />
        <Route path="rekam-medis/data-medis/kunjungan/:regpid" element={<MedicalVisitDetailPage />} />
        <Route path="dokter/management" element={<DoctorManagementPage />} />
        <Route path="dokter/management/:pid" element={<DoctorDetailPage />} />
        <Route path="master-data/bagian" element={<MasterDepartmentsPage />} />
        <Route path="user" element={<UserAdminGuard username={user.login_name}><UserManagementPage /></UserAdminGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function UserAdminGuard({ username, children }: { username: string; children: ReactNode }) {
  if (username !== USER_ADMIN_USERNAME) return <Navigate to="/" replace />
  return children
}
