import { Construction } from 'lucide-react'
import { PageContainer } from '../../components/ui/PageContainer'
import type { RouteItem } from '../../routes/navigation'

export function PlaceholderPage({ item }: { item: RouteItem }) {
  const Icon = item.icon
  return (
    <PageContainer>
      <div className="page-heading"><div><p>SIMRS DataGuard</p><h2>{item.label}</h2><span>{item.description}</span></div></div>
      <section className="placeholder-panel">
        <div className="placeholder-icon"><Icon size={28} /></div>
        <div><span className="placeholder-label"><Construction size={14} /> Tahap berikutnya</span><h3>Modul {item.label} telah disiapkan</h3><p>Struktur halaman dan routing sudah tersedia. Fungsi monitoring akan ditambahkan pada tahap implementasi selanjutnya.</p></div>
      </section>
    </PageContainer>
  )
}
