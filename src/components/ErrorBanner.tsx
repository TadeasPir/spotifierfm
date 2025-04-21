
import { XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ title = "Error", message, onRetry }: ErrorBannerProps) {
  // Add specific help text for common errors
  let helpText = "";

  if (message.includes("No code verifier found")) {
    helpText = "This usually happens when browser storage is cleared or blocked. Make sure cookies and site data are enabled for this site.";
  } else if (message.includes("404") || message.includes("Failed to fetch trends")) {
    helpText = "The Spotify API endpoint might be temporarily unavailable. Try clicking the Refresh button or check your internet connection.";
  } else if (message.includes("401") || message.includes("Unauthorized")) {
    helpText = "Your Spotify session may have expired. Try logging out and logging back in.";
  } else if (message.includes("403") || message.includes("Forbidden")) {
    helpText = "You don't have permission to access this resource. This might be due to Spotify account restrictions.";
  } else if (message.includes("429") || message.includes("Too Many Requests")) {
    helpText = "You've made too many requests to the Spotify API. Please wait a moment and try again.";
  } else if (message.includes("Unexpected data") || message.includes("processing")) {
    helpText = "The data format from Spotify's API has changed. Try refreshing the page or logging out and back in.";
  } else if (message.includes("No tracks found")) {
    helpText = "No music tracks were found. This could be because you're a new Spotify user or due to API limitations.";
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <XCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col">
        <span>{message}</span>
        {helpText && <span className="mt-2 text-xs opacity-80">{helpText}</span>}
        <div className="mt-3 flex justify-end">
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded bg-destructive/20 px-2 py-1 text-sm hover:bg-destructive/30"
            >
              Try Again
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
