import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CreditCard, User, Bell, Shield } from 'lucide-react'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  const settingsCategories = [
    {
      title: 'Billing & Subscription',
      description: 'Manage your subscription, payment methods, and billing history',
      icon: CreditCard,
      href: '/dashboard/settings/billing',
    },
    {
      title: 'Account',
      description: 'Update your email, password, and account preferences',
      icon: User,
      href: '/dashboard/settings/account',
    },
    {
      title: 'Notifications',
      description: 'Configure email notifications and alerts',
      icon: Bell,
      href: '/dashboard/settings/notifications',
    },
    {
      title: 'Security',
      description: 'Two-factor authentication and security settings',
      icon: Shield,
      href: '/dashboard/settings/security',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsCategories.map((category) => (
          <Link key={category.href} href={category.href}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <category.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
