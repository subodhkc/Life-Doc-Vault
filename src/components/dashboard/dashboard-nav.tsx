'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Shield, FileText, Calendar, Package, Settings, LogOut, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DashboardNavProps {
  user: {
    name?: string | null
    email?: string | null
    tier?: string
  }
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Timeline', href: '/dashboard/timeline', icon: Calendar },
  { name: 'Packets', href: '/dashboard/packets', icon: Package },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Life-Doc-Vault</span>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{user.name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {user.tier && (
            <div className="inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {user.tier}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={() => signOut({ callbackUrl: '/' })}>
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
