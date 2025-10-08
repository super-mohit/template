'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import apiClient from '@/lib/api-client'

// Shadcn UI Components
const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" {...props}>{children}</button>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`}>{children}</div>
);
const CardHeader = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col space-y-1.5 p-6">{children}</div>;
const CardTitle = ({ children }: { children: React.ReactNode }) => <h3 className="font-semibold leading-none tracking-tight">{children}</h3>;
const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={`p-6 pt-0 ${className || ''}`}>{children}</div>;
const CardFooter = ({ children }: { children: React.ReactNode }) => <div className="flex items-center p-6 pt-0">{children}</div>;


export default function HomePage() {
  const { data: session, status } = useSession()
  const [apiResponse, setApiResponse] = useState<string>('')
  const [adminResponse, setAdminResponse] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const callApi = async (endpoint: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setIsLoading(true)
    setter('Loading...')
    try {
      const data = await apiClient(endpoint)
      setter(JSON.stringify(data, null, 2))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setter(`Error: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return <div>Loading session...</div>
  }

  return (
    <div className='container mx-auto'>
      <h1 className='text-3xl font-bold mb-6'>Dashboard</h1>

      {status === 'authenticated' ? (
        <div className='grid gap-6 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Tests</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Button onClick={() => callApi('/api/test', setApiResponse)} disabled={isLoading}>
                  {isLoading ? 'Calling...' : 'Call Protected Endpoint'}
                </Button>
                {apiResponse && <pre className='mt-2 rounded-md bg-muted p-4 text-sm'><code className='text-white'>{apiResponse}</code></pre>}
              </div>
              <div className='space-y-2'>
                 <Button onClick={() => callApi('/api/admin/dashboard', setAdminResponse)} disabled={isLoading}>
                  {isLoading ? 'Calling...' : 'Call Admin-Only Endpoint'}
                </Button>
                {adminResponse && <pre className='mt-2 rounded-md bg-muted p-4 text-sm'><code className='text-white'>{adminResponse}</code></pre>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent>
               <pre className='mt-2 rounded-md bg-muted p-4 text-sm overflow-x-auto'><code className='text-white'>{JSON.stringify(session, null, 2)}</code></pre>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className='max-w-md mx-auto'>
           <CardHeader>
              <CardTitle>Welcome!</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You are not signed in. Please sign in to continue.</p>
            </CardContent>
            <CardFooter>
                <Button onClick={() => signIn('keycloak')}>Sign In with Keycloak</Button>
            </CardFooter>
        </Card>
      )}
    </div>
  )
}