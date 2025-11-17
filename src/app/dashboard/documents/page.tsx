import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import DocumentList from '@/components/dashboard/document-list'

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const documents = await prisma.document.findMany({
    where: {
      userId: session.user.id,
      isDeleted: false,
    },
    orderBy: {
      uploadedAt: 'desc',
    },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage your uploaded documents</p>
        </div>
        <Link href="/dashboard/documents/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <h3 className="mb-2 text-lg font-semibold">No documents yet</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Upload your first document to get started with AI-powered organization
          </p>
          <Link href="/dashboard/documents/upload">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Your First Document
            </Button>
          </Link>
        </Card>
      ) : (
        <DocumentList documents={documents} />
      )}
    </div>
  )
}
