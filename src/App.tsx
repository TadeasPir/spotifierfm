
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { useAuth } from "./contexts/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { LoadingSpinner } from "./components/LoadingSpinner";
import Index from "./pages/Index";
import Callback from "./pages/callback";
import Trends from "./pages/trends";
import Artists from "./pages/artists";
import Albums from "./pages/albums";
import Genres from "./pages/genres";
import Recent from "./pages/recent";
import Dashboard from "./pages/dashboard";
import NotFound from "./pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-black to-blue-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return children;
}

function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-black to-blue-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" /> : <Index />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-950 via-black to-blue-950">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/callback" element={<Callback />} />
              <Route
                path="/trends"
                element={
                  <ProtectedRoute>
                    <Trends />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/artists"
                element={
                  <ProtectedRoute>
                    <Artists />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/albums"
                element={
                  <ProtectedRoute>
                    <Albums />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/genres"
                element={
                  <ProtectedRoute>
                    <Genres />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recent"
                element={
                  <ProtectedRoute>
                    <Recent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <Analytics />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
