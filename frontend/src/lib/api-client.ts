// frontend/src/lib/api-client.ts
import { getSession, signIn } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

async function apiClient(endpoint: string, options: RequestInit = {}) {
  const session = await getSession();
  
  const headers = new Headers(options.headers || {});
  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  // Handle session errors from token refresh
  if (session?.error === "RefreshAccessTokenError") {
    // Force sign in to get a new session
    await signIn("keycloak");
    throw new Error("Session expired. Please sign in again.");
  }

  // Construct full URL with base path: e.g., http://localhost:8001/template/api/test
  const fullUrl = `${API_URL}${BASE_PATH}/api${endpoint}`;
  const response = await fetch(fullUrl, { ...options, headers });

  // If token is invalid/expired on the backend, trigger a re-login
  if (response.status === 401) {
    await signIn("keycloak");
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || 'An API error occurred.');
  }

  return response.json();
}

export default apiClient;
