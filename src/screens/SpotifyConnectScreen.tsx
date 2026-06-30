import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Orijinal Spotify Logosu (SVG)
const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.42z"/>
  </svg>
);

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/feed';

function getSpotifyAuthUrl(): string {
  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'token',
    redirect_uri: REDIRECT_URI,
    scope: scopes,
    show_dialog: 'true',
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export default function SpotifyConnectScreen() {
  const navigate = useNavigate();
  const { user, setOnboardingStep, setIsSpotifyConnected, setSpotifyAccessToken } = useStore();

  const handleConnect = () => {
    // Spotify Implicit Grant flow - popup olarak aç
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      getSpotifyAuthUrl(),
      'spotify-auth',
      `width=${width},height=${height},top=${top},left=${left},popup=1`
    );

    // Popup'tan gelen mesajları dinle
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
        const { access_token } = event.data;

        // Token'ı store'a kaydet
        setSpotifyAccessToken(access_token);
        setIsSpotifyConnected(true);

        // Firebase'e kaydet
        if (user?.uid) {
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              isSpotifyConnected: true,
              spotifyAccessToken: access_token,
              onboardingStep: 6,
            });
          } catch (err) {
            console.error('Spotify kaydetme hatası:', err);
          }
        }

        setOnboardingStep(6);
        navigate('/feed');
        window.removeEventListener('message', handleMessage);
      }

      if (event.data?.type === 'SPOTIFY_AUTH_ERROR') {
        console.error('Spotify auth error:', event.data.error);
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);

    // Popup kapandığında listener'ı temizle
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      }
    }, 1000);
  };

  const handleSkip = async () => {
    // Firebase'e skip durumunu kaydet
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          isSpotifyConnected: false,
          onboardingStep: 6,
        });
      } catch (err) {
        console.error('Skip kaydetme hatası:', err);
      }
    }

    setOnboardingStep(6);
    navigate('/feed');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-16 pb-8">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[28px] font-bold mb-3 leading-tight tracking-tight"
        >
          Sesli İçerik Erişimi
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-[#888] text-[15px] mb-16 leading-relaxed max-w-[90%]"
        >
          Topluluğun akışa eklediği tüm parçaları uygulama içinde pürüzsüzce
          oynatabilmek için Spotify entegrasyonunu aktif et.
        </motion.p>

        {/* Center Card */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center text-center"
          >
            {/* Spotify Icon */}
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4">
              <SpotifyIcon className="w-6 h-6 text-black" />
            </div>

            <h2 className="text-lg font-semibold mb-2">Spotify ile Bağlan</h2>
            <p className="text-[#636366] text-sm leading-relaxed mb-8 max-w-[260px]">
              Vante gizliliğinize saygı duyar. İzniniz olmadan asla
              profilinizde değişiklik yapmaz.
            </p>

            {/* Connect Button */}
            <button
              onClick={handleConnect}
              disabled={!CLIENT_ID}
              className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white text-sm font-medium
                         px-10 py-3 rounded-full transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!CLIENT_ID ? 'Spotify ID ayarlanmadı' : 'Bağlan'}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex items-center justify-between px-6 pb-12"
      >
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white text-sm font-medium
                     px-6 py-3 rounded-full transition-colors duration-200"
        >
          Geç
        </button>

        {/* Forward Button */}
        <button
          onClick={handleSkip}
          className="bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white
                     w-12 h-12 rounded-full flex items-center justify-center
                     transition-colors duration-200"
        >
          <ArrowRight size={20} />
        </button>
      </motion.div>
    </div>
  );
}
