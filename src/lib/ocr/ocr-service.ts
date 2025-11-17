import Tesseract from 'tesseract.js'

export interface OCRResult {
  text: string
  confidence: number
  language: string
}

export class OCRService {
  private language: string

  constructor(language: string = process.env.OCR_LANGUAGE || 'eng') {
    this.language = language
  }

  /**
   * Extract text from an image using Tesseract OCR
   */
  async extractFromImage(imageBuffer: Buffer): Promise<OCRResult> {
    const {
      data: { text, confidence },
    } = await Tesseract.recognize(imageBuffer, this.language, {
      logger: (m) => console.log(m),
    })

    return {
      text: text.trim(),
      confidence: confidence / 100, // Convert to 0-1 scale
      language: this.language,
    }
  }

  /**
   * Extract text from a PDF (images within PDF)
   * Note: For text-based PDFs, use pdf-parse instead
   */
  async extractFromPDF(pdfBuffer: Buffer): Promise<OCRResult> {
    // For now, return placeholder
    // In a full implementation, you'd convert PDF pages to images first
    // using pdf2image or similar, then OCR each page
    return {
      text: '',
      confidence: 0,
      language: this.language,
    }
  }

  /**
   * Determine if a file needs OCR or has selectable text
   */
  async needsOCR(fileBuffer: Buffer, mimeType: string): Promise<boolean> {
    // Images always need OCR
    if (mimeType.startsWith('image/')) {
      return true
    }

    // PDFs might have selectable text or might be scanned images
    if (mimeType === 'application/pdf') {
      // Try to extract text first with pdf-parse
      // If very little text is found, it's likely a scanned image
      return true // Simplified for now
    }

    return false
  }
}

export const ocrService = new OCRService()
