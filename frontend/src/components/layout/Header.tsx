'use client'

import { useSession, signIn } from 'next-auth/react'
import { LogOut, LogIn } from 'lucide-react'
import Link from 'next/link'

// User Menu component
const UserMenu = () => {
  const { data: session, status } = useSession()
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  if (status === 'loading') {
    return (
      <div className='h-8 w-32 animate-pulse rounded bg-gray-200'></div>
    )
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => {
          // Use NextAuth's signIn function with the base path as callback
          const callbackUrl = basePath || '/'
          signIn('keycloak', { callbackUrl })
        }}
        className='flex items-center gap-2 rounded-lg bg-[#000b37] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#000b37]/90'
      >
        <LogIn className='h-4 w-4' />
        Sign In
      </button>
    )
  }

  return (
    <div className='flex items-center gap-4'>
      <div className='flex flex-col text-right'>
        <span className='text-sm font-semibold text-gray-900'>
          {session.user.name}
        </span>
        <span className='text-xs text-gray-500'>
          {session.user.email}
        </span>
      </div>
      <button
        onClick={() => {
          // Use custom logout endpoint to properly end Keycloak session
          window.location.href = `${basePath}/api/auth/logout`
        }}
        className='rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900'
        title='Sign Out'
      >
        <LogOut className='h-5 w-5' />
      </button>
    </div>
  )
}

export function Header() {
  return (
    <header className='sticky top-0 z-10 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80'>
      <div className='flex h-16 items-center justify-between px-6'>
        <div className='mr-4 hidden md:flex'>
          <Link href='/' className='mr-6 flex items-center space-x-2'>
            <span className='text-xl font-semibold text-[#000b37]'>
              AI Command Center
            </span>
          </Link>
        </div>
        <div className='flex flex-1 items-center justify-end space-x-2'>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
