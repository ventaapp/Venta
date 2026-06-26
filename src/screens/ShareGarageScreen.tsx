import React, { useState, useRef } from 'react';
import BottomNav from '../components/BottomNav';

export default function ShareGarageScreen() {
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dosya (Fotoğraf) seçildiğinde çalışacak fonksiyon
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string); // Resmi state'e ekle
      };
      reader.readAsDataURL(file);
    }
  };

  // Paylaş butonuna basıldığında telefonun yerleşik paylaş menüsünü açar
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vante'deki Garajım",
          text: "Sen de Vante'ye katıl ve garajımı gör!",
          url: window.location.href, // İleride buraya kullanıcının özel profil linkini koyabiliriz
        });
      } catch (error) {
        console.log('Paylaşım iptal edildi veya hata oluştu:', error);
      }
    } else {
      // Eğer tarayıcı/cihaz bunu desteklemiyorsa yedek uyarı
      alert('Tarayıcınız yerleşik paylaşım özelliğini desteklemiyor. Link kopyalandı sayın :)');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-['Inter']">
      
      {/* Üst Başlık Alanı */}
      <div className="pt-24 px-6 text-center shrink-0">
        <h1 className="text-white text-[24px] font-bold tracking-tight">Garajını Paylaş!</h1>
        <p className="mt-4 text-[14px] text-[#888] leading-relaxed max-w-[280px] mx-auto">
          Arabacı arkadaşlarınla veya yakın arkadaşlarına Vante'deki garajını göster.
        </p>
      </div>

      {/* Paylaşım Kartı ve Buton Konteyneri */}
      <div className="px-6 mt-10 flex-1 flex flex-col pb-24">
        
        {/* Ana Kart */}
        <div className="bg-[#080808] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          
          {/* Fotoğraf / Yükleme Alanı */}
          <div 
            className="relative w-full aspect-[4/5] bg-[#050505] cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? (
              // Dolu Durum: Seçilen Fotoğrafı Göster
              <img src={image} alt="Vante Garage" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              // Boş Durum: Kesik Çizgili Yükleme Alanı
              <div className="absolute inset-4 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center bg-[#0a0a0a]">
                <p className="text-[14px] text-[#555]">Görselleri Buraya Yükleyin...</p>
              </div>
            )}
            
            {/* Gizli Dosya Seçici */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Kartın Alt Kısmı (Marka Bilgisi) */}
          <div className="p-5 flex items-center justify-between bg-[#080808]">
            <div className="flex flex-col">
              <span className="text-white text-[15px] font-medium">Vante'deki Garajım</span>
              <span className="text-[#777] text-[13px] mt-1">Sende Vante'ye Katıl</span>
            </div>
            <div className="text-white text-[16px] font-black tracking-[0.25em]">
              VANTE
            </div>
          </div>
        </div>

        {/* Paylaş Butonu */}
        <button 
          onClick={handleShare}
          className="mt-6 w-full py-4 bg-[#111] hover:bg-[#1a1a1a] transition-colors rounded-full text-[#aaa] text-[15px] font-medium"
        >
          Paylaş ve Göster
        </button>
      </div>

      {/* Alt Menü */}
      <BottomNav />
    </div>
  );
}