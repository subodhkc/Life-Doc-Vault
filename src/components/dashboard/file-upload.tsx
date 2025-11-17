'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatBytes } from '@/lib/utils'

interface UploadedFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export default function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const uploadFile = async (index: number) => {
    const fileData = files[index]
    const formData = new FormData()
    formData.append('file', fileData.file)

    setFiles((prev) => {
      const newFiles = [...prev]
      newFiles[index] = { ...newFiles[index], status: 'uploading' }
      return newFiles
    })

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      setFiles((prev) => {
        const newFiles = [...prev]
        newFiles[index] = { ...newFiles[index], status: 'success', progress: 100 }
        return newFiles
      })
    } catch (error) {
      setFiles((prev) => {
        const newFiles = [...prev]
        newFiles[index] = { ...newFiles[index], status: 'error', error: 'Upload failed' }
        return newFiles
      })
    }
  }

  const uploadAll = () => {
    files.forEach((_, index) => {
      if (files[index].status === 'pending') {
        uploadFile(index)
      }
    })
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm font-medium">
          {isDragActive ? 'Drop files here...' : 'Drag and drop files here, or click to select'}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Supported formats: PDF, JPG, PNG, DOCX • Max size: 50MB per file
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Files ({files.length})</h3>
            <Button onClick={uploadAll} disabled={files.every((f) => f.status !== 'pending')}>
              Upload All
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((fileData, index) => (
              <div key={index} className="flex items-center space-x-4 rounded-lg border p-4">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{fileData.file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{formatBytes(fileData.file.size)}</span>
                    {fileData.status === 'success' && (
                      <>
                        <span>•</span>
                        <span className="flex items-center text-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Uploaded
                        </span>
                      </>
                    )}
                    {fileData.status === 'error' && (
                      <>
                        <span>•</span>
                        <span className="text-destructive">{fileData.error}</span>
                      </>
                    )}
                  </div>
                  {fileData.status === 'uploading' && <Progress value={fileData.progress} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
