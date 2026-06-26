import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Edit3, Check, Loader2, ShieldCheck, Share2, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';

// TensorFlow & COCO-SSD İçe Aktarımı (Araç Tespiti İçin)
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Firebase bağlantıları
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadImage } from '../lib/upload';

export default function GarageScreen() {
  const { user, setUser, skippedUpload } = useStore();
  const navigate = useNavigate(); 
  
  const [bioEditMode, setBioEditMode] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || '');
  const [garageOpen, setGarageOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(user?.lane || 'Otomobil');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const vehicleInputRef = useRef<HTMLInputElement>(null);

  // Yapay Zeka ve Yükleme İşlemleri için State'ler
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');

  // 1. TensorFlow Modeli Yükle (Garaja araç ekleme ihtimaline karşı)
  useEffect(() => {
    async function loadModel() {
      await tf.ready();
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    }
    loadModel();
  }, []);

  // --- BİOGRAFİ KAYDETME ---
  const handleSaveBio = async () => {
    if (!user?.uid) return;
    setBioEditMode(false);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { bio: bioText });
      setUser({ ...user, bio: bioText });
    } catch (error) {
      console.error("Bio güncellenemedi:", error);
    }
  };

  // --- PROFİL FOTOĞRAFI YÜKLEME ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsProcessing(true);
    setProcessingText("Profil Resmi Yükleniyor...");

    try {
      const newPhotoUrl = await uploadImage(file);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: newPhotoUrl });
      setUser({ ...user, photoURL: newPhotoUrl });
    } catch (error) {
      alert("Profil resmi yüklenirken hata oluştu.");
    } finally {
      setIsProcessing(false);
      setProcessingText('');
    }
  };

  // --- GARAJA ARAÇ YÜKLEME (AI KONTROLLÜ) ---
  const handleVehicleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!model) {
      alert("Yapay zeka modeli hala yükleniyor, lütfen 1-2 saniye bekleyin.");
      return;
    }

    const files = e.target.files;
    if (!files || !user?.uid) return;

    // Garajda max 4 fotoğraf olabilir
    const currentPhotos = user.vehiclePhotos || [];
    const newFiles = Array.from(files).slice(0, 4 - currentPhotos.length);
    if (newFiles.length === 0) {
      alert("Garajınıza en fazla 4 araç fotoğrafı ekleyebilirsiniz.");
      return;
    }

    setIsProcessing(true);
    const uploadedUrls: string[] = [];

    for (const file of newFiles) {
      try {
        setProcessingText("Yapay Zeka Polisi İnceliyor...");
        
        // AI Tespiti
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => img.onload = resolve);
        const predictions = await model.detect(img);
        
        const isVehicle = predictions.some(p => 
          ['car', 'motorcycle', 'truck', 'bus', 'vehicle'].includes(p.class)
        );

        if (!isVehicle) {
          alert("🚨 Yapay Zeka Polisi: Bu fotoğrafta araç tespit edilemedi! Sadece vasıta görselleri kabul edilir.");
          continue;
        }

        // ImgBB Yükleme
        setProcessingText("Garaja Ekleniyor...");
        const imageUrl = await uploadImage(file);
        uploadedUrls.push(imageUrl);
      } catch (err) {
        console.error("Araç yükleme hatası:", err);
      }
    }

    // Yüklenenleri Firebase'e kaydet ve YÖNLENDİR!
    if (uploadedUrls.length > 0) {
      const updatedPhotos = [...currentPhotos, ...uploadedUrls];
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          vehiclePhotos: updatedPhotos,
          hasVehicle: true
        });
        setUser({ ...user, vehiclePhotos: updatedPhotos, hasVehicle: true });
        
        // KİLİT NOKTA: Fotoğraf başarıyla yüklendiği an Şarkı/Açıklama ekranına fırlatıyoruz!
        navigate('/specs');

      } catch (error) {
        console.error("Firebase güncelleme hatası:", error);
      }
    }

    setIsProcessing(false);
    setProcessingText('');
    if (vehicleInputRef.current) vehicleInputRef.current.value = '';
  };

  const tabs = ['Otomobil', 'Motor', 'Off-Road'];
  const hasPhotos = user?.vehiclePhotos && user.vehiclePhotos.length > 0;

  return (
    <div className="vante-container min-h-screen flex flex-col relative" style={{ background: '#000000' }}>
      
      {/* YÜKLEME VE YAPAY ZEKA POLİSİ ARAYÜZÜ */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.85)' }}
          >
            {processingText.includes("Polis") ? (
              <ShieldCheck size={48} className="text-white mb-4 animate-pulse" />
            ) : (
              <Loader2 size={32} className="text-[#888] animate-spin mb-4" />
            )}
            <p className="text-white font-medium tracking-wide">{processingText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-12 pb-4">
        <h1 className="text-white text-[22px] font-semibold leading-tight pr-4">
          Profil ve Garajınız
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/share')}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            aria-label="Paylaş"
          >
            <Share2 size={16} className="text-white" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            aria-label="Ayarlar"
          >
            <Settings size={16} className="text-white" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* Avatar & User Info */}
        <div className="flex items-center gap-3 py-2 mb-4">
          <motion.div
            className="relative cursor-pointer shrink-0"
            whileTap={{ scale: 0.95 }}
            onClick={() => !isProcessing && avatarInputRef.current?.click()}
          >
            <div
              className="w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: '#1E1E1E' }}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <Plus size={18} style={{ color: '#fff' }} strokeWidth={2.5} />
              )}
            </div>
          </motion.div>
          <div className="min-w-0">
            <p className="text-white text-[16px] font-semibold truncate">
              {user?.displayName || 'Kullanıcı Adı'}
            </p>
            <p className="text-[13px] truncate" style={{ color: '#888' }}>
              @{user?.displayName?.toLowerCase().replace(/\s/g, '') || 'user'}
            </p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[15px] font-semibold text-white">Hakkında</span>
            <button
              type="button"
              onClick={() => {
                if (bioEditMode) handleSaveBio();
                else setBioEditMode(true);
              }}
              className="p-1.5 rounded-full transition-colors"
              style={{ background: bioEditMode ? '#fff' : 'transparent' }}
              aria-label={bioEditMode ? 'Kaydet' : 'Düzenle'}
            >
              {bioEditMode ? (
                <Check size={14} color="#000" strokeWidth={2.5} />
              ) : (
                <Edit3 size={14} style={{ color: '#666' }} />
              )}
            </button>
          </div>
          <AnimatePresence mode="wait">
            {bioEditMode ? (
              <motion.textarea
                key="edit"
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                className="vante-input w-full resize-none text-sm"
                style={{ height: 80, padding: 12 }}
                placeholder="Açıklama ekleyin."
                autoFocus
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            ) : (
              <motion.p
                key="display"
                className="text-[14px] leading-relaxed"
                style={{ color: user?.bio ? '#999' : '#555' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {user?.bio || 'Modifiye ve araba hastası bir kullanıcı.'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Completion Tracker */}
        <motion.div
          className="mb-6 rounded-2xl p-4"
          style={{ background: 'rgba(18,18,18,0.6)', border: '1px solid #222' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-white">Profil Resmi Ekleyin.</span>
            <span className="text-[12px]" style={{ color: '#888' }}>2/24</span>
          </div>
          <div className="w-full h-[3px] rounded-full overflow-hidden mb-2.5" style={{ background: '#1a1a1a' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: '#3b82f6' }}
              initial={{ width: 0 }}
              animate={{ width: `${(2 / 24) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
          <p className="text-[11px]" style={{ color: '#666' }}>
            Profilini doldurmaya başlayalım...
          </p>
        </motion.div>

        {/* Garage Dropdown */}
        <div className="flex items-center justify-center py-1 mb-1">
          <div className="flex-1 h-px" style={{ background: '#222' }} />
          <button
            type="button"
            onClick={() => setGarageOpen(!garageOpen)}
            className="flex items-center gap-2 px-5 py-2 mx-3 rounded-full"
            style={{ background: '#121212', border: '1px solid #2a2a2a' }}
          >
            <span className="text-[13px] font-medium text-white">Garajınız</span>
            <motion.div animate={{ rotate: garageOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} style={{ color: '#888' }} />
            </motion.div>
          </button>
          <div className="flex-1 h-px" style={{ background: '#222' }} />
        </div>

        <AnimatePresence>
          {garageOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {/* Category Tabs */}
              <div className="flex gap-2 py-4">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className="px-4 py-2 rounded-full text-[13px] font-medium transition-all"
                      style={{
                        background: isActive ? '#d4d4d4' : '#121212',
                        color: isActive ? '#111' : '#666',
                        border: isActive ? 'none' : '1px solid #1a1a1a',
                      }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Gallery: Stacked card showcase */}
              {hasPhotos ? (
                <div className="space-y-6 pb-2">
                  {user.vehiclePhotos.map((photo: string, i: number) => (
                    <div key={i} className="relative pt-5">
                      <div
                        className="absolute left-3 right-3 top-0 h-[calc(100%-12px)] rounded-xl border border-[#1f1f1f]"
                        style={{ background: '#111', transform: 'translateY(-16px) scale(0.94)', zIndex: 0 }}
                      />
                      <div
                        className="absolute left-1.5 right-1.5 top-0 h-[calc(100%-6px)] rounded-xl border border-[#222]"
                        style={{ background: '#161616', transform: 'translateY(-8px) scale(0.97)', zIndex: 1 }}
                      />

                      <motion.div
                        className="relative z-10 rounded-xl overflow-hidden border border-[#2a2a2a]"
                        style={{ background: '#0a0a0a', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="w-full aspect-[4/3] overflow-hidden">
                          <img src={photo} alt="Garage" className="w-full h-full object-cover" />
                        </div>
                        <div
                          className="flex items-center justify-between px-4 py-3"
                          style={{ background: '#000' }}
                        >
                          <span className="text-[13px] font-medium text-white">Galerim</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => vehicleInputRef.current?.click()}
                              className="p-1 transition-opacity hover:opacity-70"
                              aria-label="Düzenle"
                            >
                              <Edit3 size={16} className="text-white" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate('/share')}
                              className="p-1 transition-opacity hover:opacity-70"
                              aria-label="Paylaş"
                            >
                              <Share2 size={16} className="text-white" strokeWidth={1.75} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))}

                  {user.vehiclePhotos.length < 4 && (
                    <motion.button
                      type="button"
                      className="flex w-full items-center justify-center rounded-xl border border-dashed py-4 transition-colors"
                      style={{ borderColor: '#333', background: '#0a0a0a' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => vehicleInputRef.current?.click()}
                    >
                      <Plus size={20} color="#888" className="mr-2" />
                      <span className="text-[#888] text-sm">Yeni Görsel Ekle</span>
                    </motion.button>
                  )}
                </div>
              ) : (
                <div className="relative pt-5 pb-2">
                  <div
                    className="absolute left-3 right-3 top-0 h-[calc(100%-12px)] rounded-xl border border-[#1f1f1f]"
                    style={{ background: '#111', transform: 'translateY(-16px) scale(0.94)', zIndex: 0 }}
                  />
                  <div
                    className="absolute left-1.5 right-1.5 top-0 h-[calc(100%-6px)] rounded-xl border border-[#222]"
                    style={{ background: '#161616', transform: 'translateY(-8px) scale(0.97)', zIndex: 1 }}
                  />

                  <motion.div
                    className="relative z-10 flex flex-col items-center justify-center rounded-xl overflow-hidden cursor-pointer border border-[#2a2a2a]"
                    style={{
                      background: '#0a0a0a',
                      minHeight: 240,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => vehicleInputRef.current?.click()}
                  >
                    <div className="flex flex-1 w-full items-center justify-center py-16">
                      <p className="text-[14px]" style={{ color: '#555' }}>
                        Görselleri Buraya Yükleyin...
                      </p>
                    </div>
                    <div
                      className="flex w-full items-center justify-between px-4 py-3"
                      style={{ background: '#000' }}
                    >
                      <span className="text-[13px] font-medium text-white">Galerim</span>
                      <div className="flex items-center gap-3">
                        <Edit3 size={16} className="text-[#444]" strokeWidth={1.75} />
                        <button type="button" onClick={(e) => { e.stopPropagation(); navigate('/share'); }}>
                           <Share2 size={16} className="text-[#444] transition-colors hover:text-white" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {skippedUpload && !hasPhotos && (
                <motion.div
                  className="mt-4 p-4 rounded-2xl"
                  style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-[12px] mb-3" style={{ color: '#888' }}>
                    Daha önce görselleri atladınız. Şimdi ekleyebilirsiniz.
                  </p>
                  <button
                    type="button"
                    onClick={() => vehicleInputRef.current?.click()}
                    className="w-full py-3 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2"
                    style={{ background: '#1E1E1E', color: '#fff' }}
                  >
                    <Plus size={16} />
                    Görselleri Ekle
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={vehicleInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleVehicleUpload}
          className="hidden"
        />
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />
      </div>

      <BottomNav />
    </div>
  );
}