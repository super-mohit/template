import './globals.css'
import { Providers } from './providers' // Import the provider

export const metadata = {
  title: 'AI Command Center',
  description: 'AI Command Center Template',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
