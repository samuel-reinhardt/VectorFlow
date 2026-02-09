import { useState, useEffect } from 'react';
import { GoogleDriveService } from '@/lib/google-drive/service';

export function useGoogleDriveToken() {
  const [accessToken, setAccessToken] = useState<string | null>(GoogleDriveService.getAccessToken());

  useEffect(() => {
    // Sync initial value in case it changed before mount
    setAccessToken(GoogleDriveService.getAccessToken());

    // Active heartbeat to check for expiration
    const heartbeat = setInterval(() => {
        const current = GoogleDriveService.getAccessToken(); // This will clear if expired
        if (current !== accessToken) {
            setAccessToken(current);
        }
    }, 30000); // Check every 30 seconds

    const unsubscribe = GoogleDriveService.subscribe((token) => {
      setAccessToken(token);
    });

    return () => {
        clearInterval(heartbeat);
        unsubscribe();
    };
  }, [accessToken]);

  return accessToken;
}
