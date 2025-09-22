// frontend/src/app/page.tsx
'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import apiClient from '@/lib/api-client' // Import our new client

export default function HomePage() {
  // Get base path from environment for dynamic callbacks
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const { data: session, status } = useSession()
  const [apiResponse, setApiResponse] = useState<string>('')
  const [adminResponse, setAdminResponse] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const callApi = async (endpoint: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setIsLoading(true)
    setter('Loading...')
    try {
      const data = await apiClient(endpoint);
      setter(JSON.stringify(data, null, 2))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setter(`Error: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="container"><h1>Loading session...</h1></div>
  }

  return (
    <div className="container">
      <h1>AI Command Center</h1>
      <div className="status loading" style={{ marginBottom: '30px' }}>
        User Status: <strong>{status}</strong>
      </div>
      
      {status === 'authenticated' ? (
        <div>
          <p>Welcome, {session.user?.name || 'user'}!</p>
          <button onClick={() => signOut({ callbackUrl: `${basePath}/` })}>Sign Out</button>
        </div>
      ) : (
        <div>
          <p>You are not signed in.</p>
          <button onClick={() => signIn('keycloak', { callbackUrl: `${basePath}/` })}>Sign In with Keycloak</button>
        </div>
      )}

      <hr style={{ margin: '30px 0' }} />

      <h2>Test API Endpoints</h2>
      {status === 'authenticated' ? (
        <>
          <button onClick={() => callApi('/api/test', setApiResponse)} disabled={isLoading}>
            {isLoading ? 'Calling...' : 'Call Protected Endpoint'}
          </button>
          {apiResponse && <div className="details"><pre>{apiResponse}</pre></div>}

          <button onClick={() => callApi('/api/admin', setAdminResponse)} disabled={isLoading} style={{ background: '#dc3545', marginTop: '15px' }}>
            {isLoading ? 'Calling...' : 'Call Admin-Only Endpoint'}
          </button>
          {adminResponse && <div className="details"><pre>{adminResponse}</pre></div>}
        </>
      ) : (
        <p>You must be signed in to test the APIs.</p>
      )}
    </div>
  )
}
