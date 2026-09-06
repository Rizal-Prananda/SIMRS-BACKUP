import type { ReactNode } from 'react'
type Tone = 'healthy' | 'warning' | 'critical' | 'neutral'
export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`status-badge status-badge--${tone}`}><i />{children}</span>
}
