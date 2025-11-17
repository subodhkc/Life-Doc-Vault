import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getStorageAdapter } from '@/lib/storage'
import crypto from 'crypto'

const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '52428800') // 50MB default

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    }

    // Get user and check quota
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check storage quota
    const tierLimits: Record<string, bigint> = {
      FREE: BigInt(104857600), // 100MB
      PERSONAL: BigInt(5368709120), // 5GB
      PROFESSIONAL: BigInt(53687091200), // 50GB
      ENTERPRISE: BigInt(Number.MAX_SAFE_INTEGER), // Unlimited
    }

    const limit = tierLimits[user.tier] || tierLimits.FREE
    if (user.storageUsed + BigInt(file.size) > limit) {
      return NextResponse.json({ error: 'Storage quota exceeded' }, { status: 403 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Calculate file hash
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `${crypto.randomUUID()}.${ext}`

    // Upload to storage
    const storage = getStorageAdapter()
    const storagePath = await storage.upload(buffer, filename, file.type)

    // Create document record
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        filename,
        originalName: file.name,
        mimeType: file.type,
        fileSize: BigInt(file.size),
        fileHash: hash,
        storagePath,
      },
    })

    // Update user storage
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        storageUsed: { increment: BigInt(file.size) },
        documentCount: { increment: 1 },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DOCUMENT_UPLOADED',
        resource: document.id,
        metadata: {
          filename: file.name,
          size: file.size,
          type: file.type,
        },
      },
    })

    return NextResponse.json(
      {
        document: {
          id: document.id,
          filename: document.originalName,
          size: file.size,
          uploadedAt: document.uploadedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
