import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music } from 'lucide-react'; 
import { useStore } from '../store/useStore';
import BottomNav from '../components/BottomNav';

// Firebase (deleteDoc eklendi)
import { db } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc, deleteDoc } from 'firebase/firestore';

export type FeedVehicle = {
  id: string; 
  userName: string;
  userHandle: string;
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
  
  const [feedVehicles, setFeedVehicles] = useState<FeedVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [particles, setParticles] = useState<{ id: number; originX: number; originY: number }[]>([]);

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
              imageUrl: data.vehiclePhotos[0],
              category: data.vehicleCategory || data.lane || 'Otomobil',
              bio: data.bio || '',
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


  // 🗑 ESKİ ÇÖP BOTLARI TEMİZLEME MOTORU (Çöp Kovası)
  const clearOldBots = async () => {
    if (!window.confirm("Eski sahte araçlar veritabanından tamamen silinecek. Emin misin?")) return;
    
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const deletePromises: any[] = [];
      
      querySnapshot.forEach((document) => {
        // Sadece ID'sinde "bot_user" geçen sahte hesapları bul ve imha et
        if (document.id.includes('bot_user')) {
          deletePromises.push(deleteDoc(doc(db, 'users', document.id)));
        }
      });

      await Promise.all(deletePromises);
      alert(`${deletePromises.length} adet eski araç başarıyla yok edildi! 🧹`);
      window.location.reload(); 
    } catch (err) {
      console.error("Silme hatası:", err);
      alert("Silinirken bir hata oluştu.");
      setIsLoading(false);
    }
  };

  // SPOTIFY'DA AÇMA FONKSİYONU
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
      await addDoc(collection(db, 'interactions'), {
        from: user.uid,
        to: targetId,
        type: 'like',
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Maşallah kaydedilemedi:", err);
    }
  };

  const removeParticle = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div className="vante-container min-h-screen flex flex-col relative" style={{ background: '#000000' }}>
      
      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        
        {/* GEÇİCİ BOT BUTONLARI */}
        <div className="pt-20 px-6 mb-4 flex flex-col gap-3">
          
          <button 
            onClick={clearOldBots}
            className="w-full bg-red-900/40 text-red-400 border border-red-900 rounded-xl py-3 text-sm font-medium hover:bg-red-900/60 transition-colors shadow-lg"
          >
            🗑 Eski Çöp Verileri Sil
          </button>
          
        </div>

        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-[#888] animate-pulse">Vante Garajı Yükleniyor...</p>
          </div>
        ) : feedVehicles.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center px-6 text-center">
            <p className="text-white text-lg mb-2">Garaj Şu An Boş</p>
            <p className="text-[#888] text-sm">Uygulamaya ilk aracını sen ekle.</p>
          </div>
        ) : (
          feedVehicles.map((vehicle) => (
            <div key={vehicle.id} className="pt-4 px-4 border-b border-[#111] pb-10">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center overflow-hidden">
                    <span className="text-white font-bold uppercase text-sm">
                      {vehicle.userName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-[15px] font-medium">{vehicle.userName}</span>
                    <span className="text-[#888] text-[13px]">{vehicle.userHandle}</span>
                  </div>
                </div>
                <div className="px-4 py-1.5 rounded-full border border-[#333] bg-[#0a0a0a]">
                  <span className="text-[#aaa] text-[12px] font-medium">{vehicle.category}</span>
                </div>
              </div>

              {vehicle.bio && (
                <p className="text-[#ccc] text-[14px] mb-4 leading-relaxed">
                  {vehicle.bio}
                </p>
              )}

              <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden mb-6 bg-[#111]">
                <img 
                  src={vehicle.imageUrl} 
                  alt={vehicle.userName} 
                  className="w-full h-full object-cover"
                />
                
                <div 
                  onClick={() => openInSpotify(vehicle.song)}
                  className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-black/60 border border-white/20 max-w-[85%] cursor-pointer active:scale-95 transition-transform hover:bg-black/80"
                >
                  <Music size={14} className="text-[#1DB954] flex-shrink-0" />
                  <span className="text-white text-[12px] font-semibold tracking-wide truncate">
                    {vehicle.song}
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <motion.button 
                  onClick={(e) => handleMasallah(e, vehicle.id)}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-3 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: '#1a1a1a', border: '1px solid #222' }}
                >
                  <span className="text-[#ddd] text-[14px] font-medium">Maşallah</span>
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