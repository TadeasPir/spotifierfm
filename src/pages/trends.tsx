
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createSpotifyClient } from '@/utils/spotify-client';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Clock, Calendar, HelpCircle, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';

interface TrendingTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album?: {
    images: { url: string; height?: number; width?: number }[];
  };
  // For album-only responses (like new releases)
  images?: { url: string; height?: number; width?: number }[];
}

export default function Trends() {
  const { accessToken } = useAuth();
  const [tracks, setTracks] = useState<TrendingTrack[]>([]);
  const [playlistName, setPlaylistName] = useState<string>('Featured Music');
  const [timeRange, setTimeRange] = useState<string>('medium_term');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);



  const handleTimeRangeChange = (value: string) => {
    console.log(`Time range changed to: ${value}`);
    setTimeRange(value);
    setPage(0);
    setTracks([]);
    setHasMore(true);
    handleRefresh(value, 0);
  };

  const handleRefresh = (selectedTimeRange: string = timeRange, currentPage: number = page) => {
    console.log(`Refreshing with time range: ${selectedTimeRange}, page: ${currentPage}`);
    setIsLoading(true);
    setError(undefined);
    // Re-fetch the data
    const fetchTrends = async () => {
      if (!accessToken) return;

      try {
        const spotify = createSpotifyClient(accessToken);
        console.log(`Calling API with time range: ${selectedTimeRange}, page: ${currentPage}`);

        // For top tracks, we need to use direct API call to support pagination
        if (playlistName.includes('Your Top Tracks') || currentPage > 0) {
          const limit = 20;
          const offset = currentPage * limit;

          // Direct API call for pagination
          const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${selectedTimeRange}&limit=${limit}&offset=${offset}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch tracks: ${response.status}`);
          }

          const data = await response.json();

          // Update the title based on the time range
          let timeRangeLabel = '';
          switch(selectedTimeRange) {
            case 'short_term':
              timeRangeLabel = '(Last 4 Weeks)';
              break;
            case 'medium_term':
              timeRangeLabel = '(Last 6 Months)';
              break;
            case 'long_term':
              timeRangeLabel = '(All Time)';
              break;
            default:
              timeRangeLabel = '';
          }

          setPlaylistName(`Your Top Tracks ${timeRangeLabel}`);

          const newTracks = data.items;

          if (newTracks.length === 0) {
            setHasMore(false);
          } else {
            setPage(currentPage + 1);
            setTracks(prev => currentPage === 0 ? newTracks : [...prev, ...newTracks]);
          }
          return;
        }

        // For other playlists, use the original method
        const data = await spotify.getGlobalTrends({ time_range: selectedTimeRange });

        if (data.name) {
          setPlaylistName(data.name);
        }

        // Process the data as before
        try {
          if (data.tracks && Array.isArray(data.tracks.items)) {
            const trackItems = data.tracks.items.map((item: any) => {
              return item.track || item;
            }).filter(Boolean);

            if (trackItems.length === 0) {
              setError('No tracks found. Please try again later.');
              return;
            }

            if (currentPage === 0) {
              setTracks(trackItems);
            } else {
              setTracks(prev => [...prev, ...trackItems]);
            }
            setPage(currentPage + 1);
          } else if (data.albums && Array.isArray(data.albums.items)) {
            const trackItems = data.albums.items.map((album: any) => ({
              id: album.id,
              name: album.name,
              artists: album.artists,
              album: {
                images: album.images
              }
            }));

            if (currentPage === 0) {
              setTracks(trackItems);
            } else {
              setTracks(prev => [...prev, ...trackItems]);
            }
            setPage(currentPage + 1);
          } else {
            setError('Received unexpected data format from Spotify');
          }
        } catch (parseError) {
          setError('Error processing music data: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const statusCode = err.response?.status;
          const errorMessage = err.response?.data?.error?.message || err.message;
          setError(`Request failed with status code ${statusCode}: ${errorMessage}`);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch trends');
        }
      } finally {
        setIsLoading(false);
        setInitialLoad(false);
      }
    };

    fetchTrends();
  };

  // Load initial data
  useEffect(() => {
    handleRefresh(timeRange, 0);
  }, [accessToken]);

  // Set up intersection observer for infinite scrolling
  const lastTrackRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        handleRefresh(timeRange, page);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [isLoading, hasMore, timeRange, page]);

  // Only show the loading spinner on initial load
  if (initialLoad && isLoading && tracks.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorBanner
          title="Failed to load trends"
          message={error}
          onRetry={handleRefresh}
        />

      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-8 bg-gradient-to-br from-blue-950 via-black to-blue-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">{playlistName}</h1>
            {playlistName.includes('Your Top Tracks') && (
              <div className="mt-2 flex flex-wrap items-center text-gray-400 text-sm">
                <div className="flex items-center mr-2 mb-2">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Time range: </span>
                  <div className="relative ml-1 group">
                    <HelpCircle className="h-3 w-3 text-gray-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-xs text-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <p className="mb-1"><strong>Last 4 weeks:</strong> Your recent favorites</p>
                      <p className="mb-1"><strong>Last 6 months:</strong> Your medium-term favorites</p>
                      <p><strong>All time:</strong> Your all-time favorites since you started using Spotify</p>
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <Select value={timeRange} onValueChange={handleTimeRangeChange} disabled={isLoading}>
                    <SelectTrigger className="ml-0 md:ml-2 w-[180px] h-8 bg-black/30 border-gray-700 text-white hover:bg-black/50 transition-colors">
                      <div className="flex items-center">
                        {isLoading ? (
                          <div className="w-2 h-2 rounded-full mr-2 bg-blue-500 animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 rounded-full mr-2 bg-blue-500" />
                        )}
                        <SelectValue placeholder="Select time range" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 text-white border-gray-700">
                      <SelectItem value="short_term" className="hover:bg-gray-800">
                        <div className="flex items-center">
                          <span>Last 4 weeks</span>

                        </div>
                      </SelectItem>
                      <SelectItem value="medium_term" className="hover:bg-gray-800">
                        <div className="flex items-center">
                          <span>Last 6 months</span>

                        </div>
                      </SelectItem>
                      <SelectItem value="long_term" className="hover:bg-gray-800">
                        <div className="flex items-center">
                          <span>All time</span>

                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => handleRefresh()}
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isLoading && !initialLoad ? 'opacity-50' : ''} transition-opacity duration-300`}>
          {tracks.map((track, index) => (
            <div
              key={track.id}
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
                  src={track.album?.images[0]?.url || track.images?.[0]?.url || 'https://via.placeholder.com/300?text=No+Image'}
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
                <p className="text-xs text-gray-500 mt-1 flex items-center">
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
            <p>You've reached the end of your top tracks</p>
          </div>
        )}
      </div>
    </div>
  );
}
