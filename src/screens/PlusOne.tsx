import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useStore } from '../store/useStore';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { recordMasallah } from '../lib/badges';
import { PlusOneSkeleton } from '../components/skeletons';
import { uploadImage } from '../lib/upload'; 

type PlusOnePost = {
  id: string;
  userId: string;
  userName: string;
  userHandle: string;
  photoURL: string;
  imageUrl: string;
  expiresAt?: any;
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
              <p className="text-[14px] text-[#555]">Yükleniyor...</p>
            </div>
          ) : (
            <p className="text-[14px] text-[#555]">Görsel Yükleyin...</p>
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
            <span className="text-[10px] font-medium text-white/35 tracking-wide">Kaydır</span>
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
          userName: data.displayName || data.userName || 'Kullanıcı',
          userHandle: data.userHandle || `@${(data.displayName || 'user').toLowerCase().replace(/\s/g, '')}`,
          photoURL: data.photoURL || '',
          imageUrl: data.imageUrl || data.mediaUrl || '',
          expiresAt: data.expiresAt
        });
      });

      const valid = fetched.filter((p) => p.imageUrl).sort((a, b) => b.expiresAt - a.expiresAt);
      setPosts(valid);
    } catch (error) {
      console.error('Gönderiler çekilemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsUploading(true);
    try {
      const fileUrl = await uploadImage(file); // ImgBB sadece fotoğraf alacak
      
      const expiresAt = new Date();
      // TEST İÇİN: 1 Dakika denemek istersen alttaki satırı kullanabilirsin
      // expiresAt.setMinutes(expiresAt.getMinutes() + 1); 
      expiresAt.setHours(expiresAt.getHours() + 1); // CANLI: 1 Saat ömür

      await addDoc(collection(db, 'plusOnePosts'), {
        userId: user.uid,
        userName: user?.displayName || 'Kullanıcı',
        userHandle: `@${(user?.displayName || 'user').toLowerCase().replace(/\s/g, '')}`,
        photoURL: user?.photoURL || '',
        imageUrl: fileUrl,
        createdAt: new Date(),
        expiresAt: expiresAt
      });

      await fetchPosts();
    } catch (error) {
      console.error("Yükleme hatası:", error);
      alert("Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
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
      console.error('Maşallah kaydedilemedi:', err);
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
    <div className="min-h-screen bg-black flex flex-col font-['Inter']">
      
      {/* SADECE FOTOĞRAF KABUL EDEN INPUT */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      <header className="shrink-0 flex items-start justify-between gap-4 px-5 pt-12 pb-5 relative">
        <div className="min-w-0 flex-1 z-10">
          <h1 className="text-white text-[22px] font-bold tracking-tight">+1 Saatleri</h1>
          <p className="mt-2 text-[12px] leading-relaxed text-[#888] max-w-[240px]">
            Yeni yıkama, gece manzarası böyle anlarını çek, 60 dakikalığına paylaş, ruhunu yansıt.
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
              {/* SADECE IMG ETİKETİ */}
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
                  Maşallah
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

function ParticleBurst({
  originX,
  originY,
  onComplete,
}: {
  originX: number;
  originY: number;
  onComplete: () => void;
}) {
  const particles = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    startX: originX + (Math.random() * 40 - 20),
    startY: originY + (Math.random() * 40 - 20),
    angle: Math.random() * 360,
    distance: 80 + Math.random() * 200,
    size: 12 + Math.random() * 18,
    rotation: Math.random() * 720 - 360,
    delay: Math.random() * 100,
  }));

  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <motion.span
            key={p.id}
            className="absolute"
            style={{ fontSize: p.size, left: p.startX, top: p.startY }}
            initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
            animate={{
              x: tx,
              y: ty,
              scale: [0.2, 1.1, 0.7],
              opacity: [1, 1, 0],
              rotate: p.rotation,
            }}
            transition={{ duration: 0.9, delay: p.delay / 1000, ease: [0.25, 0.1, 0.25, 1] }}
          >
            🧿
          </motion.span>
        );
      })}
    </div>
  );
}