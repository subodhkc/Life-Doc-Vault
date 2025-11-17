import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const packets = await prisma.packet.findMany({
      where: {
        userId: session.user.id,
        isDeleted: false,
      },
      include: {
        documents: {
          select: {
            id: true,
            originalName: true,
            category: true,
          },
        },
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

    return NextResponse.json({ packets })
  } catch (error) {
    console.error('Packets fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch packets' }, { status: 500 })
  }
}
