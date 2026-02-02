'use client';

import { useUser } from '@/firebase/auth/use-user';
import { useGoogleDriveToken } from '@/hooks/use-google-drive';
import { signOut, signInWithGoogle } from '@/firebase/auth/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/data-display/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/overlay/dropdown-menu';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleDriveService } from '@/lib/google-drive/service';
import { GoogleAuthProvider } from 'firebase/auth';

export function UserProfile() {
  const { user, isLoading } = useUser();
  const accessToken = useGoogleDriveToken();
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
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Could not authenticate with Google.",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      GoogleDriveService.clearAccessToken(); // Clear local storage token
      toast({
        title: "Logged out",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Avatar className="h-8 w-8 hover:opacity-80 transition-opacity animate-in fade-in zoom-in duration-300">
            <AvatarFallback className="bg-muted text-muted-foreground"><UserIcon className="w-5 h-5" /></AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-2 shadow-xl border-border/50">
          <DropdownMenuLabel className="p-3 mb-1 bg-muted/30 rounded-md">
              <div className="font-semibold text-sm">Guest User</div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">Sign in to auto-save your work</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={handleSignIn}>
              <LogIn className="mr-2 h-4 w-4" />
              <span className="font-medium">Login with Google</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'A';
    const names = name.split(' ');
    if (names.length > 1 && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0]?.[0] || 'A';
  }

  const displayName = user.displayName || user.providerData?.[0]?.displayName || 'Google Account';
  const photoURL = user.photoURL || user.providerData?.[0]?.photoURL;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <Avatar key={user.uid + (photoURL || '')} className="h-8 w-8 hover:opacity-80 transition-opacity animate-in fade-in zoom-in duration-300">
          <AvatarImage src={photoURL ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2 shadow-xl border-border/50">
        <DropdownMenuLabel className="p-3 mb-1 bg-muted/30 rounded-md">
            <div className="font-semibold text-sm truncate">{displayName}</div>
            {user.email && <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">{user.email}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!accessToken && (
            <DropdownMenuItem className="cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50" onClick={handleSignIn}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Reconnect Drive</span>
            </DropdownMenuItem>
        )}
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
