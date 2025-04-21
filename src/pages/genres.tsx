import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createSpotifyClient } from '@/utils/spotify-client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Clock, HelpCircle, Tag, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';

interface Genre {
  id: string; // We'll generate this
  name: string;
  count: number;
  artists: string[]; // Artist names
}

export default function Genres() {
  const { accessToken } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [pageTitle, setPageTitle] = useState<string>('Your Top Genres');
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
    setGenres([]);
    setHasMore(true);
    handleRefresh(value, 0);
  };

  const handleRefresh = (selectedTimeRange: string = timeRange, currentPage: number = page) => {
    console.log(`Refreshing with time range: ${selectedTimeRange}, page: ${currentPage}`);
    setIsLoading(true);
    setError(undefined);

    const fetchGenres = async () => {
      if (!accessToken) return;

      try {
        // For genres, we need to get the user's top artists first
        const limit = 50; // Get more artists to extract genres
        const offset = currentPage * limit;

        // Get top artists
        const response = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${selectedTimeRange}&limit=${limit}&offset=${offset}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch artists: ${response.status}`);
        }

        const data = await response.json();

        // Extract and count genres
        const genreCounts = new Map<string, { count: number, artists: string[] }>();

        data.items.forEach((artist: any) => {
          if (artist.genres && artist.genres.length > 0) {
            artist.genres.forEach((genre: string) => {
              if (!genreCounts.has(genre)) {
                genreCounts.set(genre, { count: 0, artists: [] });
              }

              const genreData = genreCounts.get(genre)!;
              genreData.count += 1;

              // Add artist if not already in the list
              if (!genreData.artists.includes(artist.name)) {
                genreData.artists.push(artist.name);
              }
            });
          }
        });

        // Convert to array and sort by count
        const genresList = Array.from(genreCounts.entries()).map(([name, data]) => ({
          id: name.replace(/\s+/g, '-').toLowerCase(), // Generate ID from name
          name,
          count: data.count,
          artists: data.artists
        }));

        // Sort by count (descending)
        genresList.sort((a, b) => b.count - a.count);

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

        setPageTitle(`Your Top Genres ${timeRangeLabel}`);

        if (genresList.length === 0 || data.items.length < limit) {
          setHasMore(false);
        } else {
          setPage(currentPage + 1);
        }

        // If this is the first page, replace genres, otherwise append
        if (currentPage === 0) {
          setGenres(genresList);
        } else {
          // Merge with existing genres, avoiding duplicates
          const existingGenreIds = new Set(genres.map(g => g.id));
          const newGenres = genresList.filter(g => !existingGenreIds.has(g.id));
          setGenres(prev => [...prev, ...newGenres]);
        }
      } catch (err) {
        console.error('Error fetching genres:', err);

        if (axios.isAxiosError(err)) {
          const statusCode = err.response?.status;
          const errorMessage = err.response?.data?.error?.message || err.message;
          setError(`Request failed with status code ${statusCode}: ${errorMessage}`);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch genres');
        }
      } finally {
        setIsLoading(false);
        setInitialLoad(false);
      }
    };

    fetchGenres();
  };

  // Load initial data
  useEffect(() => {
    handleRefresh(timeRange, 0);
  }, [accessToken]);

  // Set up intersection observer for infinite scrolling
  const lastGenreRef = useCallback((node: HTMLDivElement) => {
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
  if (initialLoad && isLoading && genres.length === 0) {
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
          title="Failed to load genres"
          message={error}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  // Generate a color based on genre name for visual variety
  const getGenreColor = (genreName: string) => {
    // Simple hash function to generate a consistent hue for each genre name
    const hash = genreName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Use the hash to generate a hue between 200 and 280 (blue to purple range)
    const hue = 200 + (Math.abs(hash) % 80);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Get a genre image based on the genre name
  const getGenreImage = (genreName: string) => {
    // Map of common genres to image URLs
    const genreImages: Record<string, string> = {
      'pop': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop',
      'rock': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=300&auto=format&fit=crop',
      'hip hop': 'https://images.unsplash.com/photo-1571609803595-0f6a9603e9b5?q=80&w=300&auto=format&fit=crop',
      'rap': 'https://images.unsplash.com/photo-1621153754774-aa64186dff1e?q=80&w=300&auto=format&fit=crop',
      'electronic': 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?q=80&w=300&auto=format&fit=crop',
      'dance': 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=300&auto=format&fit=crop',
      'indie': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
      'alternative': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=300&auto=format&fit=crop',
      'metal': 'https://images.unsplash.com/photo-1604514628550-55692e9c2505?q=80&w=300&auto=format&fit=crop',
      'jazz': 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=300&auto=format&fit=crop',
      'classical': 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?q=80&w=300&auto=format&fit=crop',
      'folk': 'https://images.unsplash.com/photo-1485579149621-3123dd979885?q=80&w=300&auto=format&fit=crop',
      'country': 'https://images.unsplash.com/photo-1543872084-c7bd3822856f?q=80&w=300&auto=format&fit=crop',
      'soul': 'https://images.unsplash.com/photo-1605722243979-fe0be8158232?q=80&w=300&auto=format&fit=crop',
      'r&b': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=300&auto=format&fit=crop',
      'blues': 'https://images.unsplash.com/photo-1610041321420-a596dd14ebc9?q=80&w=300&auto=format&fit=crop',
      'reggae': 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
      'punk': 'https://images.unsplash.com/photo-1598387846148-47e82ee120cc?q=80&w=300&auto=format&fit=crop'
    };

    // Check if we have an exact match
    if (genreImages[genreName.toLowerCase()]) {
      return genreImages[genreName.toLowerCase()];
    }

    // Check if the genre name contains any of our known genres
    for (const [key, url] of Object.entries(genreImages)) {
      if (genreName.toLowerCase().includes(key)) {
        return url;
      }
    }

    // Default image for unknown genres
    return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=300&auto=format&fit=crop';
  };

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
          {genres.map((genre, index) => (
            <div
              key={genre.id}
              ref={index === genres.length - 1 ? lastGenreRef : undefined}
              className="glass-card overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/30 relative group cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => window.open(`https://open.spotify.com/search/${encodeURIComponent(genre.name)}%20genre`, '_blank')}
            >
              <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm z-10">
                {index + 1}
              </div>

              <div className="relative">
                <div className="h-40 rounded-md overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30">
                  <img
                    src={getGenreImage(genre.name)}
                    alt={genre.name}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(to bottom, transparent 0%, ${getGenreColor(genre.name)}80 100%)`
                    }}
                  >
                    <div
                      className="text-5xl p-6 rounded-full flex items-center justify-center"
                      style={{
                        background: `radial-gradient(circle, ${getGenreColor(genre.name)}40 0%, transparent 70%)`,
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                      }}
                    >
                      <Tag />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-blue-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                  <ExternalLink className="h-10 w-10 text-white" />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-white capitalize group-hover:text-blue-400 transition-colors">{genre.name}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {genre.count} {genre.count === 1 ? 'artist' : 'artists'}
                </p>
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Top artists:</p>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {genre.artists.slice(0, 3).join(', ')}
                    {genre.artists.length > 3 && ` and ${genre.artists.length - 3} more`}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1" /> Search on Spotify
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

        {!isLoading && !hasMore && genres.length > 0 && (
          <div className="text-center my-8 text-gray-400">
            <p>You've reached the end of your top genres</p>
          </div>
        )}
      </div>
    </div>
  );
}
