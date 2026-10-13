import { queryClient } from '../../../lib/queryClient';

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5005/api/auth';

export const TOKEN_KEY = 'token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

/** Signing out also forgets cached data and saved table settings, so the next user never sees them. */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  queryClient.clear();
  try {
    sessionStorage.clear();
  } catch {
    // storage unavailable: nothing was saved
  }
};

export async function login(phoneNo, secretCode) {
  let response;
  try {
    response = await fetch(`${AUTH_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNo, secretCode }),
    });
  } catch {
    throw new Error('Cannot reach the server. Please try again.');
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.success) {
    throw new Error(body.message || 'Login failed');
  }

  localStorage.setItem(TOKEN_KEY, body.data.token);
  return body.data;
}
