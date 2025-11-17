import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { packetGenerator } from '@/lib/pdf/packet-generator'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { includeTimeline = true, includeExhibits = true } = await request.json()

    // Verify packet exists and belongs to user
    const packet = await prisma.packet.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!packet) {
      return NextResponse.json({ error: 'Packet not found' }, { status: 404 })
    }

    // Generate PDF
    const pdfBuffer = await packetGenerator.generatePacket({
      packetId: params.id,
      userId: session.user.id,
      includeTimeline,
      includeExhibits,
    })

    // Update packet with generation timestamp
    await prisma.packet.update({
      where: { id: params.id },
      data: { generatedAt: new Date() },
    })

    // Log PDF generation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PACKET_GENERATED',
        resource: packet.id,
        metadata: {
          title: packet.title,
          includeTimeline,
          includeExhibits,
        },
      },
    })

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${packet.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
