// File: frontend/src/components/ingestion/FileUpload.tsx
'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadDocuments, type Job } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { UploadCloud, File, X, Loader2 } from 'lucide-react'

interface FileUploadProps {
  onUploadSuccess: (job: Job) => void
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName))
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setIsUploading(true)
    console.log('Uploading files...')
    try {
      await uploadDocuments(files)
      console.log('Upload successful! Processing has started.')
      // In a real app, you'd get the Job ID back and pass it to onUploadSuccess
      // For now, we simulate a job object to trigger the progress bar.
      const mockJob: Job = {
        id: Date.now(),
        status: 'processing',
        created_at: new Date(),
        completed_at: null,
        summary_json: null,
      }
      onUploadSuccess(mockJob)
      setFiles([])
    } catch (error) {
      console.error(`Upload failed:`, error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className='space-y-4'>
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className='mx-auto h-12 w-12 text-gray-400' />
        <p className='mt-2'>Drag & drop files here, or click to select</p>
      </div>
      {files.length > 0 && (
        <div>
          <ul className='space-y-2'>
            {files.map((f) => (
              <li
                key={f.name}
                className='flex items-center justify-between rounded bg-gray-50 p-2 text-sm'
              >
                <span className='flex items-center gap-2'>
                  <File className='h-4 w-4' />
                  {f.name}
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => removeFile(f.name)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className='mt-4 w-full'
          >
            {isUploading ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            Upload {files.length} File(s)
          </Button>
        </div>
      )}
    </div>
  )
}
