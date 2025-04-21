import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createSpotifyClient } from '@/utils/spotify-client';
import { clearAuthData } from '@/utils/spotify-auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Clock, History, LogOut, ExternalLink } from 'lucide-react';
import axios from 'axios';

interface RecentTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album?: {
    images: { url: string; height?: number; width?: number }[];
  };
  played_at: string; // ISO timestamp
}

export default function Recent() {
  const { accessToken } = useAuth();
  const [tracks, setTracks] = useState<RecentTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleRefresh = (currentPage: number = page) => {
    console.log(`Refreshing recently played tracks, page: ${currentPage}`);
    setIsLoading(true);
    setError(undefined);

    const fetchRecentTracks = async () => {
      if (!accessToken) return;

      // Check if we need to request additional permissions
      const needsReauth = localStorage.getItem('needs_recently_played_reauth');
      if (needsReauth === 'true') {
        setError('Additional permissions needed. Please log out and log back in to access your recently played tracks.');
        setIsLoading(false);
        return;
      }

      try {
        // For recently played tracks, we need to use a different endpoint
        const limit = 20;
        const after = currentPage > 0 && tracks.length > 0
          ? new Date(tracks[tracks.length - 1].played_at).getTime()
          : undefined;

        // Build the URL with optional after parameter
        let url = `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`;
        if (after) {
          url += `&after=${after}`;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          // If we get a 403 error, it means we need additional permissions
          if (response.status === 403) {
            localStorage.setItem('needs_recently_played_reauth', 'true');
            throw new Error(`Failed to fetch recent tracks: ${response.status}`);
          } else {
            throw new Error(`Failed to fetch recent tracks: ${response.status}`);
          }
        }

        const data = await response.json();
        const newTracks = data.items.map((item: any) => ({
          ...item.track,
          played_at: item.played_at
        }));

        if (newTracks.length === 0) {
          setHasMore(false);
        } else {
          setPage(currentPage + 1);
          setTracks(prev => currentPage === 0 ? newTracks : [...prev, ...newTracks]);
        }
      } catch (err) {
        console.error('Error fetching recent tracks:', err);

        if (axios.isAxiosError(err)) {
          const statusCode = err.response?.status;
          const errorMessage = err.response?.data?.error?.message || err.message;
          setError(`Request failed with status code ${statusCode}: ${errorMessage}`);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch recent tracks');
        }
      } finally {
        setIsLoading(false);
        setInitialLoad(false);
      }
    };

    fetchRecentTracks();
  };

  // Load initial data
  useEffect(() => {
    handleRefresh(0);
  }, [accessToken]);

  // Set up intersection observer for infinite scrolling
  const lastTrackRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        handleRefresh(page);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [isLoading, hasMore, page]);

  // Format the played_at timestamp to a readable format
  const formatPlayedAt = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

    return date.toLocaleDateString();
  };

  // Only show the loading spinner on initial load
  if (initialLoad && isLoading && tracks.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleLogout = () => {
    // Clear the reauth flag
    localStorage.removeItem('needs_recently_played_reauth');
    clearAuthData();
    window.location.href = '/';
  };

  if (error) {
    const needsReauth = localStorage.getItem('needs_recently_played_reauth') === 'true';

    return (
      <div className="p-4">
        <ErrorBanner
          title="Failed to load recent tracks"
          message={error}
          onRetry={needsReauth ? undefined : () => handleRefresh(0)}
        />

        {needsReauth && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout and Re-authenticate</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-8 bg-gradient-to-br from-blue-950 via-black to-blue-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Recently Played Tracks</h1>
            <p className="text-gray-400 mt-2">Your listening history from Spotify</p>
          </div>
          <button
            onClick={() => handleRefresh(0)}
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isLoading && !initialLoad ? 'opacity-50' : ''} transition-opacity duration-300`}>
          {tracks.map((track, index) => (
            <div
              key={`${track.id}-${track.played_at}`}
              ref={index === tracks.length - 1 ? lastTrackRef : undefined}
              className="glass-card overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/30 relative group cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => window.open(`https://open.spotify.com/track/${track.id}`, '_blank')}
            >
              <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm z-10">
                {index + 1}
              </div>

              <div className="relative">
                <img
                  src={track.album?.images[0]?.url || 'https://via.placeholder.com/300?text=No+Image'}
                  alt={track.name}
                  className="aspect-square w-full rounded-md object-cover"
                />
                <div className="absolute inset-0 bg-blue-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                  <ExternalLink className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{track.name}</h3>
                <p className="text-sm text-gray-400">
                  {track.artists.map(a => a.name).join(', ')}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <History className="h-3 w-3 mr-1" />
                  <span>{formatPlayedAt(track.played_at)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1" /> Open in Spotify
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Loading indicator at the bottom for infinite scroll */}
        {isLoading && !initialLoad && (
          <div className="flex justify-center my-8">
            <LoadingSpinner size="md" />
          </div>
        )}

        {!isLoading && !hasMore && tracks.length > 0 && (
          <div className="text-center my-8 text-gray-400">
            <p>You've reached the end of your recently played tracks</p>
          </div>
        )}

        {!isLoading && tracks.length === 0 && (
          <div className="text-center my-8 text-gray-400">
            <p>No recently played tracks found</p>
          </div>
        )}
      </div>
    </div>
  );
}
