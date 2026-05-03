import { initiateGoogleSignIn, signOut as serverSignOut } from '@/firebase/auth/auth';

import { useToast } from '@/hooks/use-toast';

/**
 * Provides `handleSignIn` and `handleSignOut` actions for UI components.
 *
 * Sign-in uses the OAuth redirect flow — the browser navigates to Google,
 * gets a refresh token stored server-side, then returns to the app. No popup.
 *
 * Sign-out clears both the Firebase identity session and the server-side
 * HttpOnly cookie that holds the Google OAuth refresh token.
 */
export function useAuthActions() {
  const { toast } = useToast();

  const handleSignIn = (): void => {
    // Initiates the full-page redirect to Google OAuth.
    // The browser returns to /api/auth/callback, which sets cookies and
    // redirects back to /. The useGoogleDriveToken hook picks up the tokens.
    initiateGoogleSignIn();
  };

  const handleSignOut = async (): Promise<boolean> => {
    try {
      await serverSignOut();
      toast({
        title: 'Logged out',
        description: 'You have been signed out of your account.',
      });
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
      });
      return false;
    }
  };

  return { handleSignIn, handleSignOut };
}
