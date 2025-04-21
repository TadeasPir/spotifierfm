import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createSpotifyClient } from '@/utils/spotify-client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Clock, HelpCircle, Music, Info, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';

interface Artist {
  id: string;
  name: string;
  images: { url: string; height?: number; width?: number }[];
  genres: string[];
  popularity: number;
  followers?: { total: number };
}

export default function Artists() {
  const { accessToken } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [pageTitle, setPageTitle] = useState<string>('Your Top Artists');
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
    setArtists([]);
    setHasMore(true);
    handleRefresh(value, 0);
  };

  const handleRefresh = (selectedTimeRange: string = timeRange, currentPage: number = page) => {
    console.log(`Refreshing with time range: ${selectedTimeRange}, page: ${currentPage}`);
    setIsLoading(true);
    setError(undefined);

    const fetchArtists = async () => {
      if (!accessToken) return;

      try {
        const spotify = createSpotifyClient(accessToken);
        console.log(`Calling API with time range: ${selectedTimeRange}, page: ${currentPage}`);

        const limit = 20;
        const offset = currentPage * limit;

        // Fetch top artists with the selected time range and pagination
        const response = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${selectedTimeRange}&limit=${limit}&offset=${offset}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch artists: ${response.status}`);
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

        setPageTitle(`Your Top Artists ${timeRangeLabel}`);
        const newArtists = data.items;

        if (newArtists.length === 0) {
          setHasMore(false);
        } else {
          setPage(currentPage + 1);
          setArtists(prev => currentPage === 0 ? newArtists : [...prev, ...newArtists]);
        }
      } catch (err) {
        console.error('Error fetching artists:', err);

        if (axios.isAxiosError(err)) {
          const statusCode = err.response?.status;
          const errorMessage = err.response?.data?.error?.message || err.message;
          setError(`Request failed with status code ${statusCode}: ${errorMessage}`);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch artists');
        }
      } finally {
        setIsLoading(false);
        setInitialLoad(false);
      }
    };

    fetchArtists();
  };

  // Load initial data
  useEffect(() => {
    handleRefresh(timeRange, 0);
  }, [accessToken]);

  // Set up intersection observer for infinite scrolling
  const lastArtistRef = useCallback((node: HTMLDivElement) => {
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
  if (initialLoad && isLoading && artists.length === 0) {
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
          title="Failed to load artists"
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
            <h1 className="text-4xl font-bold text-white">{pageTitle}</h1>
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
          {artists.map((artist, index) => (
            <div
              key={artist.id}
              ref={index === artists.length - 1 ? lastArtistRef : undefined}
              className="glass-card overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/30 relative group cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => window.open(`https://open.spotify.com/artist/${artist.id}`, '_blank')}
            >
              <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm z-10">
                {index + 1}
              </div>

              <div className="relative">
                <img
                  src={artist.images[0]?.url || 'https://via.placeholder.com/300?text=No+Image'}
                  alt={artist.name}
                  className="aspect-square w-full rounded-md object-cover"
                />
                <div className="absolute inset-0 bg-blue-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                  <ExternalLink className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{artist.name}</h3>
                <p className="text-sm text-gray-400 truncate">
                  {artist.genres.slice(0, 2).join(', ')}
                </p>
                <div className="flex items-center justify-between mt-2">
                  {artist.followers && (
                    <p className="text-xs text-gray-500">
                      {artist.followers.total.toLocaleString()} followers
                    </p>
                  )}
                  <div className="flex items-center">
                    <div className="h-1.5 w-16 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${artist.popularity}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 ml-1">{artist.popularity}%</span>
                    <div className="relative ml-1 group">
                      <Info className="h-3 w-3 text-gray-500 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-xs text-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p>Popularity score based on Spotify's algorithm that considers number of plays and how recent they are.</p>
                      </div>
                    </div>
                  </div>
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

        {!isLoading && !hasMore && artists.length > 0 && (
          <div className="text-center my-8 text-gray-400">
            <p>You've reached the end of your top artists</p>
          </div>
        )}
      </div>
    </div>
  );
}
