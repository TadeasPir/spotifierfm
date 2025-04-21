import React from 'react';
import { Github, Heart, Code } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full py-4 px-6 bg-blue-950/80 backdrop-blur-sm border-t border-blue-900/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center">
          <span className="text-gray-400 text-sm">
            © {new Date().getFullYear()} SpotifierFM
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <Github className="h-4 w-4 mr-2" />
            <span className="text-sm">GitHub</span>
          </a>

          <a
            href="https://developer.spotify.com/documentation/web-api/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <Code className="h-4 w-4 mr-2" />
            <span className="text-sm">Spotify API</span>
          </a>

          <div className="flex items-center text-gray-400">
            <span className="text-sm">Made with</span>
            <Heart className="h-3 w-3 mx-1 text-red-500" />
            <span className="text-sm">and React</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
