'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Zap, LayoutDashboard, Upload, FileText, Settings, TrendingDown, BarChart3, Users } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Importer', href: '/dashboard/upload', icon: Upload },
  { name: 'Émissions', href: '/dashboard/emissions', icon: BarChart3 },
  { name: 'Recommandations', href: '/dashboard/recommendations', icon: TrendingDown },
  { name: 'Rapports', href: '/dashboard/reports', icon: FileText },
  { name: 'Équipe', href: '/dashboard/team', icon: Users },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">AirNex</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}











