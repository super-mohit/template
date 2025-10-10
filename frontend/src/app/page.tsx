'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import apiClient from '@/lib/api-client'
import { NavyButton } from '@/components/ui/accent-button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

export default function HomePage() {
  const { status } = useSession()
  const [dashboardResponse, setDashboardResponse] = useState<string>('')
  const [workbenchResponse, setWorkbenchResponse] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  const callApi = async (
    endpoint: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setIsLoading(true)
    setter('Loading...')
    try {
      const data = await apiClient(endpoint)
      setter(JSON.stringify(data, null, 2))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      setter(`Error: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#000b37]'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    )
  }

  if (status !== 'authenticated') {
    return (
      <div className='flex h-full items-center justify-center'>
        <Card className='w-full max-w-md border-0 bg-white shadow-lg'>
          <CardHeader className='space-y-2 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#000b37]'>
              <span className='text-2xl font-bold text-white'>S</span>
            </div>
            <CardTitle className='text-2xl font-bold text-gray-900'>
              Welcome to Supervity
            </CardTitle>
            <CardDescription>
              Please sign in to access your dashboard and continue.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 px-6 pb-6'>
            <NavyButton
              onClick={() => {
                const callbackUrl = basePath || '/'
                signIn('keycloak', { callbackUrl })
              }}
              className='w-full py-6 text-base font-semibold'
            >
              Sign In with Keycloak
            </NavyButton>
            <p className='text-center text-sm text-gray-500'>
              Secure authentication powered by Keycloak
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-4xl font-bold text-gray-900'>
          Phase 1 Test Dashboard
        </h1>
        <p className='mt-2 text-lg text-gray-600'>
          Use these buttons to test the foundational services.
        </p>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='border-0 bg-white shadow-sm'>
          <CardHeader>
            <CardTitle>Pattern A: Simple Role-Based Auth</CardTitle>
            <CardDescription>
              Calls `/api/dashboard/data`. Should succeed for any logged-in
              user.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <NavyButton
              onClick={() =>
                callApi('/api/dashboard/data', setDashboardResponse)
              }
              disabled={isLoading}
              className='w-full'
            >
              {isLoading ? 'Calling...' : 'Call Dashboard API'}
            </NavyButton>
            {dashboardResponse && (
              <div className='mt-4 rounded-lg border bg-gray-50 p-4'>
                <pre className='overflow-x-auto text-xs'>
                  <code>{dashboardResponse}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='border-0 bg-white shadow-sm'>
          <CardHeader>
            <CardTitle>Pattern B: Context-Aware Auth</CardTitle>
            <CardDescription>
              Calls `/api/workbench/1`. The rule requires `owner_id` context.
              This will fail with a 403 Forbidden unless you are logged in as
              admin.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <NavyButton
              onClick={() => callApi('/api/workbench/1', setWorkbenchResponse)}
              disabled={isLoading}
              className='w-full'
            >
              {isLoading ? 'Calling...' : 'Call Workbench API'}
            </NavyButton>
            {workbenchResponse && (
              <div className='mt-4 rounded-lg border bg-gray-50 p-4'>
                <pre className='overflow-x-auto text-xs'>
                  <code>{workbenchResponse}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
