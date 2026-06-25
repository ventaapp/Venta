import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';

// Ekranlar
import LoginScreen from './screens/LoginScreen';
import NameScreen from './screens/NameScreen';
import LaneScreen from './screens/LaneScreen';
import UploadScreen from './screens/UploadScreen';
import VehicleSpecsScreen from './screens/VehicleSpecsScreen';
import MainFeedScreen from './screens/MainFeedScreen';
import GarageScreen from './screens/GarageScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';

// Firebase bağlantıları
import { auth, db } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function AppRoutes() {
  const { user, onboardingStep } = useStore();
  
  // KESİN ÇÖZÜM 1: Giriş yapılıp yapılmadığını başka bir değişkenden değil, 
  // direkt kullanıcının varlığından anlıyoruz.
  const isAuthenticated = !!user;

  // 1. Giriş yapılmamışsa - Sadece Login göster
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/*" element={<LoginScreen />} />
      </Routes>
    );
  }

  // 2. Giriş yapılmış ama kayıt adımları (1, 2, 3, 4) bitmemişse
  if (isAuthenticated && onboardingStep < 5) {
    return (
      <Routes>
        <Route path="/" element={
          onboardingStep === 1 ? <NameScreen /> :
          onboardingStep === 2 ? <LaneScreen /> :
          onboardingStep === 3 ? <UploadScreen /> :
          onboardingStep === 4 ? <VehicleSpecsScreen /> :
          <Navigate to="/feed" replace />
        } />
        <Route path="/*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // 3. Giriş yapılmış ve kayıt bitmişse - Ana uygulamayı göster
  return (
    <Routes>
      <Route path="/feed" element={<MainFeedScreen />} />
      <Route path="/garage" element={<GarageScreen />} />
      <Route path="/notifications" element={<NotificationsScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="/*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { setUser, setOnboardingStep, logout } = useStore();

  useEffect(() => {
    // Sayfa yenilendiğinde Firebase'den kullanıcının kimliğini hatırla
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Firebase Auth'ta var, veritabanından detayları çek
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData
            });
            // Eğer veritabanında adım verisi yoksa veya bozuksa, güvenli liman olan Ana Sayfaya (Step 5) at
            setOnboardingStep(userData.onboardingStep || 5);
          } else {
            // Firestore verisi yoksa 1. adıma at
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
            setOnboardingStep(1);
          }
        } catch (error) {
          console.error("Veri çekme hatası (Ama hesaptan atılmayacak):", error);
          // KESİN ÇÖZÜM 2: Veritabanı okuma hatası verse bile adamı ÇIKIŞA ATMA! 
          // Elimizdeki Firebase User bilgileriyle içeri al ve Ana Sayfada tut.
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          setOnboardingStep(5);
        }
      } else {
        // SADECE VE SADECE Firebase hesabın gerçekten kapandığını söylerse çıkış yap
        logout();
      }
      
      // Kontrol bitti, ekranı aç
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser, setOnboardingStep, logout]);

  // Firebase durumu kontrol edilirken gösterilecek siyah yükleme ekranı
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="w-full max-w-[430px] flex flex-col items-center justify-center">
           <p className="text-white text-xl font-bold tracking-[8px] animate-pulse">VANTE</p>
        </div>
      </div>
    );
  }

  // Senin orijinal mobil uyumlu (430px max-width) ana iskeletin
  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-[430px] relative">
        <AppRoutes />
      </div>
    </div>
  );
}