import { getSession, signIn } from 'next-auth/react'
import { z } from 'zod'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

/**
 * A robust API client that handles authentication and base path resolution.
 * @param endpoint The API endpoint to call, e.g., '/api/test' or '/api/admin/dashboard'.
 *                 The endpoint should include the '/api' prefix.
 * @param options Standard fetch options (method, body, etc.).
 */
async function apiClient(endpoint: string, options: RequestInit = {}) {
  const session = await getSession()

  const headers = new Headers(options.headers || {})

  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  // Handle session errors that occurred during a token refresh attempt.
  if (session?.error === 'RefreshAccessTokenError') {
    // Force sign-in to get a new, valid session.
    await signIn('keycloak')
    // Throw an error to stop the current, failing API call.
    throw new Error('Session expired. Please sign in again.')
  }

  // Construct the full URL: http://localhost:8001/app1/api/test
  const fullUrl = `${API_URL}${BASE_PATH}${endpoint}`

  const response = await fetch(fullUrl, { ...options, headers })

  // If the backend returns a 401, it means the token is invalid or expired.
  // This can happen if the backend is restarted or the user's session is revoked.
  // We trigger a re-login to fix the session.
  if (response.status === 401) {
    await signIn('keycloak')
    throw new Error('Your session has expired. Please sign in again.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: response.statusText,
    }))
    throw new Error(errorData.detail || 'An API error occurred.')
  }

  // Handle responses with no content
  if (response.status === 204) {
    return null
  }

  return response.json()
}

export default apiClient

// --- NEW ZOD SCHEMAS ---

export const JobSchema = z.object({
  id: z.number(),
  status: z.string(),
  summary_json: z.any().nullable(),
  created_at: z.string().transform((val) => new Date(val)),
  completed_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
})
export type Job = z.infer<typeof JobSchema>

export const AiPolicySchema = z.object({
  id: z.number(),
  name: z.string(),
  policy_type: z.string(),
  context_field: z.string().nullable(),
  natural_language_rule: z.string(),
  is_active: z.boolean(),
})
export type AiPolicy = z.infer<typeof AiPolicySchema>

export const AiPolicyCreateSchema = AiPolicySchema.omit({ id: true })
export type AiPolicyCreate = z.infer<typeof AiPolicyCreateSchema>

// --- NEW API FUNCTIONS ---

export async function uploadDocuments(
  files: File[]
): Promise<{ message: string }> {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  return apiClient('/api/ingestion/upload', {
    method: 'POST',
    body: formData,
  })
}

export async function getJobStatus(jobId: number): Promise<Job> {
  const data = await apiClient(`/api/jobs/${jobId}`)
  return JobSchema.parse(data)
}

export async function getAiPolicies(): Promise<AiPolicy[]> {
  const data = await apiClient('/api/ai-policies/')
  return z.array(AiPolicySchema).parse(data)
}

export async function createAiPolicy(
  policy: AiPolicyCreate
): Promise<AiPolicy> {
  const data = await apiClient('/api/ai-policies/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policy),
  })
  return AiPolicySchema.parse(data)
}

export async function updateAiPolicy(
  id: number,
  policy: AiPolicyCreate
): Promise<AiPolicy> {
  const data = await apiClient(`/api/ai-policies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policy),
  })
  return AiPolicySchema.parse(data)
}

export async function deleteAiPolicy(id: number): Promise<void> {
  await apiClient(`/api/ai-policies/${id}`, {
    method: 'DELETE',
  })
}
