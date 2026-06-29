import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useStore } from '../store/useStore';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { recordMasallah } from '../lib/badges';
import { PlusOneSkeleton } from '../components/skeletons';
import { uploadImage } from '../lib/upload'; 

// Ortak ParticleBurst bileseni
import ParticleBurst from '../components/ParticleBurst';

type PlusOnePost = {
  id: string;
  userId: string;
  userName: string;
  userHandle: string;
  photoURL: string;
  imageUrl: string;
  expiresAt?: unknown;
};

const CARD_HEIGHT_STYLE: React.CSSProperties = {
  height: 'calc(100dvh - 280px)',
  minHeight: '420px',
  maxHeight: '640px',
};

function UploadCard({ onUploadClick, isUploading }: { onUploadClick: () => void, isUploading: boolean }) {
  return (
    <section
      className="snap-center shrink-0 w-full px-5 box-border"
      style={{ scrollSnapStop: 'always' }}
    >
      <button
        type="button"
        onClick={onUploadClick}
        disabled={isUploading}
        className="relative w-full rounded-2xl bg-[#0a0a0a] overflow-hidden transition-opacity"
        style={{ ...CARD_HEIGHT_STYLE, opacity: isUploading ? 0.5 : 1 }}
      >
        <div className="absolute inset-3 flex items-center justify-center rounded-xl border border-dashed border-zinc-700">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="text-[#888] animate-spin" />
              <p className="text-[14px] text-[#555]">Yukleniyor...</p>
            </div>
          ) : (
            <p className="text-[14px] text-[#555]">Gorsel Yukleyin...</p>
          )}
        </div>

        {!isUploading && (
          <div className="absolute right-5 bottom-1/2 flex translate-y-1/2 flex-col items-center gap-1 pointer-events-none">
            <motion.div
              animate={{
                opacity: [0.35, 1, 0.35],
                x: [0, 5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="rounded-full"
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.45))' }}
            >
              <ChevronRight size={22} className="text-white/80" strokeWidth={2} />
            </motion.div>
            <span className="text-[10px] font-medium text-white/35 tracking-wide">Kaydir</span>
          </div>
        )}
      </button>
    </section>
  );
}

function PlusOneLogo() {
  return (
    <div className="flex-shrink-0 pointer-events-none">
      <div
        className="flex items-center text-[56px] font-black font-['Inter'] leading-none select-none text-white/90"
        aria-hidden
      >
        <span>+</span>
        <span className="ml-[2px]">1</span>
      </div>
    </div>
  );
}

