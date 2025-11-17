export interface StorageAdapter {
  /**
   * Upload a file to storage
   * @param file - The file buffer to upload
   * @param filename - The name to save the file as
   * @param mimeType - The MIME type of the file
   * @returns The storage path where the file was saved
   */
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>

  /**
   * Download a file from storage
   * @param path - The storage path of the file
   * @returns The file buffer
   */
  download(path: string): Promise<Buffer>

  /**
   * Delete a file from storage
   * @param path - The storage path of the file
   */
  delete(path: string): Promise<void>

  /**
   * Generate a signed URL for temporary access
   * @param path - The storage path of the file
   * @param expiresIn - Time in seconds until the URL expires
   * @returns A signed URL
   */
  getSignedUrl(path: string, expiresIn?: number): Promise<string>

  /**
   * Check if a file exists
   * @param path - The storage path to check
   */
  exists(path: string): Promise<boolean>
}
