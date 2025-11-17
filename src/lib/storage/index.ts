import { StorageAdapter } from './storage-interface'
import { LocalStorageAdapter } from './local-adapter'
import { S3StorageAdapter } from './s3-adapter'

export function getStorageAdapter(): StorageAdapter {
  const storageType = process.env.STORAGE_TYPE || 'local'

  switch (storageType) {
    case 's3':
      return new S3StorageAdapter()
    case 'local':
    default:
      return new LocalStorageAdapter()
  }
}

export type { StorageAdapter }
export { LocalStorageAdapter, S3StorageAdapter }
