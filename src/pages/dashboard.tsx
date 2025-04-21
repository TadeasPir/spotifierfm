import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { clearAuthData } from '@/utils/spotify-auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBanner } from '@/components/ErrorBanner';
import {
  PlayCircle,
  Mic,
  Clock,
  BarChart,
  Radio,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PlaylistGenerator } from '@/components/PlaylistGenerator';
import axios from 'axios';

interface CurrentlyPlaying {
  isPlaying: boolean;
  item?: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
    duration_ms: number;
    progress_ms?: number;
  };
}

interface TopItem {
  id: string;
  name: string;
  images?: { url: string }[];
  album?: {
    images: { url: string }[];
  };
  artists?: { name: string }[];
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  owner: {
    display_name: string;
  };
}

const Dashboard = () => {
  const { accessToken, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<CurrentlyPlaying | null>(null);
  const [topTracks, setTopTracks] = useState<TopItem[]>([]);
  const [topArtists, setTopArtists] = useState<TopItem[]>([]);
  const [recentTracks, setRecentTracks] = useState<any[]>([]);
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<Playlist[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 1000); // Ensure the refresh icon animation plays for at least 1 second
  };

  const fetchDashboardData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(undefined);

    try {
      // Fetch currently playing
      try {
        // Check if we need to request additional permissions
        const needsReauth = localStorage.getItem('needs_player_reauth');
        if (needsReauth === 'true') {
          console.log('Additional permissions needed for player');
          setCurrentlyPlaying({ isPlaying: false });
        } else {
          const currentResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (currentResponse.status === 204) {
            // No content - nothing playing
            setCurrentlyPlaying({ isPlaying: false });
          } else if (currentResponse.status === 403) {
            // Permission issue
            console.error('Permission denied for currently playing');
            localStorage.setItem('needs_player_reauth', 'true');
            setCurrentlyPlaying({ isPlaying: false });
          } else if (currentResponse.ok) {
            const data = await currentResponse.json();

            // Check if we have a valid item
            if (data.item) {
              setCurrentlyPlaying({
                isPlaying: data.is_playing,
                item: data.item
              });

              // Set up progress interval if track is playing
              if (data.is_playing && data.item) {
                if (progressInterval.current) {
                  clearInterval(progressInterval.current);
                }

                progressInterval.current = setInterval(() => {
                  setCurrentlyPlaying(prev => {
                    if (!prev || !prev.isPlaying || !prev.item) return prev;

                    const newProgress = (prev.item.progress_ms || 0) + 1000;
                    if (newProgress >= prev.item.duration_ms) {
                      // Stop the interval if we've reached the end of the track
                      if (progressInterval.current) {
                        clearInterval(progressInterval.current);
                      }
                      return { ...prev, isPlaying: false };
                    }

                    return {
                      ...prev,
                      item: {
                        ...prev.item,
                        progress_ms: newProgress
                      }
                    };
                  });
                }, 1000);
              }
            } else {
              // No item in the response
              setCurrentlyPlaying({ isPlaying: false });
            }
          } else {
            console.error('Failed to fetch currently playing:', currentResponse.status);
            setCurrentlyPlaying({ isPlaying: false });
          }
        }
      } catch (error) {
        console.error('Error fetching currently playing:', error);
        // Don't set global error for this one, just log it
        setCurrentlyPlaying({ isPlaying: false });
      }

      // Clear the reauth flag if we're refreshing
      if (refreshing) {
        localStorage.removeItem('needs_player_reauth');
      }

      // Fetch top tracks (short term)
      try {
        const tracksResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (tracksResponse.ok) {
          const data = await tracksResponse.json();
          setTopTracks(data.items);
        }
      } catch (error) {
        console.error('Error fetching top tracks:', error);
      }

      // Fetch top artists (short term)
      try {
        const artistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (artistsResponse.ok) {
          const data = await artistsResponse.json();
          setTopArtists(data.items);
        }
      } catch (error) {
        console.error('Error fetching top artists:', error);
      }

      // Fetch recently played
      try {
        const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (recentResponse.ok) {
          const data = await recentResponse.json();
          setRecentTracks(data.items);
        }
      } catch (error) {
        console.error('Error fetching recent tracks:', error);
      }

      // Featured playlists endpoint is not working, so we'll skip it

      // Fetch recommended playlists based on user's top artists
      if (topArtists.length > 0) {
        try {
          // We're not using seedArtists for the mood playlists endpoint
          // const seedArtists = topArtists.slice(0, 2).map(artist => artist.id).join(',');
          const recommendationsResponse = await fetch(`https://api.spotify.com/v1/browse/categories/mood/playlists?limit=5`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (recommendationsResponse.ok) {
            const data = await recommendationsResponse.json();
            setRecommendedPlaylists(data.playlists.items);
          }
        } catch (error) {
          console.error('Error fetching recommended playlists:', error);
        }
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);

      if (axios.isAxiosError(err)) {
        const statusCode = err.response?.status;
        const errorMessage = err.response?.data?.error?.message || err.message;
        setError(`Request failed with status code ${statusCode}: ${errorMessage}`);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  // Load initial data
  useEffect(() => {
    fetchDashboardData();
  }, [accessToken]);

  if (isLoading && !topTracks.length && !topArtists.length) {
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
          title="Failed to load dashboard"
          message={error}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-8 bg-gradient-to-br from-blue-950 via-black to-blue-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-2">Welcome back, {user?.display_name || 'music lover'}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Currently Playing Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <PlayCircle className="h-5 w-5 text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Currently Playing</h2>
            </div>
            {localStorage.getItem('needs_player_reauth') === 'true' && (
              <div className="text-sm text-amber-400 flex items-center">
                <button
                  onClick={() => {
                    localStorage.removeItem('needs_player_reauth');
                    clearAuthData();
                    window.location.href = '/';
                  }}
                  className="flex items-center space-x-2 rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Re-authenticate for player access
                </button>
              </div>
            )}
          </div>

          {currentlyPlaying?.isPlaying && currentlyPlaying.item ? (
            <div className="glass-card p-4 rounded-lg overflow-hidden">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <img
                  src={currentlyPlaying.item.album.images[0]?.url}
                  alt={currentlyPlaying.item.album.name}
                  className="w-32 h-32 rounded-md shadow-lg"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{currentlyPlaying.item.name}</h3>
                  <p className="text-gray-400">{currentlyPlaying.item.artists.map(a => a.name).join(', ')}</p>
                  <p className="text-gray-500 text-sm mt-1">{currentlyPlaying.item.album.name}</p>

                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${((currentlyPlaying.item.progress_ms || 0) / currentlyPlaying.item.duration_ms) * 100}%`,
                          transition: 'width 1s linear'
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>{formatTime(currentlyPlaying.item.progress_ms || 0)}</span>
                      <span>{formatTime(currentlyPlaying.item.duration_ms)}</span>
                    </div>
                  </div>

                  <button
                    className="mt-3 text-sm text-blue-400 hover:text-blue-300 flex items-center"
                    onClick={() => window.open(`https://open.spotify.com/track/${currentlyPlaying.item?.id}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" /> Open in Spotify
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-lg text-center">
              <p className="text-gray-400">Nothing playing right now</p>
              <p className="text-gray-500 text-sm mt-2">Start playing something on Spotify to see it here</p>
            </div>
          )}
        </section>

        {/* Playlist Finder */}
        <section className="mb-10">
          <PlaylistGenerator topTracks={topTracks} topArtists={topArtists} />
        </section>

        {/* Two Column Layout for Top Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Top Tracks Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <BarChart className="h-5 w-5 text-blue-400 mr-2" />
                <h2 className="text-xl font-semibold text-white">Your Top Tracks</h2>
              </div>
              <Link to="/trends" className="text-sm text-blue-400 hover:text-blue-300">View all</Link>
            </div>

            <div className="space-y-3">
              {topTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="glass-card p-3 rounded-lg flex items-center gap-3 hover:bg-blue-900/20 transition-colors cursor-pointer group"
                  onClick={() => window.open(`https://open.spotify.com/track/${track.id}`, '_blank')}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                    {index + 1}
                  </div>
                  <img
                    src={track.album?.images[0]?.url}
                    alt={track.name}
                    className="w-10 h-10 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-sm font-medium truncate group-hover:text-blue-400 transition-colors">{track.name}</h3>
                    <p className="text-gray-400 text-xs truncate">{track.artists?.map(a => a.name).join(', ')}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}

              {topTracks.length === 0 && (
                <div className="glass-card p-4 rounded-lg text-center">
                  <p className="text-gray-500">No top tracks found</p>
                </div>
              )}
            </div>
          </section>

          {/* Top Artists Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Mic className="h-5 w-5 text-blue-400 mr-2" />
                <h2 className="text-xl font-semibold text-white">Your Top Artists</h2>
              </div>
              <Link to="/artists" className="text-sm text-blue-400 hover:text-blue-300">View all</Link>
            </div>

            <div className="space-y-3">
              {topArtists.map((artist, index) => (
                <div
                  key={artist.id}
                  className="glass-card p-3 rounded-lg flex items-center gap-3 hover:bg-blue-900/20 transition-colors cursor-pointer group"
                  onClick={() => window.open(`https://open.spotify.com/artist/${artist.id}`, '_blank')}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                    {index + 1}
                  </div>
                  <img
                    src={artist.images?.[0]?.url}
                    alt={artist.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-sm font-medium truncate group-hover:text-blue-400 transition-colors">{artist.name}</h3>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}

              {topArtists.length === 0 && (
                <div className="glass-card p-4 rounded-lg text-center">
                  <p className="text-gray-500">No top artists found</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Recently Played Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Recently Played</h2>
            </div>
            <Link to="/recent" className="text-sm text-blue-400 hover:text-blue-300">View all</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {recentTracks && recentTracks.length > 0 ? recentTracks.map((item) => (
              <div
                key={`${item.track.id}-${item.played_at}`}
                className="glass-card p-4 rounded-lg hover:bg-blue-900/20 transition-colors cursor-pointer group"
                onClick={() => window.open(`https://open.spotify.com/track/${item.track.id}`, '_blank')}
              >
                <div className="relative mb-3">
                  <img
                    src={item.track.album.images[0]?.url}
                    alt={item.track.name}
                    className="w-full aspect-square rounded-md object-cover"
                  />
                  <div className="absolute inset-0 bg-blue-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                    <ExternalLink className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-white text-sm font-medium truncate group-hover:text-blue-400 transition-colors">{item.track.name}</h3>
                <p className="text-gray-400 text-xs truncate">{item.track.artists.map((a: { name: string }) => a.name).join(', ')}</p>
              </div>
            )) : (
              <div className="glass-card p-4 rounded-lg text-center col-span-full">
                <p className="text-gray-500">No recently played tracks found</p>
              </div>
            )}
          </div>
        </section>

        {/* Featured Playlists section removed due to API issues */}

        {/* Recommended Playlists */}
        {recommendedPlaylists.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center mb-4">
              <Radio className="h-5 w-5 text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Recommended For You</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {recommendedPlaylists && recommendedPlaylists.length > 0 ? recommendedPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="glass-card p-4 rounded-lg hover:bg-blue-900/20 transition-colors cursor-pointer group"
                  onClick={() => window.open(`https://open.spotify.com/playlist/${playlist.id}`, '_blank')}
                >
                  <div className="relative mb-3">
                    <img
                      src={playlist.images[0]?.url}
                      alt={playlist.name}
                      className="w-full aspect-square rounded-md object-cover"
                    />
                    <div className="absolute inset-0 bg-blue-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                      <ExternalLink className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-white text-sm font-medium truncate group-hover:text-blue-400 transition-colors">{playlist.name}</h3>
                  <p className="text-gray-400 text-xs truncate">By {playlist.owner.display_name}</p>
                </div>
              )) : (
                <div className="glass-card p-4 rounded-lg text-center col-span-full">
                  <p className="text-gray-500">No recommended playlists found</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
