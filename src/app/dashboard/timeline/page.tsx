import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Calendar, MapPin, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export default async function TimelinePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const events = await prisma.event.findMany({
    where: {
      document: {
        userId: session.user.id,
        isDeleted: false,
      },
    },
    include: {
      document: {
        select: {
          id: true,
          originalName: true,
          category: true,
        },
      },
    },
    orderBy: {
      eventDate: 'desc',
    },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Timeline</h1>
        <p className="text-muted-foreground">Chronological view of events from your documents</p>
      </div>

      {events.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No events yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload and process documents to automatically extract events and build your timeline
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{event.description}</CardTitle>
                    <CardDescription>
                      From: {event.document.originalName}
                      {event.document.category && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {event.document.category}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-4 w-4" />
                      {formatDate(event.eventDate)}
                      {event.eventTime && <span className="ml-1">at {event.eventTime}</span>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Confidence: {Math.round(event.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              {event.entities.length > 0 && (
                <CardContent>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Involved:</span>
                    {event.entities.map((entity, i) => (
                      <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {entity}
                      </span>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
