
export interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
  popularity: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: {
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  popularity: number;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  images: { url: string }[];
  country: string;
  product: string;
}
