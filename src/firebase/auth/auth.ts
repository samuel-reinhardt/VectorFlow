'use client';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
} from 'firebase/auth';

export const signInWithGoogle = async () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google: ", error);
  }
};

export const signInAnonymously = async () => {
    const auth = getAuth();
    try {
        await firebaseSignInAnonymously(auth);
    } catch (error) {
        console.error("Error signing in anonymously: ", error);
    }
};

export const signOut = async () => {
  const auth = getAuth();
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};
