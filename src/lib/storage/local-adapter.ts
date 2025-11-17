import { promises as fs } from 'fs'
import path from 'path'
import { StorageAdapter } from './storage-interface'

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string

  constructor(baseDir: string = process.env.STORAGE_DIR || './storage') {
    this.baseDir = baseDir
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
    // Ensure base directory exists
    await fs.mkdir(this.baseDir, { recursive: true })

    // Create subdirectories based on date for organization
    const date = new Date()
    const year = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    const subDir = path.join(this.baseDir, year, month, day)
    await fs.mkdir(subDir, { recursive: true })

    // Save file
    const filePath = path.join(subDir, filename)
    await fs.writeFile(filePath, file)

    // Return relative path
    return path.relative(this.baseDir, filePath)
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, filePath)
    return await fs.readFile(fullPath)
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath)
    await fs.unlink(fullPath)
  }

  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    // For local storage, just return a file:// URL or API endpoint
    // In production, this would be handled by an API route
    return `/api/documents/download/${encodeURIComponent(filePath)}`
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, filePath)
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }
}
