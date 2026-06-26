import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Plus, X, Loader2, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { UploadSkeleton } from '../components/skeletons';

// TensorFlow & COCO-SSD İçe Aktarımı
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Firebase bağlantıları
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadImage } from '../lib/upload';

export default function UploadScreen() {
  const { setOnboardingStep, setUser, user } = useStore();
  const [photos, setPhotos] = useState<string[]>([]);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 1. TensorFlow Modeli Yükle
  useEffect(() => {
    async function loadModel() {
      await tf.ready();
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    }
    loadModel();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!model) {
      alert("Yapay zeka modeli hala yükleniyor, lütfen 1-2 saniye bekleyin.");
      return;
    }

    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 4 - photos.length);
    if (newFiles.length === 0) return;

    setIsProcessing(true);

    for (const file of newFiles) {
      try {
        setProcessingText("Yapay Zeka Polisi İnceliyor...");
        
        // Fotoğrafı geçici olarak bir img etiketine al (AI okuyabilsin diye)
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => img.onload = resolve);

        // 2. AI Polisi Tespit Başlat
        const predictions = await model.detect(img);
        
        // Araç mı değil mi kontrol et
        const isVehicle = predictions.some(p => 
          ['car', 'motorcycle', 'truck', 'bus', 'vehicle'].includes(p.class)
        );

        if (!isVehicle) {
          alert("🚨 Yapay Zeka Polisi: Bu fotoğrafta araç tespit edilemedi! Sadece araba veya motosiklet fotoğrafları kabul edilir.");
          continue;
        }

        // 3. ImgBB'ye Yükle
        setProcessingText("Sunucuya Yükleniyor...");
        const imageUrl = await uploadImage(file);
        setPhotos((prev) => [...prev, imageUrl]);
      } catch (err) {
        console.error("Yükleme hatası:", err);
      }
    }

    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContinue = async () => {
    if (photos.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          vehiclePhotos: photos,
          hasVehicle: true,
          onboardingStep: 4
        });
        setUser({ ...user, vehiclePhotos: photos, hasVehicle: true, onboardingStep: 4 });
        setOnboardingStep(4);
      }
    } catch (error) {
      alert("Hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    setIsSaving(true);
    await updateDoc(doc(db, 'users', user!.uid), { onboardingStep: 5 });
    setOnboardingStep(5);
    setIsSaving(false);
  };

  const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

  if (!model) {
    return <UploadSkeleton />;
  }

  return (
    <div className="vante-container min-h-screen flex flex-col relative" style={{ background: '#000000' }}>
      
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.85)' }}
          >
            <ShieldCheck size={48} className="text-white mb-4 animate-pulse" />
            <Loader2 size={32} className="text-[#888] animate-spin mb-4" />
            <p className="text-white font-medium tracking-wide">{processingText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 pt-16">
        <h1 className="text-white text-2xl font-semibold mb-4 leading-tight">Aracınızın Görsellerini<br />Sergileyin</h1>
        <p className="text-sm text-[#888]">Yapay zeka sistemimiz görselleri inceleyecektir.</p>
      </div>

      <div className="flex-1 px-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl flex items-center justify-center border border-[#333] cursor-pointer"
              style={{ background: '#121212' }}
              onClick={() => !photos[index] && !isProcessing && fileInputRef.current?.click()}
            >
              {photos[index] ? (
                <>
                  <img src={photos[index]} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                  <button onClick={(e) => { e.stopPropagation(); removePhoto(index); }} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full"><X size={12} color="#fff" /></button>
                </>
              ) : <Plus size={24} style={{ color: '#444' }} />}
            </div>
          ))}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
      </div>

      <div className="px-6 pb-10 flex items-center justify-between">
        <button onClick={handleSkip} className="text-sm text-white px-5 py-3 rounded-full bg-[#1E1E1E]">Geç</button>
        <button onClick={handleContinue} disabled={photos.length === 0} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: photos.length > 0 ? '#fff' : '#1E1E1E' }}>
          {isSaving ? <Loader2 className="animate-spin" /> : <ChevronRight color={photos.length > 0 ? '#000' : '#555'} />}
        </button>
      </div>
    </div>
  );
}