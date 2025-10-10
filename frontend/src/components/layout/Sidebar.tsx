// frontend/src/components/layout/Sidebar.tsx
'use client'
import {
  LayoutDashboard,
  Settings,
  DatabaseZap,
  GanttChartSquare,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NavLink = ({
  href,
  children,
  icon: Icon,
}: {
  href: string
  children: React.ReactNode
  icon: React.ElementType
}) => {
  const pathname = usePathname()
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const isActive = pathname === `${basePath}${href}`

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
        isActive
          ? 'bg-[#000b37] text-white'
          : 'text-gray-700 hover:bg-gray-100 hover:text-[#000b37]'
      )}
    >
      <Icon className='h-5 w-5' />
      {children}
    </Link>
  )
}

export function Sidebar() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  return (
    <div className='hidden border-r border-gray-200 bg-white md:block'>
      <div className='flex h-full max-h-screen flex-col gap-2'>
        <div className='flex h-16 items-center border-b border-gray-200 px-6'>
          <Link href='/' className='flex items-center'>
            <Image
              src={`${basePath}/supervity-transparent.png`}
              alt='Supervity'
              width={140}
              height={40}
              className='h-10 w-auto'
              priority
            />
          </Link>
        </div>
        <div className='flex-1 px-3 py-4'>
          <nav className='grid gap-1'>
            <NavLink href='/' icon={LayoutDashboard}>
              Dashboard
            </NavLink>
            <NavLink href='/data-center' icon={DatabaseZap}>
              Data Center
            </NavLink>
            <NavLink href='/explorer' icon={Search}>
              Data Explorer
            </NavLink>
            <NavLink href='/workbench' icon={GanttChartSquare}>
              Workbench
            </NavLink>
            <NavLink href='/ai-policies' icon={Settings}>
              AI Policies
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  )
}
