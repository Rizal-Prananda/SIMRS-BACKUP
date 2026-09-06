import { Database, LockKeyhole, Radar, Server, ShieldCheck } from 'lucide-react'
import { PageContainer } from '../../components/ui/PageContainer'
import { StatusBadge } from '../../components/ui/StatusBadge'

export function HomePage() {
  return (
    <PageContainer className="home-page">
      <section className="hero-panel">
        <div className="hero-orb hero-orb--one" /><div className="hero-orb hero-orb--two" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-content">
          <StatusBadge tone="healthy">Infrastructure protection active</StatusBadge>
          <p className="hero-kicker">SIMRS Oetomo · IT Infrastructure</p>
          <h2>Data tetap terjaga.<br /><span>Sistem selalu siap.</span></h2>
          <p className="hero-description">Pusat kendali terpadu untuk menjaga ketersediaan, keamanan, dan kesiapan infrastruktur data SIMRS.</p>
          <div className="hero-actions">
            <span className="read-only-note"><LockKeyhole size={16} /> Read-only monitoring</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit--outer"><span className="orbit-node orbit-node--a"><Radar size={16} /></span><span className="orbit-node orbit-node--b"><Database size={16} /></span></div>
          <div className="orbit orbit--inner" />
          <div className="server-stack server-stack--back"><i /><i /><i /></div>
          <div className="server-stack server-stack--front"><i /><i /><i /></div>
          <div className="shield-core"><ShieldCheck size={56} strokeWidth={1.35} /></div>
          <div className="data-line data-line--one" /><div className="data-line data-line--two" />
        </div>
        <div className="hero-footer">
          <span><ShieldCheck size={17} /> Secure by design</span>
          <span><Server size={17} /> Infrastructure visibility</span>
          <span><Database size={17} /> Data readiness</span>
        </div>
      </section>
    </PageContainer>
  )
}
