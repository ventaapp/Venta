import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Search, X, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { searchTracks, type TrackResult } from '../lib/musicSearch';

// Firebase
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Orijinal Spotify Logosu (SVG)
const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.42z"/>
  </svg>
);

export default function VehicleSpecsScreen() {
  const { user, setUser, setOnboardingStep } = useStore();
  
  // Form State
  const [category, setCategory] = useState('Otomobil');
  const [description, setDescription] = useState('');
  // 1. DEĞİŞİKLİK: previewUrl state'e eklendi
  const [song, setSong] = useState<{title: string, artist: string, cover: string, previewUrl?: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal State'leri
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TrackResult[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const categories = ['Otomobil', 'Motorsiklet', 'Off-Road/Macera'];

  const handleComplete = async () => {
    if (!user?.uid) return;
    setIsSaving(true);

    const finalSong = song ? `${song.artist} - ${song.title}` : 'Vante Original - Gece Sürüşü';

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        vehicleCategory: category,
        vehicleDescription: description,
        vehicleSong: finalSong,
        // 2. DEĞİŞİKLİK: Ses dosyası linki Firebase'e gönderiliyor
        vehicleSongPreview: song?.previewUrl || null, 
        onboardingStep: 5
      });

      setUser({ 
        ...user, 
        vehicleCategory: category, 
        vehicleDescription: description, 
        vehicleSong: finalSong,
        onboardingStep: 5 
      });
      setOnboardingStep(5);
    } catch (error) {
      console.error("Kaydedilemedi:", error);
      alert("Bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const openMusicSearch = () => {
    setIsSearchOpen(true);
  };

  const searchMusic = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsSearchingMusic(true);
    try {
      const tracks = await searchTracks(query);
      setSearchResults(tracks);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Müzik araması başarısız:', error);
      }
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchMusic(query);
    }, 500);
  };

  return (
    <div className="vante-container min-h-screen flex flex-col relative" style={{ background: '#000000' }}>
      
      {/* ANA EKRAN İÇERİĞİ */}
      <div className="flex-1 flex flex-col px-6 pt-20 pb-8">
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-white text-[28px] font-bold mb-3 leading-tight tracking-tight">
            Araç Gönderinizi Düzenleyin,<br />Şarkı Ekleyin
          </h1>
          <p className="text-[#888] text-[15px] mb-8 leading-relaxed">
            Aracınız Hakkında Yazmak İstediklerinizi hikayesini, kategorisini ve içinde dinlemeyi en sevdiğiniz şarkıyı ekleyin.
          </p>
        </motion.div>

        <motion.div 
          className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="whitespace-nowrap px-6 py-2.5 rounded-full text-[14px] font-medium transition-colors"
              style={{
                background: category === cat ? '#e5e5e5' : '#1a1a1a',
                color: category === cat ? '#000' : '#888',
              }}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Eklemek istediklerinizi yazın."
            className="w-full bg-[#161616] rounded-2xl p-5 text-white text-[15px] focus:outline-none resize-none placeholder-[#555]"
            style={{ height: '180px' }}
          />
        </motion.div>

        <div className="flex-1 flex items-end justify-between pb-4">
          
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            {song ? (
              <button 
                onClick={openMusicSearch}
                className="flex items-center gap-2 bg-[#161616] rounded-full pr-4 pl-1 py-1"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                  <img src={song.cover} alt="Cover" className="w-full h-full object-cover" />
                </div>
                <span className="text-[#ddd] text-[12px] font-medium max-w-[120px] truncate">
                  {song.title}
                </span>
              </button>
            ) : (
              <button 
                onClick={openMusicSearch}
                className="flex items-center gap-2 bg-[#161616] rounded-full pr-4 pl-1 py-1 transition-transform active:scale-95"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden relative bg-[#111]">
                   <SpotifyIcon className="w-4 h-4 text-[#1DB954]" />
                </div>
                <span className="text-[#ddd] text-[12px] font-medium pr-1">Şarkı Ekle</span>
              </button>
            )}
          </motion.div>

          <motion.button
            onClick={handleComplete}
            disabled={isSaving}
            className="w-14 h-14 rounded-full bg-[#1a1a1a] flex items-center justify-center transition-transform active:scale-90"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          >
            {isSaving ? (
              <Loader2 size={24} className="text-[#888] animate-spin" />
            ) : (
              <ArrowRight size={24} className="text-[#888]" />
            )}
          </motion.button>
        </div>
      </div>

      {/* --- MÜZİK ARAMA MODALI --- */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[340px] bg-[#161616] rounded-3xl overflow-hidden border border-[#222] shadow-2xl flex flex-col"
              style={{ minHeight: '350px', maxHeight: '500px' }}
            >
              <div className="p-4 border-b border-[#222] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                   <SpotifyIcon className="w-6 h-6 text-[#1DB954] flex-shrink-0" />
                   <span className="text-white font-bold text-sm">Müzik Seç</span>
                </div>
                <button onClick={() => setIsSearchOpen(false)} className="p-1.5 bg-[#222] rounded-full hover:bg-[#333]">
                  <X size={16} className="text-white" />
                </button>
              </div>

              <div className="p-4 pb-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Şarkı veya sanatçı ara..." 
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full bg-[#0a0a0a] rounded-xl py-2.5 pl-9 pr-3 text-white text-[13px] focus:outline-none border border-[#222]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {isSearchingMusic ? (
                   <div className="flex flex-col items-center justify-center h-32">
                     <Loader2 size={24} className="text-[#1DB954] animate-spin mb-2" />
                     <p className="text-[#666] text-xs">Aranıyor...</p>
                   </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        // 4. DEĞİŞİKLİK: Seçilen şarkının previewUrl'i de state'e aktarılıyor
                        setSong({ title: s.title, artist: s.artist, cover: s.cover, previewUrl: s.previewUrl });
                        setIsSearchOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-[#222] rounded-xl transition-colors text-left"
                    >
                      <img src={s.cover} alt={s.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-white text-[14px] font-medium truncate">{s.title}</span>
                        <span className="text-[#888] text-[12px] truncate">{s.artist}</span>
                      </div>
                    </button>
                  ))
                ) : searchQuery.length > 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-[#666] text-sm">Şarkı bulunamadı.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                    <SpotifyIcon className="w-8 h-8 text-[#333] mb-2" />
                    <p className="text-[#555] text-xs">Aramak istediğiniz şarkıyı yazın</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}