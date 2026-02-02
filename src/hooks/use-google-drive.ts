import { useState, useEffect } from 'react';
import { GoogleDriveService } from '@/lib/google-drive/service';

export function useGoogleDriveToken() {
  const [accessToken, setAccessToken] = useState<string | null>(GoogleDriveService.getAccessToken());

  useEffect(() => {
    // Sync initial value in case it changed before mount
    setAccessToken(GoogleDriveService.getAccessToken());

    const unsubscribe = GoogleDriveService.subscribe((token) => {
      setAccessToken(token);
    });

    return () => unsubscribe();
  }, []);

  return accessToken;
}
