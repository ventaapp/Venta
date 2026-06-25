import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useStore, type Lane } from '../store/useStore';

// Firebase bağlantıları
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const lanes: { id: Lane; label: string }[] = [
  { id: 'Otomobil', label: 'Otomobil' },
  { id: 'Motosiklet', label: 'Motosiklet' },
  { id: 'Off-Road', label: 'Off-Road & Macera' },
];

export default function LaneScreen() {
  const { setOnboardingStep, setUser, user } = useStore();
  const [selected, setSelected] = useState<Lane | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (lane: Lane) => {
    setSelected(lane);
  };

  const handleContinue = async () => {
    if (!selected || isLoading) return;

    setIsLoading(true);

    try {
      // 1. Firebase'de kullanıcının dökümanını seçtiği kulvarla güncelle
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          lane: selected,
          onboardingStep: 3 // 3. Adıma (Araç Yükleme veya Profil Tamamlama) geçir
        });

        // 2. Global hafızayı güncelle ve 3. adıma atla
        setUser({ ...user, lane: selected, onboardingStep: 3 });
        setOnboardingStep(3);
      } else {
        alert("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }
    } catch (error) {
      console.error("Kulvar kaydetme hatası:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vante-container min-h-screen flex flex-col" style={{ background: '#000000' }}>
      {/* Header */}
      <div className="px-6 pt-16">
        <motion.h1
          className="text-white text-2xl font-semibold mb-4 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Keşfetmek İstediğiniz<br />Kulvar Seçin.
        </motion.h1>
        <motion.p
          className="text-sm leading-relaxed"
          style={{ color: '#888' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          İlgi alanınıza uygun seçkin kıtasyonları listelemek için bir kulvar seçerek başlayın. Bu ayarı dilediğiniz zaman profilinizden değiştirebilirsiniz
        </motion.p>
      </div>

      {/* Lane Options */}
      <div className="flex-1 px-6 pt-10 space-y-3">
        {lanes.map((lane, index) => (
          <motion.button
            key={lane.id}
            onClick={() => handleSelect(lane.id)}
            disabled={isLoading}
            className="w-full pill-btn text-center font-medium transition-all"
            style={{
              background: selected === lane.id ? '#fff' : '#121212',
              color: selected === lane.id ? '#000' : '#fff',
              height: 52,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            whileTap={{ scale: 0.97 }}
          >
            {lane.label}
          </motion.button>
        ))}
      </div>

      {/* Bottom Button */}
      <div className="px-6 pb-10 flex justify-end">
        <motion.button
          onClick={handleContinue}
          disabled={!selected || isLoading}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
          style={{
            background: selected && !isLoading ? '#fff' : '#1E1E1E',
            color: selected && !isLoading ? '#000' : '#555',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          whileTap={{ scale: 0.9 }}
        >
          {isLoading ? (
            <Loader2 size={24} className="animate-spin text-black" />
          ) : (
            <ChevronRight size={24} />
          )}
        </motion.button>
      </div>
    </div>
  );
}