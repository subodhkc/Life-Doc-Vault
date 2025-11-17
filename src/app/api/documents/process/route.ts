import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getStorageAdapter } from '@/lib/storage'
import { ocrService } from '@/lib/ocr/ocr-service'
import { documentAnalyzer } from '@/lib/ai/document-analyzer'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId, userId: session.user.id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Download file from storage
    const storage = getStorageAdapter()
    const fileBuffer = await storage.download(document.storagePath)

    let text = ''

    // Extract text based on file type
    if (document.mimeType.startsWith('image/')) {
      // Use OCR for images
      const ocrResult = await ocrService.extractFromImage(fileBuffer)
      text = ocrResult.text

      // Update document with OCR text
      await prisma.document.update({
        where: { id: document.id },
        data: { ocrText: text },
      })
    } else if (document.mimeType === 'application/pdf') {
      // For PDFs, use pdf-parse or OCR
      // Simplified for now
      const pdfParse = require('pdf-parse')
      const pdfData = await pdfParse(fileBuffer)
      text = pdfData.text

      await prisma.document.update({
        where: { id: document.id },
        data: { ocrText: text },
      })
    }

    // Skip AI analysis if no text extracted
    if (!text || text.length < 50) {
      await prisma.document.update({
        where: { id: document.id },
        data: { processedAt: new Date() },
      })

      return NextResponse.json({
        message: 'Document processed but no text extracted',
        documentId: document.id,
      })
    }

    // Analyze document with AI
    const analysis = await documentAnalyzer.analyzeDocument(text, document.originalName)

    // Update document with analysis results
    await prisma.document.update({
      where: { id: document.id },
      data: {
        category: analysis.category,
        extractedData: analysis as any,
        processedAt: new Date(),
      },
    })

    // Create events from analysis
    for (const event of analysis.events) {
      await prisma.event.create({
        data: {
          documentId: document.id,
          eventDate: new Date(event.date),
          eventTime: event.time,
          description: event.description,
          entities: event.entities,
          confidence: event.confidence,
        },
      })
    }

    // Log processing
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DOCUMENT_PROCESSED',
        resource: document.id,
        metadata: {
          category: analysis.category,
          eventsExtracted: analysis.events.length,
        },
      },
    })

    return NextResponse.json({
      message: 'Document processed successfully',
      documentId: document.id,
      category: analysis.category,
      eventsCount: analysis.events.length,
      summary: analysis.summary,
    })
  } catch (error) {
    console.error('Document processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
