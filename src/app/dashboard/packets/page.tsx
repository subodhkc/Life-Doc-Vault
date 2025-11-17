import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { FileText, Plus, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function PacketsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const packets = await prisma.packet.findMany({
    where: {
      userId: session.user.id,
      isDeleted: false,
    },
    include: {
      _count: {
        select: {
          documents: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evidence Packets</h1>
          <p className="text-muted-foreground">
            Create and manage document packets for legal, medical, or personal use
          </p>
        </div>
        <Link href="/dashboard/packets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Packet
          </Button>
        </Link>
      </div>

      {packets.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No packets yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first document packet to organize and export your documents
          </p>
          <Link href="/dashboard/packets/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Packet
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packets.map((packet) => (
            <Link key={packet.id} href={`/dashboard/packets/${packet.id}`}>
              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{packet.title}</CardTitle>
                      {packet.category && (
                        <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {packet.category}
                        </span>
                      )}
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {packet.description && (
                    <CardDescription className="line-clamp-2">{packet.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Documents:</span>
                      <span className="font-medium">{packet._count.documents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Created:</span>
                      <span className="font-medium">{formatDate(packet.createdAt)}</span>
                    </div>
                    {packet.generatedAt && (
                      <div className="flex items-center justify-between">
                        <span>Last Generated:</span>
                        <span className="font-medium">{formatDate(packet.generatedAt)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
