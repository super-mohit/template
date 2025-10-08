'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import Link from 'next/link'

// Dummy User Menu component for demonstration
const UserMenu = () => {
  const { data: session } = useSession()
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  if (!session?.user) return null

  return (
    <div className='flex items-center gap-4'>
      <div className='flex flex-col text-right'>
        <span className='font-semibold text-sm text-foreground'>
          {session.user.name}
        </span>
        <span className='text-xs text-muted-foreground'>
          {session.user.email}
        </span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: `${basePath}/` })}
        className='p-2 rounded-full hover:bg-secondary'
        title='Sign Out'
      >
        <LogOut className='h-5 w-5' />
      </button>
    </div>
  )
}

export function Header() {
  return (
    <header className='sticky top-0 z-10 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 max-w-screen-2xl items-center justify-between'>
        <div className='mr-4 hidden md:flex'>
          <Link href='/' className='mr-6 flex items-center space-x-2'>
            {/* Replace with an SVG logo in the future */}
            <span className='hidden font-bold sm:inline-block'>
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
