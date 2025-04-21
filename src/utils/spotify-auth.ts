
import { generateRandomString } from './helpers';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

export function generateCodeVerifier(length: number = 128): string {
  return generateRandomString(length);
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function buildAuthUrl(clientId: string, redirectUri: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: 'user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private user-read-recently-played user-read-playback-state user-read-currently-playing'
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function fetchTokens(code: string, codeVerifier: string, clientId: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tokens');
  }

  return response.json();
}

export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('spotify_access_token', accessToken);
  localStorage.setItem('spotify_refresh_token', refreshToken);
}

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem('spotify_access_token'),
    refreshToken: localStorage.getItem('spotify_refresh_token'),
  };
}

export function storeCodeVerifier(codeVerifier: string): void {
  try {
    // Store in both localStorage and sessionStorage for redundancy
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    sessionStorage.setItem('spotify_code_verifier', codeVerifier);
  } catch (error) {
    console.error('Failed to store code verifier:', error);
  }
}

export function getCodeVerifier(): string | null {
  // Try localStorage first, then sessionStorage as fallback
  let codeVerifier = localStorage.getItem('spotify_code_verifier');

  if (!codeVerifier) {
    codeVerifier = sessionStorage.getItem('spotify_code_verifier');

    // If found in sessionStorage but not localStorage, try to sync them
    if (codeVerifier) {
      try {
        localStorage.setItem('spotify_code_verifier', codeVerifier);
      } catch (error) {
        console.warn('Could not sync code verifier to localStorage:', error);
      }
    }
  }

  return codeVerifier;
}

export function clearAuthData(): void {
  // Clear all Spotify-related data from storage
  try {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_code_verifier');
    localStorage.removeItem('needs_recently_played_reauth');

    sessionStorage.removeItem('spotify_access_token');
    sessionStorage.removeItem('spotify_refresh_token');
    sessionStorage.removeItem('spotify_code_verifier');

    console.log('All Spotify auth data cleared');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}
