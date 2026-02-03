
import { GoogleAuthProvider } from 'firebase/auth';
import { signInWithGoogle, signOut as firebaseSignOut } from '@/firebase/auth/auth';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { useToast } from '@/hooks/use-toast';

export function useAuthActions() {
    const { toast } = useToast();

    const handleSignIn = async () => {
        try {
            const result = await signInWithGoogle();
            if (result) {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential?.accessToken;
                if (token) {
                    GoogleDriveService.setAccessToken(token);
                }
            }
            toast({
                title: "Welcome!",
                description: "Successfully signed in with Google.",
            });
            return true;
        } catch (error) {
            console.error("Error signing in:", error);
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Could not authenticate with Google.",
            });
            return false;
        }
    };

    const handleSignOut = async () => {
        try {
            await firebaseSignOut();
            GoogleDriveService.clearAccessToken();
            toast({
                title: "Logged out",
                description: "You have been signed out of your account.",
            });
            return true;
        } catch (error) {
            console.error("Error signing out:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to sign out. Please try again.",
            });
            return false;
        }
    };

    return { handleSignIn, handleSignOut };
}
