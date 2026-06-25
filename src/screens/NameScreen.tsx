import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

// Firebase bağlantıları
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

// --- YASAKLI KELİME POLİSİ (KARA LİSTE) ---
const BANNED_WORDS = [
  "am", "amcık", "amcuk", "amina", "amina koyim", "amina koyayim", "amk", "aq", "awk", "amq",
  "ananı", "ananı sikeyim", "anasını sikeyim", "bacını", "bacını sikeyim", "sik", "siker",
  "sikeyim", "sikiş", "sikik", "siktir", "siktirgit", "siktirgit", "yarak", "yarrak", "yarra",
  "yarrağım", "taşşak", "tasak", "göt", "got", "götveren", "gotveren", "götlek", "ibne",
  "ibneler", "ibnelik", "top", "pezevenk", "pezo", "orospu", "orosbu", "orospuçocuğu",
  "orospucocuğu", "kahpe", "fahişe", "piç", "pic", "puşt", "pust", "dangalak", "salak",
  "gerizekalı", "aptal", "mal", "mallık", "eşşek", "essek", "it oğlu it", "köpek", "it",
  "bok", "boktan", "bokcuk", "bokyiyen", "yavşak", "yavsak", "şerefsiz", "serefsiz",
  "haysiyetsiz", "namussuz", "oç", "oc", "ococuk", "ococuğu", "mk", "mq", "sg", "sggit",
  "anan", "avradını", "avradını sikeyim", "gavat", "döl", "dombili", "kahbe", "kerhane",
  "sürtük", "surtuk", "admin", "vante", "destek", "kurucu", "moderator", "root"
];

export default function NameScreen() {
  const { setOnboardingStep, setUser, user } = useStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    const cleanName = name.trim().toLowerCase();

    // 1. Aşama: Karakter Uzunluğu Kontrolü
    if (cleanName.length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalıdır.");
      return;
    }

    // 2. Aşama: Geçerli Karakter Kontrolü 
    const regex = /^[a-z0-9_]+$/;
    if (!regex.test(cleanName)) {
      setError("Sadece küçük harf, rakam ve alt çizgi (_) kullanabilirsiniz. Boşluk bırakmayın!");
      return;
    }

    // 3. Aşama: Kara Liste / Küfür Koruması
    const isBanned = BANNED_WORDS.some(badWord => cleanName.includes(badWord));
    if (isBanned) {
      setError("Bu kullanıcı adı topluluk kurallarına aykırıdır.");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 4. Aşama: Benzersizlik Kontrolü 
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('displayName', '==', cleanName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError("Bu kullanıcı adı daha önce alınmış, başka bir tane deneyin.");
        setIsLoading(false);
        return;
      }

      // 5. Aşama: Firebase güncelleme
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: cleanName,
          onboardingStep: 2
        });

        setUser({ ...user, displayName: cleanName, onboardingStep: 2 });
        setOnboardingStep(2);
      } else {
        setError("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }

    } catch (err) {
      console.error("Kullanıcı adı kontrol hatası:", err);
      setError("Veritabanı bağlantısında bir sorun oluştu. Tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vante-container min-h-screen flex flex-col" style={{ background: '#000000' }}>
      <div className="px-6 pt-16">
        <motion.h1
          className="text-white text-2xl font-semibold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Adınızı Seçiniz
        </motion.h1>
        <motion.p
          className="text-sm leading-relaxed"
          style={{ color: '#888' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Profilinizi kişiselleştirmek ve uygulamamıza dahil olmak için kendinize isim belirleyin
        </motion.p>
      </div>

      <div className="flex-1 px-6 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <label className="text-white text-sm font-medium mb-3 block">Adınız?</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Ad"
            className="vante-input"
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleContinue()}
            autoFocus
            disabled={isLoading}
          />

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-red-500 text-xs mt-3 flex items-center gap-1"
            >
              <AlertCircle size={12} /> {error}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          className="flex items-start gap-2 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <AlertCircle size={14} style={{ color: '#555', marginTop: 2 }} />
          <p className="text-xs" style={{ color: '#555', lineHeight: 1.5 }}>
            Burası sizin profilinizde görünecektir. Lütfen Düzgün Şekilde Yazınız!
          </p>
        </motion.div>
      </div>

      <div className="px-6 pb-10 flex justify-end">
        <motion.button
          onClick={handleContinue}
          disabled={name.trim().length < 3 || isLoading}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
          style={{
            background: name.trim().length >= 3 && !isLoading ? '#fff' : '#1E1E1E',
            color: name.trim().length >= 3 && !isLoading ? '#000' : '#555',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
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