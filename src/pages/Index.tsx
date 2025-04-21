
import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { buildAuthUrl, generateCodeVerifier, generateCodeChallenge, storeCodeVerifier } from '@/utils/spotify-auth';
import { Music, BarChart, Mic, Headphones, TrendingUp } from 'lucide-react';

export default function Index() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store the code verifier using our utility function
      storeCodeVerifier(codeVerifier);
      console.log('Code verifier generated and stored:', codeVerifier.substring(0, 5) + '...');

      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:8080/callback';

      if (!clientId) {
        throw new Error('Missing Spotify client ID');
      }

      const authUrl = buildAuthUrl(clientId, redirectUri, codeChallenge);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-black to-blue-950 overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500 filter blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600 filter blur-3xl animate-pulse" style={{ animationDuration: '12s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-purple-500 filter blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl w-full text-center">
          <div className={`transition-all duration-1000 ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Music className="h-16 w-16 text-blue-400" />
                <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">SpotifierFM</span>
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
              Discover your music journey with personalized insights and trends from your Spotify listening habits.
            </p>

            {/* Feature Icons */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
              <div className="flex flex-col items-center p-4 rounded-xl bg-blue-950/50 backdrop-blur border border-blue-900/30 hover:bg-blue-900/30 transition-colors">
                <BarChart className="h-8 w-8 text-blue-400 mb-2" />
                <span className="text-gray-200 font-medium">Top Tracks</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-blue-950/50 backdrop-blur border border-blue-900/30 hover:bg-blue-900/30 transition-colors">
                <Mic className="h-8 w-8 text-blue-400 mb-2" />
                <span className="text-gray-200 font-medium">Top Artists</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-blue-950/50 backdrop-blur border border-blue-900/30 hover:bg-blue-900/30 transition-colors md:col-span-1 col-span-2">
                <Headphones className="h-8 w-8 text-blue-400 mb-2" />
                <span className="text-gray-200 font-medium">Music Insights</span>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 text-sm font-medium text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 transition-all duration-300 ease-out hover:scale-105"
            >
              <span className="relative rounded-md bg-blue-950 px-8 py-3.5 transition-all duration-300 ease-out group-hover:bg-opacity-0">
                {isLoading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  'Connect with Spotify'
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 text-center text-gray-500 text-xs">
          <p>© {new Date().getFullYear()} SpotifierFM. Powered by Spotify API.</p>
        </div>
      </div>
    </div>
  );
}
