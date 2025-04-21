
import axios from 'axios';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export interface SpotifyClient {
  getGlobalTrends: (options?: { time_range?: string; region?: string }) => Promise<any>;
  getArtistDetails: (artistId: string) => Promise<any>;
  getUserStats: () => Promise<any>;
  getRecommendations: (seeds: { artists?: string[]; tracks?: string[] }) => Promise<any>;
}

export function createSpotifyClient(token: string): SpotifyClient {
  const api = axios.create({
    baseURL: SPOTIFY_API_URL,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return {
    async getGlobalTrends(options?: { time_range?: string; region?: string }) {
      try {
        const params = options || {};
        if (options?.region) {
          params.country = options.region;
        }

        // Try multiple endpoints in sequence until one works
        try {
          // First try: Get user's top tracks
          console.log('Attempting to fetch user\'s top tracks...');
          try {
            // Extract the time range and offset from the params
            const timeRange = params.time_range || 'medium_term';
            const offset = params.offset || 0;
            console.log(`Fetching top tracks with time range: ${timeRange}, offset: ${offset}`);
            const topTracksResponse = await api.get('/me/top/tracks', {
              params: {
                limit: 20,
                offset: offset,
                time_range: timeRange
              }
            });
            // Update the name based on the time range
            let timeRangeLabel = '';
            switch(timeRange) {
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

            console.log('Successfully fetched user\'s top tracks');
            return {
              name: `Your Top Tracks ${timeRangeLabel}`,
              tracks: {
                items: topTracksResponse.data.items.map((track: any) => ({ track }))
              }
            };
          } catch (topTracksError) {
            console.log('Failed to fetch user\'s top tracks:', topTracksError.message);

            // Second try: Get new releases
            console.log('Attempting to fetch new releases...');
            try {
              const newReleasesResponse = await api.get('/browse/new-releases', { params: { limit: 20 } });
              console.log('Successfully fetched new releases');
              return {
                name: 'New Releases',
                tracks: {
                  items: newReleasesResponse.data.albums.items.map((album: any) => ({
                    track: {
                      id: album.id,
                      name: album.name,
                      artists: album.artists,
                      album: {
                        images: album.images
                      }
                    }
                  }))
                }
              };
            } catch (newReleasesError) {
              console.log('Failed to fetch new releases:', newReleasesError.message);

              // Third try: Get featured playlists
              console.log('Attempting to fetch featured playlists...');
              const featuredResponse = await api.get('/browse/featured-playlists', { params });
              const firstPlaylistId = featuredResponse.data.playlists.items[0]?.id;

              if (!firstPlaylistId) {
                throw new Error('No featured playlists available');
              }

              console.log('Fetching tracks from featured playlist:', firstPlaylistId);
              const playlistResponse = await api.get(`/playlists/${firstPlaylistId}`);
              return playlistResponse.data;
            }
          }
        } catch (error) {
          // Last resort: Create a mock playlist with a helpful error message
          console.error('All methods to fetch music failed');
          return {
            name: 'Could Not Load Music',
            tracks: {
              items: [{
                track: {
                  id: 'error-track',
                  name: 'Unable to load tracks from Spotify',
                  artists: [{ name: 'Please try again later' }],
                  album: {
                    images: [{ url: 'https://via.placeholder.com/300?text=Error+Loading+Music' }]
                  }
                }
              }]
            }
          };
        }
      } catch (error) {
        console.error('Critical error in getGlobalTrends:', error);
        throw error;
      }
    },

    async getArtistDetails(artistId: string) {
      const [artist, topTracks, related] = await Promise.all([
        api.get(`/artists/${artistId}`),
        api.get(`/artists/${artistId}/top-tracks?market=US`),
        api.get(`/artists/${artistId}/related-artists`)
      ]);

      return {
        ...artist.data,
        topTracks: topTracks.data.tracks,
        relatedArtists: related.data.artists
      };
    },

    async getUserStats() {
      const [topArtists, topTracks, recentlyPlayed] = await Promise.all([
        api.get('/me/top/artists'),
        api.get('/me/top/tracks'),
        api.get('/me/player/recently-played')
      ]);

      return {
        topArtists: topArtists.data.items,
        topTracks: topTracks.data.items,
        recentlyPlayed: recentlyPlayed.data.items
      };
    },

    async getRecommendations(seeds) {
      const params = {
        seed_artists: seeds.artists?.join(','),
        seed_tracks: seeds.tracks?.join(','),
        limit: 20
      };

      const response = await api.get('/recommendations', { params });
      return response.data;
    }
  };
}
