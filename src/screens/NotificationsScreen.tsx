import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import BottomNav from '../components/BottomNav';
import { NotificationsSkeleton } from '../components/skeletons';

// Firebase bağlantıları
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

// Bildirim Tipi
type Notification = {
  id: string;
  type: string; // 'milestone' veya 'system' olacak
  message: string;
  read?: boolean;
  timestamp: any;
};

export default function NotificationsScreen() {
  const { user } = useStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. YENİ 'notifications' TABLOSUNU DİNLE
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Sadece özel bildirimlerin ve dönüm noktalarının olduğu 'notifications' tablosu
    const q = query(
      collection(db, 'notifications'), 
      where('to', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifs: Notification[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.read) {
          fetchedNotifs.push({
            id: docSnap.id,
            type: data.type || 'system',
            message: data.message || 'Sistemsel bir bildiriminiz var.',
            read: data.read,
            timestamp: data.timestamp
          });
        }
      });

      // En yeniler en üstte
      fetchedNotifs.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      setNotifications(fetchedNotifs);
      setIsLoading(false);
    }, (error) => {
      console.error('Bildirimler dinlenemedi:', error);
      setIsLoading(false);
    });

    return () => unsubscribe(); 
  }, [user?.uid]);

  const visibleNotifications = notifications.filter((n) => !dismissed.includes(n.id));
  const unreadCount = visibleNotifications.length;

  const handleDismiss = async (id: string) => {
    setDismissed((prev) => [...prev, id]);
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Bildirim güncellenemedi:", error);
    }
  };

  if (isLoading) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="vante-container min-h-screen flex flex-col" style={{ background: '#000000' }}>
      <div className="px-5 pt-12 pb-6 flex items-center gap-3">
        <h1 className="text-white text-[22px] font-semibold">Bildirimler</h1>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ background: '#ff3b30', color: '#fff', padding: '0 6px' }}
            >
              {unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col px-5">
        <AnimatePresence mode="wait">
          {visibleNotifications.length === 0 ? (
            <motion.div
              key="empty"
              className="flex-1 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-full max-w-[320px] flex items-center gap-3 px-5 py-4 rounded-full"
                style={{ background: '#121212', border: '1px solid #1a1a1a' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#1a1a1a' }}>
                  <Info size={16} style={{ color: '#888' }} />
                </div>
                <p className="text-[14px]" style={{ color: '#aaa' }}>
                  Şimdilik her şey sakin. Garajını parlat!
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {visibleNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  className="relative w-full flex items-center gap-3 px-5 py-4 rounded-full"
                  style={{ background: '#121212', border: '1px solid #1a1a1a' }}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10 hover:scale-110 transition-transform"
                    style={{ background: '#2a2a2a' }}
                  >
                    <X size={10} style={{ color: '#888' }} />
                  </button>

                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#1a1a1a' }}>
                    {notification.type === 'milestone' ? (
                      <Trophy size={16} style={{ color: '#f59e0b' }} />
                    ) : (
                      <Info size={16} style={{ color: '#3b82f6' }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white leading-snug">
                      {notification.type === 'milestone' ? 'Yeni Bir Başarı!' : 'Vante Duyurusu'}
                    </p>
                    <p className="text-[11px]" style={{ color: '#666' }}>
                      {notification.message}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="flex-shrink-0 text-[12px] font-medium px-4 py-2 rounded-full transition-colors active:scale-95"
                    style={{ background: '#1a1a1a', color: '#ccc' }}
                  >
                    Gizle
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1" />

        <div className="flex justify-center py-6">
          <motion.button
            onClick={() => window.history.back()}
            className="text-[13px] font-medium px-6 py-3 rounded-full"
            style={{ background: '#121212', color: '#888', border: '1px solid #1a1a1a' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.97 }}
          >
            Garaja Geri Dön
          </motion.button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}