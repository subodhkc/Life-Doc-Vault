'use client'

import { FileText, Download, Trash2, Eye } from 'lucide-react'
import { formatBytes, formatDate } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Document {
  id: string
  filename: string
  originalName: string
  mimeType: string
  fileSize: bigint
  category: string | null
  uploadedAt: Date
}

interface DocumentListProps {
  documents: Document[]
}

export default function DocumentList({ documents }: DocumentListProps) {
  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'LEGAL':
        return 'bg-blue-100 text-blue-800'
      case 'MEDICAL':
        return 'bg-green-100 text-green-800'
      case 'FINANCIAL':
        return 'bg-yellow-100 text-yellow-800'
      case 'PERSONAL':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{doc.originalName}</h3>
                <div className="mt-1 flex items-center space-x-3 text-sm text-muted-foreground">
                  <span>{formatBytes(Number(doc.fileSize))}</span>
                  <span>•</span>
                  <span>{formatDate(doc.uploadedAt)}</span>
                  {doc.category && (
                    <>
                      <span>•</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${getCategoryColor(doc.category)}`}>
                        {doc.category}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
