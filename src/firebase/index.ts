import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { firebaseConfig } from './config';

function initializeFirebase() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Explicitly use local persistence so the Firebase identity session
  // survives page reloads and browser restarts without requiring re-login.
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('Failed to set Firebase auth persistence:', error);
  });

  return { app, auth };
}

// Export the initialization function
export { initializeFirebase };

// Export providers and hooks
export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
