import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

/**
 * This page handles post-login redirects by reading the stored return URL
 * from sessionStorage and redirecting the user back to their intended destination.
 */
export default function AuthRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get the stored return URL from sessionStorage
    const returnUrl = sessionStorage.getItem('auth_return_url');
    
    // Clear the stored URL
    sessionStorage.removeItem('auth_return_url');
    
    // Redirect to the return URL or default to home
    const destination = returnUrl || '/';
    
    // Wait for auth state to be properly set before redirecting
    // This ensures the session cookie is fully processed
    setTimeout(() => {
      setLocation(destination);
    }, 500);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">正在跳转...</p>
      </div>
    </div>
  );
}
