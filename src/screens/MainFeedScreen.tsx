import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import BottomNav from '../components/BottomNav';
import { FeedSkeleton } from '../components/skeletons';

// Firebase
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { recordMasallah } from '../lib/badges';

export type FeedVehicle = {
  id: string;
  userName: string;
  userHandle: string;
  photoURL?: string;
  imageUrl: string;
  category: string;
  bio: string;
  song: string;
};

// --- Efsanevi Nazar Boncuğu Patlama Efekti ---
function ParticleBurst({ originX, originY, onComplete }: { originX: number; originY: number; onComplete: () => void }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    startX: originX + (Math.random() * 40 - 20),
    startY: originY + (Math.random() * 40 - 20),
    angle: Math.random() * 360,
    distance: 100 + Math.random() * 300,
    size: 14 + Math.random() * 24,
    rotation: Math.random() * 720 - 360,
    delay: Math.random() * 100,
    emoji: '🧿',
  }));

  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
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
            animate={{ x: tx, y: ty, scale: [0.2, 1.2, 0.8], opacity: [1, 1, 0], rotate: p.rotation }}
            transition={{ duration: 1, delay: p.delay / 1000, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {p.emoji}
          </motion.span>
        );
      })}
    </div>
  );
}

export default function MainFeedScreen() {
  const { user } = useStore();
  const navigate = useNavigate();

  const [feedVehicles, setFeedVehicles] = useState<FeedVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [particles, setParticles] = useState<{ id: number; originX: number; originY: number }[]>([]);
  const [feedTab, setFeedTab] = useState<'explore' | 'following'>('explore');

  // FIREBASE'DEN ARAÇLARI ÇEK
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const q = query(collection(db, 'users'), where('hasVehicle', '==', true));
        const snapshot = await getDocs(q);
        
        const fetchedList: FeedVehicle[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (docSnap.id === user?.uid) return; 
          if (data.vehiclePhotos && data.vehiclePhotos.length > 0) {
            fetchedList.push({
              id: docSnap.id,
              userName: data.displayName || 'Vante Sürücüsü',
              userHandle: `@${(data.displayName || 'vante').toLowerCase().replace(/\s/g, '')}`,
              photoURL: data.photoURL || '',
              imageUrl: data.vehiclePhotos[0],
              category: data.vehicleCategory || data.lane || 'Otomobil',
              bio: data.vehicleDescription || data.bio || '',
              song: data.vehicleSong || 'Vante Original - Gece Sürüşü', 
            });
          }
        });
        
        setFeedVehicles(fetchedList.sort(() => Math.random() - 0.5));
      } catch (error) {
        console.error("Araçlar çekilemedi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, [user?.uid]);

  const openInSpotify = (songName: string) => {
    const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(songName)}`;
    window.open(spotifyUrl, '_blank');
  };

  const handleMasallah = async (e: React.MouseEvent, targetId: string) => {
    if (!user?.uid) return;
    
    const originX = e.clientX;
    const originY = e.clientY;
    setParticles((prev) => [...prev, { id: Date.now(), originX, originY }]);

    try {
      await recordMasallah(user.uid, targetId, 'like');
    } catch (err) {
      console.error("Maşallah kaydedilemedi:", err);
    }
  };

  const removeParticle = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

// "Takip Edilenler" sekmesindeysek, aracın sahibinin id'si bizim "following" dizimizde var mı diye filtreliyoruz.
const displayedVehicles = feedTab === 'explore' 
? feedVehicles 
: feedVehicles.filter(vehicle => user?.following?.includes(vehicle.id));

  if (isLoading) {
    return (
      <div className="vante-container min-h-screen flex flex-col relative" style={{ background: '#000000' }}>
        <FeedSkeleton withBottomNav={false} />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="vante-container min-h-screen flex flex-col relative" style={{ background: '#000000' }}>

      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">

        {/* Üst sekmeler ve bildirim */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-12 pb-4 bg-black">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFeedTab('explore')}
              className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
              style={{
                background: feedTab === 'explore' ? '#fff' : '#1a1a1a',
                color: feedTab === 'explore' ? '#000' : '#888',
                border: feedTab === 'explore' ? 'none' : '1px solid #222',
              }}
            >
              Keşfet
            </button>
            <button
              type="button"
              onClick={() => setFeedTab('following')}
              className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
              style={{
                background: feedTab === 'following' ? '#fff' : '#1a1a1a',
                color: feedTab === 'following' ? '#000' : '#888',
                border: feedTab === 'following' ? 'none' : '1px solid #222',
              }}
            >
              Takip Edilenler
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            aria-label="Bildirimler"
          >
            <Bell size={16} className="text-white" strokeWidth={2} />
          </button>
        </div>

        {displayedVehicles.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center px-6 text-center">
            <p className="text-white text-lg mb-2">
              {feedTab === 'following' ? 'Takip Ettiğin Kimse Yok' : 'Garaj Şu An Boş'}
            </p>
            <p className="text-[#888] text-sm">
              {feedTab === 'following'
                ? 'Keşfet sekmesinden yeni sürücüler bulabilirsin.'
                : 'Uygulamaya ilk aracını sen ekle.'}
            </p>
          </div>
        ) : (
          displayedVehicles.map((vehicle) => (
            <div key={vehicle.id} className="px-5 pb-10">

              {/* Post Header */}
              <div className="flex items-start justify-between mb-3">
                <div 
                  onClick={() => navigate(`/user/${vehicle.id}`)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden shrink-0">
                    {vehicle.photoURL ? (
                      <img src={vehicle.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold uppercase text-sm">
                        {vehicle.userName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-[15px] font-semibold truncate">
                      {vehicle.userName}
                    </span>
                    <span className="text-[#888] text-[13px] truncate">{vehicle.userHandle}</span>
                  </div>
                </div>
                <div
                  className="px-3 py-1.5 rounded-full shrink-0 ml-3"
                  style={{ background: '#1a1a1a', border: '1px solid #222' }}
                >
                  <span className="text-white text-[12px] font-medium">{vehicle.category}</span>
                </div>
              </div>

              {/* Açıklama */}
              <p className="text-[#888] text-[14px] mb-4 leading-relaxed">
                {vehicle.bio || 'Açıklama'}
              </p>

              {/* Görsel + müzik etiketi */}
              <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden mb-5 bg-[#111]">
                <img
                  src={vehicle.imageUrl}
                  alt={vehicle.userName}
                  className="w-full h-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => openInSpotify(vehicle.song)}
                  className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full max-w-[85%] cursor-pointer active:scale-95 transition-transform"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
                >
                  <Music size={14} className="text-white flex-shrink-0" strokeWidth={2} />
                  <span className="text-white text-[12px] font-medium tracking-wide truncate">
                    {vehicle.song}
                  </span>
                </button>
              </div>

              {/* Maşallah */}
              <div className="flex justify-center">
                <motion.button
                  type="button"
                  onClick={(e) => handleMasallah(e, vehicle.id)}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 py-3 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'transparent', border: '1px solid #333' }}
                >
                  <span className="text-white text-[14px] font-medium">Maşallah</span>
                </motion.button>
              </div>

            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {particles.map((p) => (
          <ParticleBurst key={p.id} originX={p.originX} originY={p.originY} onComplete={() => removeParticle(p.id)} />
        ))}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}