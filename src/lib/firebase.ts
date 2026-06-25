// Firebase Configuration for VANTE
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// NOTE: Replace with your actual Firebase config when ready
const firebaseConfig = {
  apiKey: "AIzaSyDummy-VANTE-DEV-MODE",
  authDomain: "vante-app.firebaseapp.com",
  projectId: "vante-app",
  storageBucket: "vante-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
try {
  enableIndexedDbPersistence(db);
} catch (err) {
  console.warn('Persistence not enabled:', err);
}

// Mock Firebase for dev mode when no real config
export const isMockMode = true;

// Mock collections structure:
// users: { uid, displayName, email, photoURL, bio, lane, createdAt, profileCompleted }
// vehicles: { id, userId, imageUrls, category, brand, year, story, createdAt }
// interactions: { id, userId, vehicleId, type: 'like'|'pass', createdAt }
// notifications: { id, userId, title, body, read, createdAt }
