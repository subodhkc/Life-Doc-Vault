import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const packet = await prisma.packet.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        documents: {
          include: {
            events: {
              orderBy: {
                eventDate: 'asc',
              },
            },
          },
        },
      },
    })

    if (!packet) {
      return NextResponse.json({ error: 'Packet not found' }, { status: 404 })
    }

    return NextResponse.json({ packet })
  } catch (error) {
    console.error('Packet fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch packet' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete
    const packet = await prisma.packet.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: {
        isDeleted: true,
      },
    })

    // Log deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PACKET_DELETED',
        resource: packet.id,
        metadata: {
          title: packet.title,
        },
      },
    })

    return NextResponse.json({ message: 'Packet deleted successfully' })
  } catch (error) {
    console.error('Packet deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete packet' }, { status: 500 })
  }
}
