# SpotifierFM

SpotifierFM is a modern web application that connects to your Spotify account and provides insights into your listening habits. It offers a beautiful, interactive dashboard to explore your top tracks, artists, genres, and more.

## Features

- **Dashboard Overview**: View your currently playing track, top tracks, top artists, and recently played music
- **Top Tracks Analysis**: Explore your most listened tracks with time period filtering (last 4 weeks, 6 months, all time)
- **Artist Insights**: Discover your favorite artists with detailed statistics
- **Genre Explorer**: Visualize your music taste by genre
- **Playlist Finder**: Find playlists that match your music taste with embedded players
- **Recent Activity**: Track your listening history with recently played tracks

## Technologies Used

- React.js with TypeScript
- Tailwind CSS for styling
- Spotify Web API for music data
- Vite for fast development and building

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- A Spotify account
- Spotify Developer credentials

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/spotifier-fm.git
   cd spotifier-fm
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your Spotify credentials:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id
   VITE_SPOTIFY_REDIRECT_URI=http://localhost:8080/callback
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:8080`

## Configuration

To use this application, you'll need to register it with Spotify:

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new application
3. Add `http://localhost:8080/callback` as a Redirect URI
4. Copy your Client ID to the `.env` file

## Building for Production

To create a production build:

```
npm run build
```

The built files will be in the `dist` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) for providing access to music data
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- [Lucide Icons](https://lucide.dev/) for the beautiful icons
