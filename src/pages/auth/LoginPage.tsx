import { useEffect, useState, type FormEvent } from 'react'
import { Activity, ArrowRight, Database, Eye, EyeOff, LoaderCircle, LockKeyhole, Server, ShieldCheck } from 'lucide-react'
import { AuthApiError, authApi, type AuthUser } from '../../services/auth'

export function LoginPage({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'SIMRS - Development Read Only By RP'
    return () => { document.title = 'SIMRS - Development Read Only By RP' }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await authApi.login(username.trim(), password)
      onLogin(response.user)
    } catch (requestError) {
      setError(requestError instanceof AuthApiError ? requestError.message : 'Tidak dapat terhubung ke layanan autentikasi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase" aria-hidden="true">
        <div className="login-showcase__grid" />
        <div className="login-brand"><span><ShieldCheck size={24} /></span><div><strong>SIMRS</strong><b>DataGuard</b></div></div>
        <div className="login-showcase__content">
          <span className="login-eyebrow"><i /> Infrastructure Protection</span>
          <h2>Kendali infrastruktur<br />dalam satu ruang aman.</h2>
          <p>Akses terproteksi untuk tim IT dalam menjaga ketersediaan dan kesiapan data SIMRS.</p>
        </div>
        <div className="login-network">
          <span><Server size={19} /></span><i /><strong><ShieldCheck size={34} /></strong><i /><span><Database size={19} /></span>
        </div>
        <div className="login-showcase__footer"><Activity size={16} /> Secure access gateway</div>
      </section>

      <section className="login-form-area">
        <div className="login-panel">
          <div className="login-panel__icon"><LockKeyhole size={23} /></div>
          <p className="login-panel__kicker">Selamat datang kembali</p>
          <h1>Masuk ke DataGuard</h1>
          <p className="login-panel__intro">Gunakan akun SIMRS Anda untuk melanjutkan.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" autoComplete="username" autoFocus value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Masukkan username" disabled={submitting} />
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" disabled={submitting} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div className="login-error" role="alert">{error}</div>}
            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? <><LoaderCircle className="spin" size={18} /> Memverifikasi...</> : <>Masuk <ArrowRight size={18} /></>}
            </button>
          </form>
          <div className="login-security"><ShieldCheck size={15} /> Kredensial diverifikasi langsung melalui sistem SIMRS.</div>
        </div>
      </section>
    </main>
  )
}
