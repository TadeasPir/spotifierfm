
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBanner } from '@/components/ErrorBanner';
import { fetchTokens, storeTokens, getCodeVerifier } from '@/utils/spotify-auth';
import { parseQueryParams } from '@/utils/helpers';

export default function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = parseQueryParams(window.location.search);

        if (params.error) {
          setError(params.error);
          return;
        }

        if (!params.code) {
          setError('No authorization code received');
          return;
        }

        // Get the code verifier using our utility function
        const codeVerifier = getCodeVerifier();

        if (!codeVerifier) {
          console.error('No code verifier found in storage');
          setError('No code verifier found. Please try logging in again.');
          return;
        }

        console.log('Code verifier retrieved successfully');

        const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:8080/callback';

        const tokens = await fetchTokens(params.code, codeVerifier, clientId, redirectUri);
        storeTokens(tokens.access_token, tokens.refresh_token);

        // Use React Router's navigate instead of direct window location change
        navigate('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <ErrorBanner
          title="Authentication Error"
          message={error}
          onRetry={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
