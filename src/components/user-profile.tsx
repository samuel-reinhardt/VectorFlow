'use client';

import { useUser } from '@/firebase/auth/use-user';
import { signOut } from '@/firebase/auth/auth';
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
import { linkWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export function UserProfile() {
  const { user, isLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const handleUpgradeAccount = async () => {
    if (auth && user && user.isAnonymous) {
      const provider = new GoogleAuthProvider();
      try {
        await linkWithPopup(user, provider);
        toast({
          title: 'Account Linked',
          description: 'Your anonymous account has been linked to your Google account.',
        });
      } catch (error: any) {
        console.error("Error upgrading account:", error);
        if (error.code === 'auth/credential-already-in-use') {
             toast({
                variant: 'destructive',
                title: 'Account Exists',
                description: "This Google account is already in use. Please sign out and sign in with Google directly.",
             });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: "Could not link account. Please try again.",
             });
        }
      }
    }
  };

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    // This path should not be hit if AuthGate is working correctly.
    // It can be a loading spinner or null.
    return null;
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'A';
    const names = name.split(' ');
    if (names.length > 1 && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0]?.[0] || 'A';
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User'} />
          <AvatarFallback>{user.isAnonymous ? <UserIcon className="w-5 h-5" /> : getInitials(user.displayName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
            <div className="font-medium truncate">{user.isAnonymous ? 'Anonymous User' : user.displayName || 'My Account'}</div>
            {!user.isAnonymous && user.email && <div className="text-xs text-muted-foreground font-normal truncate">{user.email}</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.isAnonymous && (
            <DropdownMenuItem onClick={handleUpgradeAccount}>
                <LogIn className="mr-2" />
                <span>Login with Google</span>
            </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
