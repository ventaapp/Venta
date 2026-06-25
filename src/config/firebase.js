import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAWo4S3Hp4MHASOjmylite89pgzw8aokBM",
  authDomain: "vante-ec7e0.firebaseapp.com",
  projectId: "vante-ec7e0",
  storageBucket: "vante-ec7e0.firebasestorage.app",
  messagingSenderId: "901570889167",
  appId: "1:901570889167:web:eb4916a2cd57c8b141feba"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);