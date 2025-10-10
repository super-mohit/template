'use client'

import { useSession, signIn } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { NavyButton } from '@/components/ui/accent-button'

export default function ExplorerPage() {
  const { status } = useSession()

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
            <CardTitle className='text-2xl font-bold text-gray-900'>
              Authentication Required
            </CardTitle>
            <CardDescription>
              Please sign in to access the Data Explorer.
            </CardDescription>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <NavyButton
              onClick={() => {
                signIn('keycloak', { callbackUrl: window.location.pathname })
              }}
              className='w-full py-4 text-base font-semibold'
            >
              Sign In
            </NavyButton>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Data Explorer</h1>
      <p className="text-gray-600">This page is under construction.</p>
    </div>
  )
}
