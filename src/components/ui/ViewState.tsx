import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react'

type Props = { title: string; description: string; icon?: LucideIcon }
function State({ title, description, icon: Icon = Inbox, kind = '' }: Props & { kind?: string }) {
  return <div className={`view-state ${kind}`}><Icon size={24} /><strong>{title}</strong><p>{description}</p></div>
}
export const EmptyState = (props: Props) => <State {...props} />
export const ErrorState = (props: Omit<Props, 'icon'>) => <State {...props} icon={AlertTriangle} kind="view-state--error" />
export const LoadingState = ({ title = 'Memuat data', description = 'Mohon tunggu sebentar.' }: Partial<Props>) => <State title={title} description={description} icon={LoaderCircle} kind="view-state--loading" />
