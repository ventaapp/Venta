import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Capacitor } from '@capacitor/core';

// Firebase bağlantıları
import { auth, db } from '../config/firebase';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect } from 'react';

// Split Card Component — Orijinal tasarım
function SplitRevealCard({ revealed, onReveal }: { revealed: boolean; onReveal: () => void }) {
  return (
    <div
      className="relative w-full max-w-[340px] aspect-square rounded-[24px] overflow-hidden cursor-pointer"
      style={{ background: '#000' }}
      onClick={onReveal}
    >
      <AnimatePresence>
        {revealed && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.p
              className="text-white text-center text-[24px] font-semibold leading-snug px-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              Vante&apos;ye<br />Hoşgeldiniz!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full overflow-hidden z-20"
        animate={{ x: revealed ? '-100%' : '0%' }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        <img
          src="/moto-split.jpg"
          alt="Motorcycle"
          className="absolute top-0 left-0 h-full object-cover"
          style={{ width: '200%', maxWidth: 'none' }}
          draggable={false}
        />
        <div
          className="absolute top-0 right-0 w-4 h-full"
          style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.3))' }}
        />
      </motion.div>

      <motion.div
        className="absolute top-0 right-0 w-1/2 h-full overflow-hidden z-20"
        animate={{ x: revealed ? '100%' : '0%' }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        <img
          src="/cars-split.jpg"
          alt="Cars"
          className="absolute top-0 right-0 h-full object-cover"
          style={{ width: '200%', maxWidth: 'none' }}
          draggable={false}
        />
        <div
          className="absolute top-0 left-0 w-4 h-full"
          style={{ background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.3))' }}
        />
      </motion.div>

      <motion.div
        className="absolute top-0 left-1/2 w-[2px] h-full z-25 -translate-x-1/2"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        animate={{ opacity: revealed ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

export default function LoginScreen() {
  const { setAuthenticated, setOnboardingStep, setUser } = useStore();
  const [revealed, setRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // E-Posta giriş formu state'leri
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleReveal = useCallback(() => {
    if (!revealed) setRevealed(true);
  }, [revealed]);

  // Firestore Kullanıcı Verisi İşleme Ortak Fonksiyonu
  const processUser = useCallback(async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userSnapshot = await getDoc(userDocRef);
    let userData;

    if (!userSnapshot.exists()) {
      userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: '',
        photoURL: firebaseUser.photoURL || null,
        bio: '',
        lane: null,
        profileCompleted: false,
        hasVehicle: false,
        vehiclePhotos: [],
        onboardingStep: 1,
        createdAt: serverTimestamp(),
      };
      await setDoc(userDocRef, userData);
    } else {
      userData = userSnapshot.data();
    }

    setUser(userData);
    setAuthenticated(true);

    // GÜVENLİK KİLİDİ: Eğer kullanıcının veritabanında ismi yoksa, step ne olursa olsun İSİM EKRANINA (1) at!
    if (!userData.displayName || userData.displayName.trim() === '') {
      setOnboardingStep(1);
    } else {
      setOnboardingStep(userData.onboardingStep || 1);
    }
  }, [setUser, setAuthenticated, setOnboardingStep]);

  // Native ortamda redirect sonucunu yakala
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          await processUser(result.user);
        }
      } catch (error) {
        console.error('Redirect result hatası:', error);
      }
    };

    checkRedirectResult();
  }, [processUser]);

  // Google ve Apple Girişi
  const handleSocialLogin = async (providerName: string) => {
    setIsLoading(true);
    try {
      let provider: GoogleAuthProvider | OAuthProvider;
      if (providerName === 'google') {
        provider = new GoogleAuthProvider();
      } else if (providerName === 'apple') {
        provider = new OAuthProvider('apple.com');
      } else {
        return;
      }

      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // Native ortamda: signInWithRedirect kullan (popup native'de çalışmaz)
        await signInWithRedirect(auth, provider);
        // Redirect sonrası yukarıdaki useEffect getRedirectResult'ı yakalar
      } else {
        // Web ortamında: signInWithPopup kullan
        const result = await signInWithPopup(auth, provider);
        if (result) await processUser(result.user);
      }
    } catch (error) {
      console.error(`${providerName} giriş hatası:`, error);
      alert('Giriş yaparken bir sorun oluştu.');
    } finally {
      if (!Capacitor.isNativePlatform()) {
        setIsLoading(false);
      }
    }
  };

  // E-Posta ile Giriş / Kayıt
  const handleEmailAuth = async () => {
    if (!email || !password) {
      alert('Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    setIsLoading(true);
    try {
      // Önce giriş yapmayı dener
      const result = await signInWithEmailAndPassword(auth, email, password);
      await processUser(result.user);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      // Eğer kullanıcı bulunamadıysa (auth/user-not-found) yeni kayıt oluşturur
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') {
        try {
          const newResult = await createUserWithEmailAndPassword(auth, email, password);
          await processUser(newResult.user);
        } catch (registerError) {
          console.error('Kayıt hatası:', registerError);
          alert('Kayıt oluşturulamadı. Şifreniz en az 6 karakter olmalıdır.');
        }
      } else {
        alert('E-posta veya şifre hatalı.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vante-container min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#000000' }}>
      <motion.div
        className="relative z-20 flex flex-col h-screen px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="pt-12 pb-6 flex justify-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h1 className="vante-wordmark text-white text-[22px]" style={{ letterSpacing: '6px' }}>
            VANTE
          </h1>
        </motion.div>

        <div className="flex-1 flex items-center justify-center pb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="w-full flex justify-center"
          >
            <SplitRevealCard revealed={revealed} onReveal={handleReveal} />
          </motion.div>
        </div>

        <div className="pb-10 space-y-3">
          {/* Eğer E-Posta formu açıksa bunu göster */}
          {showEmailForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <input
                type="email"
                placeholder="E-Posta Adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121212] border border-[#333] rounded-[24px] px-4 py-4 text-white text-sm focus:border-white focus:outline-none transition-colors"
                autoFocus
              />
              <input
                type="password"
                placeholder="Şifreniz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#121212] border border-[#333] rounded-[24px] px-4 py-4 text-white text-sm focus:border-white focus:outline-none transition-colors"
              />
              <motion.button
                className="pill-btn w-full flex items-center justify-center gap-3 text-black font-semibold"
                style={{ background: '#FFFFFF', height: 56, fontSize: 15 }}
                onClick={handleEmailAuth}
                disabled={isLoading}
                whileTap={{ scale: 0.97 }}
              >
                {isLoading ? 'İşleniyor...' : 'Giriş Yap / Kayıt Ol'}
              </motion.button>
              <button
                onClick={() => setShowEmailForm(false)}
                className="w-full text-[#888] text-sm pt-2"
              >
                Geri Dön
              </button>
            </motion.div>
          ) : (
            /* Normal Sosyal Giriş Butonları */
            <>
              <motion.button
                className="pill-btn w-full flex items-center justify-center gap-3 text-black font-semibold"
                style={{ background: '#FFFFFF', height: 56, fontSize: 15 }}
                onClick={() => handleSocialLogin('apple')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple ile Giriş Yapın
              </motion.button>

              <motion.button
                className="pill-btn w-full flex items-center justify-center gap-3 text-white font-semibold"
                style={{ background: '#1E1E1E', height: 56, fontSize: 15 }}
                onClick={() => handleSocialLogin('google')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google ile Giriş Yapın
              </motion.button>

              <motion.button
                className="pill-btn w-full flex items-center justify-center gap-3 font-medium"
                style={{ background: '#1E1E1E', color: '#fff', height: 56, fontSize: 15 }}
                onClick={() => setShowEmailForm(true)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
              >
                Diğer Seçenekler (E-Posta)
              </motion.button>
            </>
          )}

          <motion.p
            className="text-center text-[11px] pt-3 px-6"
            style={{ color: '#555', lineHeight: 1.5 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            Giriş yaparak{' '}
            <span className="underline">kullanım koşullarını</span>,{' '}
            <span className="underline">gizlilik sözleşmesini</span>{' '}
            ve Vante topluluk ilkelerini kabul etmiş sayılırsınız.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