export default function PlusOneScreen() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PlusOnePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [particles, setParticles] = useState<{ id: number; originX: number; originY: number }[]>([]);
  
  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'plusOnePosts'),
        where('expiresAt', '>', new Date())
      );
      
      const snapshot = await getDocs(q);
      
      const fetched: PlusOnePost[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetched.push({
          id: docSnap.id,
          userId: data.userId || docSnap.id,
          userName: data.displayName || data.userName || 'Kullanici',
          userHandle: data.userHandle || `@${(data.displayName || 'user').toLowerCase().replace(/\s/g, '')}`,
          photoURL: data.photoURL || '',
          imageUrl: data.imageUrl || data.mediaUrl || '',
          expiresAt: data.expiresAt
        });
      });

      const valid = fetched.filter((p) => p.imageUrl).sort((a, b) => {
        const aTime = a.expiresAt instanceof Date ? a.expiresAt.getTime() : 0;
        const bTime = b.expiresAt instanceof Date ? b.expiresAt.getTime() : 0;
        return bTime - aTime;
      });
      setPosts(valid);
    } catch (error) {
      console.error('Gonderiler cekilemedi:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Pull-to-refresh touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Sadece scroll en ustteyken pull-to-refresh aktif
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const pullDistance = touchEndY - touchStartY.current;
    
    // 80px'den fazla cekilirse yenile
    if (pullDistance > 80 && window.scrollY === 0 && !isRefreshing) {
      setIsRefreshing(true);
      fetchPosts();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsUploading(true);
    try {
      const fileUrl = await uploadImage(file); // ImgBB sadece fotograf alacak
      
      const expiresAt = new Date();
      // TEST ICIN: 1 Dakika denemek istersen alttaki satiri kullanabilirsin
      // expiresAt.setMinutes(expiresAt.getMinutes() + 1); 
      expiresAt.setHours(expiresAt.getHours() + 1); // CANLI: 1 Saat omur

      await addDoc(collection(db, 'plusOnePosts'), {
        userId: user.uid,
        userName: user?.displayName || 'Kullanici',
        userHandle: `@${(user?.displayName || 'user').toLowerCase().replace(/\s/g, '')}`,
        photoURL: user?.photoURL || '',
        imageUrl: fileUrl,
        createdAt: new Date(),
        expiresAt: expiresAt
      });

      await fetchPosts();
    } catch (error) {
      console.error("Yukleme hatasi:", error);
      alert("Dosya yuklenirken bir hata olustu. Lutfen tekrar deneyin.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleMasallah = async (e: React.MouseEvent, targetId: string) => {
    if (!user?.uid) return;

    setParticles((prev) => [...prev, { id: Date.now(), originX: e.clientX, originY: e.clientY }]);

    if (!user?.uid || !targetId) return;

    try {
      await recordMasallah(user.uid, targetId, 'plus_one_like');
    } catch (err) {
      console.error('Masallah kaydedilemedi:', err);
    }
  };

  const removeParticle = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (isLoading && posts.length === 0) {
    return <PlusOneSkeleton />;
  }

  return (
    <div 
      className="min-h-screen bg-black flex flex-col font-['Inter']"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* SADECE FOTOGRAF KABUL EDEN INPUT */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Pull-to-Refresh Indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center py-3"
          >
            <RefreshCw size={18} className="text-[#888] animate-spin mr-2" />
            <span className="text-[12px] text-[#888]">Yenileniyor...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="shrink-0 flex items-start justify-between gap-4 px-5 pt-12 pb-5 relative">
        <div className="min-w-0 flex-1 z-10">
          <h1 className="text-white text-[22px] font-bold tracking-tight">+1 Saatleri</h1>
          <p className="mt-2 text-[12px] leading-relaxed text-[#888] max-w-[240px]">
            Yeni yikama, gece manzarasi boyle anlarini cek, 60 dakikaligina paylas, ruhunu yansit.
          </p>
        </div>
        <PlusOneLogo />
      </header>

      <div
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <UploadCard onUploadClick={handleUploadClick} isUploading={isUploading} />

        {posts.map((post) => (
          <section
            key={post.id}
            className="snap-center shrink-0 w-full px-5 box-border"
            style={{ scrollSnapStop: 'always' }}
          >
            <div
              className="relative w-full overflow-hidden rounded-2xl bg-[#111]"
              style={CARD_HEIGHT_STYLE}
            >
              {/* SADECE IMG ETIKETI */}
              <img
                src={post.imageUrl}
                alt={post.userName}
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <div 
                  onClick={() => navigate(`/user/${post.userId}`)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity z-20"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#222] flex items-center justify-center">
                    {post.photoURL ? (
                      <img src={post.photoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold uppercase text-white">
                        {post.userName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-white">{post.userName}</p>
                    <p className="truncate text-[13px] text-[#aaa]">{post.userHandle}</p>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={(e) => handleMasallah(e, post.userId)}
                  whileTap={{ scale: 0.95 }}
                  className="shrink-0 rounded-full border border-zinc-700 px-5 py-2.5 text-[13px] font-medium text-white transition-colors"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                >
                  Masallah
                </motion.button>
              </div>
            </div>
          </section>
        ))}
      </div>

      <AnimatePresence>
        {particles.map((p) => (
          <ParticleBurst
            key={p.id}
            originX={p.originX}
            originY={p.originY}
            onComplete={() => removeParticle(p.id)}
          />
        ))}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
