import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import { BadgesSkeleton } from '../components/skeletons';
import { useStore } from '../store/useStore';
import {
  computeEarnedBadges,
  fetchBadgeStats,
  getCurrentBadge,
  getNextGoalLabel,
  type BadgeStats,
} from '../lib/badges';

export default function BadgesScreen() {
  const { user } = useStore();
  const [stats, setStats] = useState<BadgeStats | null>(null);
  const [currentBadge, setCurrentBadge] = useState(getCurrentBadge(['yeni-uye']));
  const [goalLabel, setGoalLabel] = useState('');
  const [allComplete, setAllComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    const loadBadgeProgress = async () => {
      setIsLoading(true);
      try {
        const fetchedStats = await fetchBadgeStats(user.uid);
        const earned = computeEarnedBadges(fetchedStats);
        setStats(fetchedStats);
        setCurrentBadge(getCurrentBadge(earned));
        setGoalLabel(getNextGoalLabel(fetchedStats, earned));
        setAllComplete(earned.includes('topluluk-sesi'));
      } catch (error) {
        console.error('Rozet verileri yüklenemedi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBadgeProgress();
  }, [user?.uid]);

  const handleShare = async () => {
    const shareText = `${currentBadge.name} rozetini kazandım! — VANTE`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VANTE Rozetler',
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // kullanıcı iptal etti
      }
    }
    alert(shareText);
  };

  if (isLoading) {
    return <BadgesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col pb-[88px]">
      <header className="shrink-0 px-5 pt-12 pb-2">
        <h1 className="text-white text-[28px] font-bold tracking-tight">Rozetler</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5">
            <div className="relative w-full max-w-[320px] flex items-center justify-center">
              <div className="relative flex items-center justify-center w-full py-6">
                <div
                  className="absolute inset-0 mx-auto rounded-full blur-3xl opacity-35"
                  style={{
                    width: '220px',
                    height: '220px',
                    background: 'radial-gradient(circle, rgba(180,180,180,0.35) 0%, transparent 70%)',
                  }}
                />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentBadge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <img
                      src={currentBadge.image}
                      alt={currentBadge.name}
                      className="w-[240px] h-[240px] object-contain drop-shadow-2xl"
                      draggable={false}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentBadge.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center mt-2 w-full max-w-[320px]"
              >
                <h2 className="text-white text-[20px] font-bold tracking-tight">{currentBadge.name}</h2>
                <p className="mt-1 text-[13px] font-medium tracking-[3px] text-[#888] uppercase">
                  {currentBadge.subtitle}
                </p>

                {!allComplete && (
                  <div
                    className="mt-5 w-full rounded-full px-5 py-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-[13px] text-[#888]">
                      Yeni Rozet İçin{' '}
                      <span className="text-white font-medium">{goalLabel}</span>
                    </p>
                  </div>
                )}

                {allComplete && (
                  <div
                    className="mt-5 w-full rounded-full px-5 py-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-[13px] text-white font-medium">Tüm rozetler tamamlandı</p>
                  </div>
                )}

                {stats && !stats.hasVehicle && (
                  <p className="mt-3 text-[11px] text-[#555]">Garajına ilk aracını ekleyerek ilerle</p>
                )}

                {stats && stats.hasVehicle && !allComplete && (
                  <p className="mt-3 text-[11px] text-[#555]">
                    Feed&apos;de paylaştığın içeriklere Maşallah gelince ilerlersin
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

      <div className="shrink-0 px-5 pb-6">
        <div
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5"
          style={{ background: '#111', border: '1px solid #1a1a1a' }}
        >
          <p className="text-[13px] text-[#888] leading-snug">Bunu Arkadaşlarınla Paylaş</p>
          <button
            type="button"
            onClick={handleShare}
            className="shrink-0 rounded-full px-5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
          >
            Paylaş
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
