import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { FileText, Calendar, Package, HardDrive } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      documents: {
        where: { isDeleted: false },
      },
      packets: true,
    },
  })

  const stats = [
    {
      title: 'Total Documents',
      value: user?.documentCount || 0,
      icon: FileText,
      description: 'Uploaded files',
    },
    {
      title: 'Storage Used',
      value: formatBytes(Number(user?.storageUsed || 0)),
      icon: HardDrive,
      description: getTierLimit(user?.tier),
    },
    {
      title: 'Packets Created',
      value: user?.packets.length || 0,
      icon: Package,
      description: 'Evidence packets',
    },
    {
      title: 'Latest Upload',
      value: user?.documents[0] ? 'Today' : 'No uploads',
      icon: Calendar,
      description: 'Most recent activity',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || 'there'}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Get started with Life-Doc-Vault</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">1. Upload Your First Document</h3>
            <p className="text-sm text-muted-foreground">
              Start by uploading important documents like medical records, legal papers, or financial statements.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">2. Review AI Extraction</h3>
            <p className="text-sm text-muted-foreground">
              Our AI automatically extracts key dates, people, and events from your documents.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">3. Generate Evidence Packet</h3>
            <p className="text-sm text-muted-foreground">
              Create professional PDF packets for legal, medical, or insurance purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getTierLimit(tier?: string): string {
  switch (tier) {
    case 'FREE':
      return 'of 100 MB'
    case 'PERSONAL':
      return 'of 5 GB'
    case 'PROFESSIONAL':
      return 'of 50 GB'
    case 'ENTERPRISE':
      return 'Unlimited'
    default:
      return ''
  }
}
