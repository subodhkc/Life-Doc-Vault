import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { StorageAdapter } from './storage-interface'

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client
  private bucket: string

  constructor() {
    const endpoint = process.env.S3_ENDPOINT_URL
    const region = process.env.AWS_REGION || 'us-east-1'

    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: !!endpoint, // Required for MinIO and DigitalOcean Spaces
    })

    this.bucket = process.env.AWS_BUCKET_NAME!

    if (!this.bucket) {
      throw new Error('AWS_BUCKET_NAME environment variable is required for S3 storage')
    }
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
    // Create path with date organization
    const date = new Date()
    const year = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    const key = `documents/${year}/${month}/${day}/${filename}`

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    })

    await this.client.send(command)
    return key
  }

  async download(path: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    })

    const response = await this.client.send(command)

    if (!response.Body) {
      throw new Error('No file content returned from S3')
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const stream = response.Body as any

    for await (const chunk of stream) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  }

  async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    })

    await this.client.send(command)
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    })

    return await getSignedUrl(this.client, command, { expiresIn })
  }

  async exists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      })

      await this.client.send(command)
      return true
    } catch {
      return false
    }
  }
}
