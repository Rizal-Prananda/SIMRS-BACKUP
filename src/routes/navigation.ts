import type { LucideIcon } from 'lucide-react'
import { Building2, Database, FileHeart, House, Stethoscope, UserRoundCog, Users, UsersRound } from 'lucide-react'

export const USER_ADMIN_USERNAME = 'rizal.prananda'

export type RouteItem = {
  label: string
  path: string
  description: string
  icon: LucideIcon
  adminOnly?: boolean
  children?: Array<{ label: string; path: string; description: string; icon: LucideIcon }>
}

export const routeItems: RouteItem[] = [
  { label: 'Home', path: '/', icon: House, description: 'Pusat kendali SIMRS DataGuard' },
  {
    label: 'Rekam Medis',
    path: '/rekam-medis',
    icon: Stethoscope,
    description: 'Data pasien dan catatan medis SIMRS dalam mode baca-saja',
    children: [
      { label: 'Data Pasien', path: '/rekam-medis', icon: UsersRound, description: 'Daftar data pasien SIMRS' },
      { label: 'Data Medis', path: '/rekam-medis/data-medis', icon: FileHeart, description: 'Riwayat kunjungan dan SOAP pasien SIMRS' },
    ],
  },
  {
    label: 'Dokter',
    path: '/dokter/management',
    icon: UserRoundCog,
    description: 'Direktori dokter SIMRS dalam mode baca-saja',
    children: [
      { label: 'Management', path: '/dokter/management', icon: UserRoundCog, description: 'Management data dokter SIMRS' },
    ],
  },
  {
    label: 'Master Data',
    path: '/master-data/bagian',
    icon: Database,
    description: 'Viewer data master SIMRS dalam mode baca-saja',
    children: [
      { label: 'Master Bagian', path: '/master-data/bagian', icon: Building2, description: 'Data master bagian dan unit pelayanan SIMRS' },
    ],
  },
  { label: 'User', path: '/user', icon: Users, description: 'Kelola akun pengguna sistem', adminOnly: true },
]

export function currentRoute(pathname: string) {
  for (const item of routeItems) {
    const child = item.children?.find((entry) => pathname === entry.path)
      ?? item.children?.filter((entry) => pathname.startsWith(`${entry.path}/`)).sort((a, b) => b.path.length - a.path.length)[0]
    if (child) return child
    if (pathname === item.path) return item
  }
  return routeItems[0]
}
