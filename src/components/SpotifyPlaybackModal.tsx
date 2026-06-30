import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SpotifyPlaybackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export default function SpotifyPlaybackModal({
  isOpen,
  onClose,
}: SpotifyPlaybackModalProps) {
  const handleConnect = () => {
    if (!CLIENT_ID) return;

    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      getSpotifyAuthUrl(),
      'spotify-auth',
      `width=${width},height=${height},top=${top},left=${left},popup=1`
    );

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#1c1c1e] rounded-2xl w-full max-w-[340px] p-6 text-center"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 bg-[#222] rounded-full hover:bg-[#333]"
            >
              <X size={16} className="text-white" />
            </button>

            {/* Spotify Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <SpotifyIcon className="w-5 h-5 text-black" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              Spotify Gerekli
            </h3>
            <p className="text-[#8e8e93] text-sm mb-6 leading-relaxed">
              Bu içeriği dinleyebilmek için Spotify hesabınızı bağlamanız
              gerekmektedir.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConnect}
                disabled={!CLIENT_ID}
                className="bg-white hover:bg-gray-200 text-black text-sm font-semibold
                           py-3 rounded-full transition-colors duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!CLIENT_ID ? 'Spotify ID ayarlanmadı' : 'Spotify ile Bağlan'}
              </button>
              <button
                onClick={onClose}
                className="bg-transparent hover:bg-white/5 text-[#8e8e93] text-sm font-medium
                           py-3 rounded-full transition-colors duration-200"
              >
                Vazgeç
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
