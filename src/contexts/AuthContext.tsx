
import { createContext, useContext, useEffect, useState } from 'react';
import { SpotifyUser } from '@/types/spotify';
import { createSpotifyClient } from '@/utils/spotify-client';
import { getStoredTokens } from '@/utils/spotify-auth';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  user: SpotifyUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { accessToken, refreshToken } = getStoredTokens();
        
        if (accessToken) {
          setAccessToken(accessToken);
          setRefreshToken(refreshToken);
          
          // Fetch user profile
          const spotify = createSpotifyClient(accessToken);
          const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    accessToken,
    refreshToken,
    user,
    isAuthenticated: !!accessToken,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
