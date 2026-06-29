import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Share2, ChevronLeft, Edit3 } from 'lucide-react';
import { PublicGarageSkeleton } from '../components/skeletons';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import BottomNav from '../components/BottomNav';
import { useStore } from '../store/useStore';

// Firestore'dan gelen kullanici verisi tipi
interface PublicUserProfile {
  uid?: string;
  displayName?: string;
  email?: string;
  photoURL?: string | null;
  bio?: string;
  lane?: string;
  profileCompleted?: boolean;
  hasVehicle?: boolean;
  vehiclePhotos?: string[];
  following?: string[];
  createdAt?: unknown;
}

export default function PublicGarageScreen() {
  const { userId } = useParams<{ userId: string }>(); 
  const navigate = useNavigate();
  const { user: currentUser, setUser } = useStore();
  
  const [profileUser, setProfileUser] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [garageOpen, setGarageOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Otomobil');
  const [isFollowing, setIsFollowing] = useState(false);

  const tabs = ['Otomobil', 'Motor', 'Off-Road'];

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as PublicUserProfile;
          setProfileUser(data);
          if (data.lane) setActiveTab(data.lane);

          if (currentUser?.following?.includes(userId)) {
            setIsFollowing(true);
          }
        } else {
          setProfileUser(null);
        }
      } catch (error) {
        console.error("Profil cekilemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, currentUser?.following]);

  const handleFollowToggle = async () => {
    if (!currentUser?.uid || !userId) return;
    
    const currentlyFollowing = isFollowing;
    setIsFollowing(!currentlyFollowing);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (currentlyFollowing) {
        await updateDoc(userRef, { following: arrayRemove(userId) });
        const newFollowing = (currentUser.following || []).filter((id: string) => id !== userId);
        setUser({ ...currentUser, following: newFollowing });
      } else {
        await updateDoc(userRef, { following: arrayUnion(userId) });
        const newFollowing = [...(currentUser.following || []), userId];
        setUser({ ...currentUser, following: newFollowing });
      }
    } catch (error) {
      console.error("Takip islemi hatasi:", error);
      setIsFollowing(currentlyFollowing);
    }
  };

  if (loading) {
    return <PublicGarageSkeleton />;
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center text-white">
        <p>Kullanici bulunamadi.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-zinc-800 rounded-full">Geri Don</button>
      </div>
    );
  }

  const hasPhotos = profileUser.vehiclePhotos && profileUser.vehiclePhotos.length > 0;
  const isSelf = currentUser?.uid === userId; 

  return (
    <div className="vante-container min-h-screen flex flex-col relative font-['Inter']" style={{ background: '#000000' }}>
      
      <div className="px-5 pt-12 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center text-zinc-500 hover:text-white transition text-sm">
          <ChevronLeft size={18} className="mr-1" />
          Geri
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <h1 className="text-white text-[24px] font-bold tracking-tight mb-6">Kullanicinin Garaji</h1>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-[56px] h-[56px] rounded-full overflow-hidden flex items-center justify-center bg-[#1E1E1E] shrink-0">
            {profileUser.photoURL ? (
              <img src={profileUser.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-xl">{profileUser.displayName?.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0 flex flex-col">
            <p className="text-white text-[16px] font-medium truncate">
              {profileUser.displayName || 'Kullanici Adi'}
            </p>
            <p className="text-[14px] text-[#888] truncate">
              @{profileUser.displayName?.toLowerCase().replace(/\s/g, '') || 'user'}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-[16px] font-medium text-white block mb-2">Hakkinda</span>
          <p className="text-[14px] leading-relaxed text-[#999]">
            {profileUser.bio || 'Modifiye ve araba hastasi bir kullanici.'}
          </p>
        </div>

        {!isSelf && (
          <div className="mb-10">
            <button 
              onClick={handleFollowToggle}
              className={`px-6 py-2.5 rounded-full text-[14px] font-medium transition-all ${
                isFollowing 
                  ? 'bg-[#111] text-white border border-zinc-800' 
                  : 'bg-white text-black hover:bg-zinc-200' 
              }`}
            >
              {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
            </button>
          </div>
        )}

        <div className="flex items-center justify-center py-1 mb-4">
          <div className="flex-1 h-px" style={{ background: '#222' }} />
          <button
            type="button"
            onClick={() => setGarageOpen(!garageOpen)}
            className="flex items-center gap-2 px-5 py-2 mx-3 rounded-full"
            style={{ background: '#121212', border: '1px solid #2a2a2a' }}
          >
            <span className="text-[13px] font-medium text-white">Garaj</span>
            <motion.div animate={{ rotate: garageOpen ? 180 : 0 }}>
              <ChevronDown size={14} style={{ color: '#888' }} />
            </motion.div>
          </button>
          <div className="flex-1 h-px" style={{ background: '#222' }} />
        </div>

        <AnimatePresence>
          {garageOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex gap-2 py-4 px-2">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className="px-5 py-2 rounded-full text-[14px] font-medium transition-all"
                      style={{
                        background: isActive ? '#777' : 'transparent',
                        color: isActive ? '#000' : '#444',
                        border: isActive ? 'none' : '1px solid transparent',
                      }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {hasPhotos ? (
                <div className="space-y-6 pb-2">
                  {profileUser.vehiclePhotos!.map((photo: string, i: number) => (
                    <div key={i} className="relative pt-5">
                      <div className="absolute left-3 right-3 top-0 h-[calc(100%-12px)] rounded-xl border border-[#1f1f1f] bg-[#111] transform -translate-y-4 scale-[0.94] z-0" />
                      <div className="absolute left-1.5 right-1.5 top-0 h-[calc(100%-6px)] rounded-xl border border-[#222] bg-[#161616] transform -translate-y-2 scale-[0.97] z-10" />

                      <motion.div className="relative z-20 rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#0a0a0a]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <div className="w-full aspect-[4/3] overflow-hidden">
                          <img src={photo} alt="Garage" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex items-center justify-between px-4 py-4 bg-[#050505]">
                          <span className="text-[12px] font-medium text-white">{profileUser.lane || 'Modifiye'}</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => alert("Bu garaj baskasina ait.")}>
                              <Edit3 size={15} className="text-[#888] hover:text-white transition-colors" />
                            </button>
                            <button onClick={() => navigator.share && navigator.share({ url: window.location.href })}>
                              <Share2 size={15} className="text-[#888] hover:text-white transition-colors" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[#444] text-sm">Bu kullanicinin garaji henuz bos.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}
