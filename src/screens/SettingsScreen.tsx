import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flag, Bell, Info, Trash2, LogOut, Plus, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import BottomNav from '../components/BottomNav';

// Firebase bağlantıları
import { auth, db } from '../config/firebase';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { deleteUserData } from '../lib/accountDeletion';

// Uygulama sürümü - package.json ile senkronize
const APP_VERSION = '1.0.0';

interface SettingItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasToggle?: boolean;
  isDanger?: boolean;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  isDanger?: boolean;
}

// Native uyumlu onay dialog bileşeni
function ConfirmDialog({ dialog, onClose }: { dialog: ConfirmDialog; onClose: () => void }) {
  if (!dialog.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative w-full max-w-[400px] bg-[#1c1c1e] rounded-2xl overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4 text-center">
          <h3 className="text-white text-[17px] font-semibold mb-2">{dialog.title}</h3>
          <p className="text-[#8e8e93] text-[14px] leading-relaxed">{dialog.message}</p>
        </div>
        <div className="border-t border-[#333]">
          <button
            onClick={() => { dialog.onConfirm(); onClose(); }}
            className={`w-full py-4 text-[17px] font-medium border-b border-[#333] transition-colors active:bg-[#2c2c2e] ${dialog.isDanger ? 'text-[#ff3b30]' : 'text-[#3b82f6]'}`}
          >
            Onayla
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 text-[17px] font-medium text-white transition-colors active:bg-[#2c2c2e]"
          >
            İptal
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Native uyumlu bilgi toast bileşeni
function InfoToast({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-16 left-4 right-4 z-50 max-w-[400px] mx-auto"
    >
      <div className="bg-[#1c1c1e] border border-[#333] rounded-2xl px-5 py-4 shadow-2xl">
        <p className="text-white text-[14px] text-center leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full mt-3 text-[#3b82f6] text-[14px] font-medium"
        >
          Tamam
        </button>
      </div>
    </motion.div>
  );
}

export default function SettingsScreen() {
  const { user, setUser, logout } = useStore();
  const navigate = useNavigate();

  // Veritabanındaki değere göre (yoksa varsayılan olarak true) başlat
  const [notifToggle, setNotifToggle] = useState(user?.notificationsEnabled !== false);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void, isDanger = false) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm, isDanger });
  };

  const showInfo = (message: string) => {
    setInfoMessage(message);
  };

  const handleAction = async (id: string) => {
    switch (id) {
      case 'logout':
        showConfirm(
          'Oturumu Kapat',
          'Oturumu kapatmak istediğinize emin misiniz?',
          async () => {
            try {
              await signOut(auth);
              logout();
            } catch (error) {
              console.error('Çıkış yapılırken hata oluştu:', error);
              showInfo('Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
            }
          }
        );
        break;

      case 'delete_account':
        showConfirm(
          'Hesabı Kalıcı Olarak Sil',
          'Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!',
          async () => {
            try {
              if (auth.currentUser && user?.uid) {
                await deleteUserData(user.uid);
                await deleteUser(auth.currentUser);
                logout();
              }
            } catch (error: unknown) {
              const firebaseError = error as { code?: string };
              if (firebaseError.code === 'auth/requires-recent-login') {
                showInfo('Güvenlik nedeniyle hesabınızı silebilmek için oturumu kapatıp tekrar giriş yapmanız gerekmektedir.');
              } else {
                showInfo('Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.');
                console.error(error);
              }
            }
          },
          true // isDanger
        );
        break;

      case 'notifications':
        handleToggleNotifications();
        break;

      case 'terms':
        // Native ortamda Capacitor Browser, web'de window.open
        (async () => {
          try {
            const { Capacitor } = await import('@capacitor/core');
            if (Capacitor.isNativePlatform()) {
              const { Browser } = await import('@capacitor/browser');
              await Browser.open({ url: `${import.meta.env.VITE_APP_URL || 'https://vante.vercel.app'}/legal/terms.html` });
            } else {
              window.open('/legal/terms.html', '_blank', 'noopener,noreferrer');
            }
          } catch {
            window.open('/legal/terms.html', '_blank', 'noopener,noreferrer');
          }
        })();
        break;

      case 'privacy':
        (async () => {
          try {
            const { Capacitor } = await import('@capacitor/core');
            if (Capacitor.isNativePlatform()) {
              const { Browser } = await import('@capacitor/browser');
              await Browser.open({ url: `${import.meta.env.VITE_APP_URL || 'https://vante.vercel.app'}/legal/privacy.html` });
            } else {
              window.open('/legal/privacy.html', '_blank', 'noopener,noreferrer');
            }
          } catch {
            window.open('/legal/privacy.html', '_blank', 'noopener,noreferrer');
          }
        })();
        break;

      case 'profile_edit':
        navigate('/garage');
        break;

      case 'lane_preferences':
        navigate('/garage');
        break;

      default:
        break;
    }
  };

  const handleToggleNotifications = async () => {
    const newState = !notifToggle;
    setNotifToggle(newState);

    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          notificationsEnabled: newState
        });
        setUser({ ...user, notificationsEnabled: newState });
      } catch (error) {
        console.error('Bildirim ayarı güncellenemedi:', error);
        setNotifToggle(!newState);
      }
    }
  };

  const mainItems: SettingItem[] = [
    {
      id: 'profile_edit',
      label: 'Profili Düzenle',
      icon: (
        <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden" style={{ background: '#3b82f6' }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-white uppercase">
              {(user?.displayName || 'VA').slice(0, 2)}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'lane_preferences',
      label: 'Kulvar Tercihleri',
      icon: <Flag size={18} style={{ color: '#888' }} />,
    },
    {
      id: 'notifications',
      label: 'Bildirimler',
      icon: <Bell size={18} style={{ color: '#888' }} />,
      hasToggle: true,
    },
    {
      id: 'terms',
      label: 'İlkeler ve Yasal Koşullar',
      icon: <Info size={18} style={{ color: '#888' }} />,
    },
    {
      id: 'privacy',
      label: 'Gizlilik Politikası',
      icon: <Info size={18} style={{ color: '#888' }} />,
    },
    {
      id: 'delete_account',
      label: 'Hesabı Kalıcı Olarak Sil',
      icon: <Trash2 size={18} style={{ color: '#888' }} />,
      isDanger: true,
    },
    {
      id: 'logout',
      label: 'Oturumu Kapat',
      icon: <LogOut size={18} style={{ color: '#888' }} />,
    },
  ];

  return (
    <div className="vante-container min-h-screen flex flex-col" style={{ background: '#000000' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-white text-[22px] font-semibold mb-6">Ayarlar</h1>

        {/* Email Row */}
        <div className="flex items-center justify-between">
          <span className="text-[14px]" style={{ color: '#ccc' }}>
            {user?.email || 'kullanici@vanteapp.com'}
          </span>
          <button className="p-1 transition-transform active:scale-95">
            <Plus size={18} style={{ color: '#888' }} />
          </button>
        </div>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <div className="space-y-1">
          {mainItems.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => handleAction(item.id)}
              className="w-full flex items-center gap-4 py-3.5 text-left active:bg-[#111] transition-colors rounded-lg px-2 -mx-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              {/* Icon */}
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>

              {/* Label */}
              <span
                className="flex-1 text-[14px] font-medium"
                style={{ color: item.isDanger ? '#ff3b30' : '#fff' }}
              >
                {item.label}
              </span>

              {/* Right side: toggle or chevron */}
              {item.hasToggle ? (
                <div
                  className="w-11 h-6 rounded-full relative flex-shrink-0 transition-colors cursor-pointer"
                  style={{ background: notifToggle ? '#3b82f6' : '#333' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleNotifications();
                  }}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                    animate={{ left: notifToggle ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              ) : (
                <ChevronRight size={16} style={{ color: '#444' }} />
              )}
            </motion.button>
          ))}
        </div>

        {/* Version */}
        <div className="flex flex-col items-center pt-16 pb-4">
          <p className="vante-wordmark text-[16px] mb-1 font-bold" style={{ color: '#fff', letterSpacing: '4px' }}>
            VANTE
          </p>
          <p className="text-[12px]" style={{ color: '#555' }}>
            Sürüm {APP_VERSION}
          </p>
        </div>
      </div>

      {/* Native uyumlu onay dialog */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Native uyumlu bilgi toast */}
      <InfoToast
        message={infoMessage}
        onClose={() => setInfoMessage(null)}
      />

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
