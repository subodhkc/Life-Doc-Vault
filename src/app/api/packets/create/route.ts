import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createPacketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['LEGAL', 'MEDICAL', 'FINANCIAL', 'PERSONAL', 'OTHER']).optional(),
  documentIds: z.array(z.string()).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, documentIds } = createPacketSchema.parse(body)

    // Verify all documents belong to the user
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        userId: session.user.id,
        isDeleted: false,
      },
    })

    if (documents.length !== documentIds.length) {
      return NextResponse.json({ error: 'Some documents not found or not accessible' }, { status: 404 })
    }

    // Create packet
    const packet = await prisma.packet.create({
      data: {
        userId: session.user.id,
        title,
        description,
        category,
        documents: {
          connect: documentIds.map((id) => ({ id })),
        },
      },
      include: {
        documents: {
          select: {
            id: true,
            originalName: true,
            category: true,
          },
        },
      },
    })

    // Log packet creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PACKET_CREATED',
        resource: packet.id,
        metadata: {
          title: packet.title,
          documentCount: documentIds.length,
        },
      },
    })

    return NextResponse.json({
      message: 'Packet created successfully',
      packet,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Packet creation error:', error)
    return NextResponse.json({ error: 'Failed to create packet' }, { status: 500 })
  }
}
