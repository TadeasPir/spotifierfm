import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { clearAuthData } from '@/utils/spotify-auth';
import { Music, Home, BarChart, LogOut, User, Mic, Disc, Tag, History, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthData();
    // Force a page reload to clear React state and properly redirect to login
    window.location.href = '/';
  };

  // Don't show navbar on login page or callback page
  if (location.pathname === '/' || location.pathname === '/callback') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-900/40 bg-blue-900 backdrop-blur supports-[backdrop-filter]:bg-blue-900/95">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4">
            <Link to="/" className="flex items-center space-x-2">
              <Music className="h-6 w-6 text-white" />
              <span className="hidden font-bold sm:inline-block">
                SpotifierFM
              </span>
            </Link>
          </div>

          {isAuthenticated && (
            <NavigationMenu>
              <NavigationMenuList className="flex space-x-1">
              <NavigationMenuItem>
                <Link to="/dashboard">
                  <div className={cn(
                    navigationMenuTriggerStyle(),
                    location.pathname === '/dashboard' ? 'bg-white text-blue-900 font-medium' : 'bg-blue-900 text-white'
                  )}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </div>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/trends">
                  <div className={cn(
                    navigationMenuTriggerStyle(),
                    location.pathname === '/trends' ? 'bg-white text-blue-900 font-medium' : 'bg-blue-900 text-white'
                  )}>
                    <BarChart className="mr-2 h-4 w-4" />
                    <span>Tracks</span>
                  </div>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/artists">
                  <div className={cn(
                    navigationMenuTriggerStyle(),
                    location.pathname === '/artists' ? 'bg-white text-blue-900 font-medium' : 'bg-blue-900 text-white'
                  )}>
                    <Mic className="mr-2 h-4 w-4" />
                    <span>Artists</span>
                  </div>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/albums">
                  <div className={cn(
                    navigationMenuTriggerStyle(),
                    location.pathname === '/albums' ? 'bg-white text-blue-900 font-medium' : 'bg-blue-900 text-white'
                  )}>
                    <Disc className="mr-2 h-4 w-4" />
                    <span>Albums</span>
                  </div>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/genres">
                  <div className={cn(
                    navigationMenuTriggerStyle(),
                    location.pathname === '/genres' ? 'bg-white text-blue-900 font-medium' : 'bg-blue-900 text-white'
                  )}>
                    <Tag className="mr-2 h-4 w-4" />
                    <span>Genres</span>
                  </div>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/recent">
                  <div className={cn(
                    navigationMenuTriggerStyle(),
                    location.pathname === '/recent' ? 'bg-white text-blue-900 font-medium' : 'bg-blue-900 text-white'
                  )}>
                    <History className="mr-2 h-4 w-4" />
                    <span>Recent</span>
                  </div>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        )}
        </div>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="text-white hover:text-blue-900 hover:bg-white">
                <LogOut className="h-5 w-5" />
              </Button>
              {user && (
                <div className="flex items-center">
                  <span className="mr-2 text-sm font-medium hidden md:inline-block">
                    {user.display_name}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.images?.[0]?.url} alt={user.display_name} />
                    <AvatarFallback>{user.display_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link to="/">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
