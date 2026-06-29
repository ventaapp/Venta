import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import {
  AuthSkeleton,
  BadgesSkeleton,
  FeedSkeleton,
  GarageSkeleton,
  LoginSkeleton,
  NotificationsSkeleton,
  OnboardingFormSkeleton,
  PlusOneSkeleton,
  PublicGarageSkeleton,
  SettingsSkeleton,
  ShareGarageSkeleton,
  UploadSkeleton,
  VehicleSpecsSkeleton,
} from './components/skeletons';

const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const NameScreen = lazy(() => import('./screens/NameScreen'));
const LaneScreen = lazy(() => import('./screens/LaneScreen'));
const UploadScreen = lazy(() => import('./screens/UploadScreen'));
const VehicleSpecsScreen = lazy(() => import('./screens/VehicleSpecsScreen'));
const MainFeedScreen = lazy(() => import('./screens/MainFeedScreen'));
const GarageScreen = lazy(() => import('./screens/GarageScreen'));
const PlusOneScreen = lazy(() => import('./screens/PlusOne'));
const BadgesScreen = lazy(() => import('./screens/Badges'));
const NotificationsScreen = lazy(() => import('./screens/NotificationsScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const ShareGarageScreen = lazy(() => import('./screens/ShareGarageScreen'));
const PublicGarageScreen = lazy(() => import('./screens/PublicGarageScreen'));

// Firebase baglantilari
import { auth, db } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function withSuspense(fallback: React.ReactNode, screen: React.ReactNode) {
  return <Suspense fallback={fallback}>{screen}</Suspense>;
}

function AppRoutes() {
  const { user, onboardingStep } = useStore();
  
  const isAuthenticated = !!user;

  // 1. Giris yapilmamissa - Sadece Login goster
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/*" element={withSuspense(<LoginSkeleton />, <LoginScreen />)} />
      </Routes>
    );
  }

  // 2. Giris yapilmis ama kayit adimlari (1, 2, 3, 4) bitmemisse
  if (isAuthenticated && onboardingStep < 5) {
    return (
      <Routes>
        <Route path="/" element={
          onboardingStep === 1 ? withSuspense(<OnboardingFormSkeleton lines={1} />, <NameScreen />) :
          onboardingStep === 2 ? withSuspense(<OnboardingFormSkeleton lines={3} />, <LaneScreen />) :
          onboardingStep === 3 ? withSuspense(<UploadSkeleton />, <UploadScreen />) :
          onboardingStep === 4 ? withSuspense(<VehicleSpecsSkeleton />, <VehicleSpecsScreen />) :
          <Navigate to="/feed" replace />
        } />
        <Route path="/*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // 3. Giris yapilmis ve kayit bitmisse - Ana uygulamayi goster
  return (
    <Routes>
      <Route path="/feed" element={withSuspense(<FeedSkeleton />, <MainFeedScreen />)} />
      <Route path="/plus-one" element={withSuspense(<PlusOneSkeleton />, <PlusOneScreen />)} />
      <Route path="/badges" element={withSuspense(<BadgesSkeleton />, <BadgesScreen />)} />
      <Route path="/garage" element={withSuspense(<GarageSkeleton />, <GarageScreen />)} />
      <Route path="/specs" element={withSuspense(<VehicleSpecsSkeleton />, <VehicleSpecsScreen />)} />
      <Route path="/notifications" element={withSuspense(<NotificationsSkeleton />, <NotificationsScreen />)} />
      <Route path="/settings" element={withSuspense(<SettingsSkeleton />, <SettingsScreen />)} />
      <Route path="/share" element={withSuspense(<ShareGarageSkeleton />, <ShareGarageScreen />)} />
      <Route path="/user/:userId" element={withSuspense(<PublicGarageSkeleton />, <PublicGarageScreen />)} />
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="/*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { setUser, setOnboardingStep, logout } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData
            });
            setOnboardingStep(userData.onboardingStep || 5);
          } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
            setOnboardingStep(1);
          }
        } catch (error) {
          console.error("Veri cekme hatasi (Ama hesaptan atilmayacak):", error);
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          setOnboardingStep(5);
        }
      } else {
        logout();
      }
      
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser, setOnboardingStep, logout]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-black flex justify-center">
        <div className="w-full max-w-[430px] relative">
          <AuthSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex justify-center font-['Inter']">
      <div className="w-full max-w-[430px] relative">
        <AppRoutes />
      </div>
    </div>
  );
}
