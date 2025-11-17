'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Trash2, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Event {
  id: string
  eventDate: Date
  eventTime: string | null
  description: string
  entities: string[]
  confidence: number
}

interface Document {
  id: string
  originalName: string
  category: string | null
  uploadedAt: Date
  fileSize: bigint
  events: Event[]
}

interface Packet {
  id: string
  title: string
  description: string | null
  category: string | null
  createdAt: Date
  generatedAt: Date | null
  documents: Document[]
}

export default function PacketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [packet, setPacket] = useState<Packet | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPacket()
  }, [params.id])

  const fetchPacket = async () => {
    try {
      const response = await fetch(`/api/packets/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPacket(data.packet)
      } else {
        alert('Packet not found')
        router.push('/dashboard/packets')
      }
    } catch (error) {
      console.error('Failed to fetch packet:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    setGenerating(true)
    try {
      const response = await fetch(`/api/packets/${params.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeTimeline: true,
          includeExhibits: true,
        }),
      })

      if (response.ok) {
        // Download the PDF
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${packet?.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Refresh packet data
        fetchPacket()
      } else {
        alert('Failed to generate PDF')
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  const deletePacket = async () => {
    if (!confirm('Are you sure you want to delete this packet? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/packets/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/packets')
      } else {
        alert('Failed to delete packet')
      }
    } catch (error) {
      console.error('Failed to delete packet:', error)
      alert('Failed to delete packet')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading packet...</p>
      </div>
    )
  }

  if (!packet) {
    return null
  }

  const totalEvents = packet.documents.reduce((sum, doc) => sum + doc.events.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/packets">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{packet.title}</h1>
            {packet.description && (
              <p className="text-muted-foreground">{packet.description}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={generatePDF} disabled={generating}>
            <Download className="mr-2 h-4 w-4" />
            {generating ? 'Generating...' : 'Generate PDF'}
          </Button>
          <Button variant="destructive" onClick={deletePacket} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Category</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{packet.category || 'OTHER'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{packet.documents.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalEvents}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Packet Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">{new Date(packet.createdAt).toLocaleString()}</span>
          </div>
          {packet.generatedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Generated:</span>
              <span className="font-medium">
                {new Date(packet.generatedAt).toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Included Documents</CardTitle>
          <CardDescription>
            {packet.documents.length} document{packet.documents.length !== 1 ? 's' : ''} in this
            packet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {packet.documents.map((doc) => (
              <div key={doc.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{doc.originalName}</p>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      {doc.category && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                          {doc.category}
                        </span>
                      )}
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      <span>{doc.events.length} events</span>
                    </div>
                  </div>
                </div>
                {doc.events.length > 0 && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <p className="text-xs font-semibold text-muted-foreground">Events:</p>
                    {doc.events.slice(0, 3).map((event) => (
                      <div key={event.id} className="text-xs">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(event.eventDate).toLocaleDateString()}
                          </span>
                          {event.eventTime && <span>at {event.eventTime}</span>}
                        </div>
                        <p className="ml-5 text-muted-foreground">{event.description}</p>
                      </div>
                    ))}
                    {doc.events.length > 3 && (
                      <p className="ml-5 text-xs text-muted-foreground">
                        +{doc.events.length - 3} more events
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
