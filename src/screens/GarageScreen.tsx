import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Edit3, Check, Loader2, ShieldCheck, Share2, Settings, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';

// TensorFlow & COCO-SSD Ice Aktarimi (Arac Tespiti Icin)
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Firebase baglantilari
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

  // Yapay Zeka ve Ykleme Islemleri icin Stateler
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');

  // 1. TensorFlow Modeli Yukle (Garaja arac ekleme ihtimaline karsi)
  useEffect(() => {
    async function loadModel() {
      await tf.ready();
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    }
    loadModel();
  }, []);

  // --- DINAMIK PROFIL TAMAMLANMA ORANI ---
  const completion = useMemo(() => {
    if (!user) return { score: 0, total: 5, label: 'Profilini olustur...', pct: 0 };
    
    let score = 0;
    const checks = [
      !!user.displayName && user.displayName.length > 0,
      !!user.photoURL && user.photoURL.length > 0,
      !!user.bio && user.bio.length > 0,
      !!user.lane,
      user.hasVehicle && (user.vehiclePhotos?.length ?? 0) > 0,
    ];
    score = checks.filter(Boolean).length;
    
    const labels = [
      'Profilini olusturmaya basla...',
      'Bilgilerini ekle...',
      'Kendini tanit...',
      'Kulvarini sec...',
      'Garajini doldur...',
      'Profil tamamlandi!',
    ];
    
    return {
      score,
      total: 5,
      label: labels[score] ?? labels[0],
      pct: (score / 5) * 100,
    };
  }, [user]);

  // --- BIOGRAFI KAYDETME ---
  const handleSaveBio = async () => {
    if (!user?.uid) return;
    setBioEditMode(false);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { bio: bioText });
      setUser({ ...user, bio: bioText });
    } catch (error) {
      console.error("Bio guncellenemedi:", error);
    }
  };

  // --- PROFIL FOTOGRAFI YUKLEME ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsProcessing(true);
    setProcessingText("Profil Resmi Yukleniyor...");

    try {
      const newPhotoUrl = await uploadImage(file);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: newPhotoUrl });
      setUser({ ...user, photoURL: newPhotoUrl });
    } catch (error) {
      alert("Profil resmi yuklenirken hata olustu.");
    } finally {
      setIsProcessing(false);
      setProcessingText('');
    }
  };

  // --- GARAJA ARAC YUKLEME (AI KONTROLLU) ---
  const handleVehicleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!model) {
      alert("Yapay zeka modeli hala yukleniyor, lutfen 1-2 saniye bekleyin.");
      return;
    }

    const files = e.target.files;
    if (!files || !user?.uid) return;

    // Garajda max 4 fotograf olabilir
    const currentPhotos = user.vehiclePhotos || [];
    const newFiles = Array.from(files).slice(0, 4 - currentPhotos.length);
    if (newFiles.length === 0) {
      alert("Garajiniza en fazla 4 arac fotografi ekleyebilirsiniz.");
      return;
    }

    setIsProcessing(true);
    const uploadedUrls: string[] = [];

    for (const file of newFiles) {
      try {
        setProcessingText("Yapay Zeka Polisi Inceliyor...");
        
        // AI Tespiti
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => img.onload = resolve);
        const predictions = await model.detect(img);
        
        const isVehicle = predictions.some(p => 
          ['car', 'motorcycle', 'truck', 'bus', 'vehicle'].includes(p.class)
        );

        if (!isVehicle) {
          alert("🚨 Yapay Zeka Polisi: Bu fotografta arac tespit edilemedi! Sadece vasita gorselleri kabul edilir.");
          continue;
        }

        // ImgBB Yukleme
        setProcessingText("Garaja Ekleniyor...");
        const imageUrl = await uploadImage(file);
        uploadedUrls.push(imageUrl);
      } catch (err) {
        console.error("Arac yukleme hatasi:", err);
      }
    }

    // Yuklenenleri Firebase'e kaydet ve YONLENDIR!
    if (uploadedUrls.length > 0) {
      const updatedPhotos = [...currentPhotos, ...uploadedUrls];
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          vehiclePhotos: updatedPhotos,
          hasVehicle: true
        });
        setUser({ ...user, vehiclePhotos: updatedPhotos, hasVehicle: true });
        
        // KILIT NOKTA: Fotograf basariyla yuklendigi an Sarki/Aciklama ekranina firlatiyoruz!
        navigate('/specs');

      } catch (error) {
        console.error("Firebase guncelleme hatasi:", error);
      }
    }

    setIsProcessing(false);
    setProcessingText('');
    if (vehicleInputRef.current) vehicleInputRef.current.value = '';
  };

  // --- ARAC FOTOGRAFI SILME ---
  const handleDeletePhoto = async (index: number) => {
    if (!user?.uid) return;
    if (!window.confirm('Bu fotografi silmek istedigine emin misin?')) return;
    
    const updatedPhotos = user.vehiclePhotos.filter((_: string, i: number) => i !== index);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        vehiclePhotos: updatedPhotos,
        hasVehicle: updatedPhotos.length > 0,
      });
      setUser({ ...user, vehiclePhotos: updatedPhotos, hasVehicle: updatedPhotos.length > 0 });
    } catch (error) {
      console.error("Fotograf silinemedi:", error);
      alert("Fotograf silinirken bir hata olustu.");
    }
  };

  const tabs = ['Otomobil', 'Motor', 'Off-Road'];
  const hasPhotos = user?.vehiclePhotos && user.vehiclePhotos.length > 0;

  return (
    <div className="vante-container min-h-screen flex flex-col relative" style={{ background: '#000000' }}>
      
      {/* YUKLEME VE YAPAY ZEKA POLISI ARAYUZU */}
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
          Profil ve Garajiniz
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/share')}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            aria-label="Paylas"
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
              {user?.displayName || 'Kullanici Adi'}
            </p>
            <p className="text-[13px] truncate" style={{ color: '#888' }}>
              @{user?.displayName?.toLowerCase().replace(/\s/g, '') || 'user'}
            </p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[15px] font-semibold text-white">Hakkinda</span>
            <button
              type="button"
              onClick={() => {
                if (bioEditMode) handleSaveBio();
                else setBioEditMode(true);
              }}
              className="p-1.5 rounded-full transition-colors"
              style={{ background: bioEditMode ? '#fff' : 'transparent' }}
              aria-label={bioEditMode ? 'Kaydet' : 'Duzenle'}
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
                placeholder="Aciklama ekleyin."
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
                {user?.bio || 'Modifiye ve araba hastasi bir kullanici.'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Completion Tracker - DINAMIK */}
        <motion.div
          className="mb-6 rounded-2xl p-4"
          style={{ background: 'rgba(18,18,18,0.6)', border: '1px solid #222' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-white">{completion.label}</span>
            <span className="text-[12px]" style={{ color: '#888' }}>{completion.score}/{completion.total}</span>
          </div>
          <div className="w-full h-[3px] rounded-full overflow-hidden mb-2.5" style={{ background: '#1a1a1a' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: '#3b82f6' }}
              initial={{ width: 0 }}
              animate={{ width: `${completion.pct}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
          <p className="text-[11px]" style={{ color: '#666' }}>
            {completion.score === completion.total 
              ? 'Tebrikler! Profilin tamamlandi.' 
              : 'Profilini tamamlamaya devam et...'}
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
            <span className="text-[13px] font-medium text-white">Garajiniz</span>
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
                        <div className="w-full aspect-[4/3] overflow-hidden relative">
                          <img src={photo} alt="Garage" className="w-full h-full object-cover" />
                          {/* Silme butonu */}
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(i)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-red-500/80"
                            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                            aria-label="Fotografi sil"
                          >
                            <Trash2 size={14} className="text-white" />
                          </button>
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
                              aria-label="Duzenle"
                            >
                              <Edit3 size={16} className="text-white" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate('/share')}
                              className="p-1 transition-opacity hover:opacity-70"
                              aria-label="Paylas"
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
                      <span className="text-[#888] text-sm">Yeni Gorsel Ekle</span>
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
                        Gorselleri Buraya Yukleyin...
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
                    Daha once gorselleri atladiniz. Simdi ekleyebilirsiniz.
                  </p>
                  <button
                    type="button"
                    onClick={() => vehicleInputRef.current?.click()}
                    className="w-full py-3 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2"
                    style={{ background: '#1E1E1E', color: '#fff' }}
                  >
                    <Plus size={16} />
                    Gorselleri Ekle
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
