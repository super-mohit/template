import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Poppins } from 'next/font/google'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata: Metadata = {
  title: 'Supervity AI Command Center',
  description: 'AI Command Center Template',
  icons: {
    icon: `${basePath}/supervity-favicon.png`,
    shortcut: `${basePath}/supervity-favicon.png`,
    apple: `${basePath}/supervity-favicon.png`,
  },
}

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' className='light' suppressHydrationWarning>
      <body
        className={cn(
          'bg-background min-h-screen font-sans antialiased',
          poppins.variable
        )}
      >
        <Providers>
          <div className='grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr]'>
            <Sidebar />
            <div className='flex flex-col'>
              <Header />
              <main className='flex flex-1 flex-col gap-4 bg-gray-50 p-4 lg:gap-6 lg:p-8'>
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
