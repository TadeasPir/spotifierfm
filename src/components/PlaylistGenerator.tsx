import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { Music, Search, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';

interface PlaylistGeneratorProps {
  topTracks?: any[];
  topArtists?: any[];
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  owner: {
    display_name: string;
  };
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export const PlaylistGenerator = ({ topTracks = [], topArtists = [] }: PlaylistGeneratorProps) => {
  const { accessToken } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [foundPlaylists, setFoundPlaylists] = useState<Playlist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [featuredPlaylistId, setFeaturedPlaylistId] = useState<string>('');

  // Generate search terms based on user's top artists and genres
  const generateSearchTerms = () => {
    const searchTerms = [];

    // Add top artists
    if (topArtists && topArtists.length > 0) {
      // Get a random top artist
      const randomArtist = topArtists[Math.floor(Math.random() * Math.min(topArtists.length, 3))];
      searchTerms.push(randomArtist.name);
    }

    // Add some common genres
    const genres = ['indie', 'chill', 'focus', 'mood', 'discover', 'vibes', 'hits'];
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    searchTerms.push(randomGenre);

    // Create a search query
    return searchTerms.join(' ');
  };

  // Get a featured playlist ID based on a category
  const getFeaturedPlaylistId = () => {
    // Popular curated playlist IDs from Spotify
    const featuredPlaylists = [
      '37i9dQZF1DXcBWIGoYBM5M', // Today's Top Hits
      '37i9dQZF1DX0XUsuxWHRQd', // RapCaviar
      '37i9dQZF1DX4dyzvuaRJ0n', // mint
      '37i9dQZF1DX4SBhb3fqCJd', // Are & Be
      '37i9dQZF1DX1lVhptIYRda', // Hot Country
      '37i9dQZF1DXcF6B6QPhFDv', // Rock This
      '37i9dQZF1DX4o1oenSJRJd', // All Out 2000s
      '37i9dQZF1DX10zKzsJ2jva', // Viva Latino
      '37i9dQZF1DWXRqgorJj26U', // Rock Classics
      '37i9dQZF1DX4UtSsGT1Sbe', // All Out 80s
      '37i9dQZF1DWWMOWPc3VOKc', // Indie Hits
      '37i9dQZF1DX8NTLI2TtZa6', // Chill Vibes
    ];

    return featuredPlaylists[Math.floor(Math.random() * featuredPlaylists.length)];
  };

  // Set a random featured playlist on component mount
  useEffect(() => {
    setFeaturedPlaylistId(getFeaturedPlaylistId());
  }, []);

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    setFoundPlaylists([]);

    try {
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Generate search query if not already set
      const query = searchQuery || generateSearchTerms();
      setSearchQuery(query);

      // Search for playlists
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search playlists: ${response.status}`);
      }

      const data = await response.json();

      if (data.playlists && data.playlists.items && data.playlists.items.length > 0) {
        setFoundPlaylists(data.playlists.items);
      } else {
        setError('No playlists found. Try a different search term.');
      }

    } catch (err) {
      console.error('Error searching playlists:', err);
      setError(err instanceof Error ? err.message : 'Failed to search playlists');
    } finally {
      setIsSearching(false);
    }
  };



  return (
    <div className="glass-card p-6 rounded-lg">
      <div className="flex items-center mb-4">
        <Sparkles className="h-5 w-5 text-blue-400 mr-2" />
        <h2 className="text-xl font-semibold text-white">Playlist Finder</h2>
      </div>

      <p className="text-gray-400 mb-6">
        Find playlists that match your music taste. We'll search Spotify for playlists based on your favorite artists and genres.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md flex items-center text-red-300">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mb-6">
        {foundPlaylists.length === 0 && !selectedPlaylist ? (
          <div>
            <div className="space-y-4 mb-8">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter artist, genre or mood (e.g. 'chill indie')"
                className="w-full px-3 py-2 bg-blue-950/50 border border-blue-900/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full py-3 px-4 rounded-md bg-blue-600 text-white font-medium flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find Playlists
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-white font-medium mb-4">Found Playlists</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {foundPlaylists && foundPlaylists.map((playlist) => playlist && (
                <div
                  key={playlist.id}
                  className="glass-card p-3 rounded-lg hover:bg-blue-900/20 transition-colors group"
                >
                  <div className="flex gap-3">
                    {playlist.images && playlist.images.length > 0 ? (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-16 h-16 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                        <Music className="h-8 w-8 text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm font-medium truncate group-hover:text-blue-400 transition-colors">{playlist.name}</h4>
                      <p className="text-gray-400 text-xs truncate">By {playlist.owner?.display_name || 'Unknown'}</p>
                      <p className="text-gray-500 text-xs mt-1">{playlist.tracks?.total || '?'} tracks</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <button
                          onClick={() => setSelectedPlaylist(playlist)}
                          className="text-xs px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 rounded text-blue-300 flex items-center transition-colors"
                        >
                          <Music className="h-3 w-3 mr-1" />
                          Preview
                        </button>
                        <button
                          onClick={() => window.open(playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist.id}`, '_blank')}
                          className="text-xs px-2 py-1 bg-green-600/30 hover:bg-green-600/50 rounded text-green-300 flex items-center transition-colors"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedPlaylist ? (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium">Preview: {selectedPlaylist.name}</h3>
                  <button
                    onClick={() => setSelectedPlaylist(null)}
                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 flex items-center transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
                <div className="w-full rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={`https://open.spotify.com/embed/playlist/${selectedPlaylist.id}?utm_source=generator&theme=0`}
                    width="100%"
                    height="380"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={`Spotify playlist: ${selectedPlaylist.name}`}
                  ></iframe>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setFoundPlaylists([]);
                  setSearchQuery('');
                  setSelectedPlaylist(null);
                }}
                className="mt-4 w-full py-2 px-4 rounded-md bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors"
              >
                New Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
