// File: frontend/src/components/ingestion/JobProgress.tsx
'use client'
import { useEffect, useState } from 'react'
import { getJobStatus, type Job } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface JobProgressProps {
  job: Job
}

export function JobProgress({ job: initialJob }: JobProgressProps) {
  const [job, setJob] = useState(initialJob)

  useEffect(() => {
    if (job.status === 'completed' || job.status === 'failed') return

    const interval = setInterval(async () => {
      try {
        const updatedJob = await getJobStatus(job.id)
        setJob(updatedJob)
        if (
          updatedJob.status === 'completed' ||
          updatedJob.status === 'failed'
        ) {
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Failed to poll job status', error)
        clearInterval(interval)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [job.id, job.status])

  return (
    <Card className='mt-6'>
      <CardHeader>
        <CardTitle>Processing Job #{job.id}</CardTitle>
      </CardHeader>
      <CardContent className='flex items-center gap-4'>
        {job.status === 'completed' ? (
          <CheckCircle className='h-8 w-8 text-green-500' />
        ) : job.status === 'failed' ? (
          <AlertCircle className='h-8 w-8 text-red-500' />
        ) : (
          <Loader2 className='h-8 w-8 animate-spin' />
        )}
        <div>
          <p className='font-semibold'>Status: {job.status}</p>
          <p className='text-sm text-gray-500'>
            Started at: {job.created_at.toLocaleString()}
          </p>
          {job.completed_at && (
            <p className='text-sm text-gray-500'>
              Completed at: {job.completed_at.toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
