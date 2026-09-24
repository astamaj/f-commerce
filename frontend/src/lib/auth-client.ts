const TOKEN_KEY = 'accessToken';
const BUSINESS_ID_KEY = 'businessId';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface AuthUser {
  accessToken: string;
  businessId: string;
}

export function setAuth(user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, user.accessToken);
  localStorage.setItem(BUSINESS_ID_KEY, user.businessId);
}

export function getAuth(): AuthUser | null {
  const accessToken = localStorage.getItem(TOKEN_KEY);
  const businessId = localStorage.getItem(BUSINESS_ID_KEY);
  if (!accessToken || !businessId) return null;
  return { accessToken, businessId };
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(BUSINESS_ID_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const auth = getAuth();
  if (!auth) return {};
  return {
    Authorization: `Bearer ${auth.accessToken}`,
    'x-business-id': auth.businessId,
  };
}

export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const authHeaders = getAuthHeaders();
  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  // Use full URL so client-side fetch bypasses Next.js rewrites (which only
  // work server-side) and hits the Express backend directly.
  const url =
    typeof input === 'string' && input.startsWith('/')
      ? new URL(input, API_BASE_URL).toString()
      : input;
  return fetch(url, { ...init, headers });
}
