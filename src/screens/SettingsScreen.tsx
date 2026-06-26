import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, Bell, Info, Trash2, LogOut, Plus, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import BottomNav from '../components/BottomNav';

// Firebase bağlantıları
import { auth, db } from '../config/firebase';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { deleteUserData } from '../lib/accountDeletion';

interface SettingItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasToggle?: boolean;
  isDanger?: boolean;
}

export default function SettingsScreen() {
  const { user, setUser, logout } = useStore();
  
  // Veritabanındaki değere göre (yoksa varsayılan olarak true) başlat
  const [notifToggle, setNotifToggle] = useState(user?.notificationsEnabled !== false);

  const handleAction = async (id: string) => {
    switch (id) {
      case 'logout':
        if (window.confirm('Oturumu kapatmak istediğinize emin misiniz?')) {
          try {
            await signOut(auth); // Firebase'den çıkış
            logout(); // Zustand Store'u temizle (Seni Login'e atacaktır)
          } catch (error) {
            console.error("Çıkış yapılırken hata oluştu:", error);
          }
        }
        break;

      case 'delete_account':
        if (window.confirm('Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
          try {
            if (auth.currentUser && user?.uid) {
              await deleteUserData(user.uid);
              await deleteUser(auth.currentUser);
              logout();
            }
          } catch (error: any) {
            // Firebase güvenlik önlemi: Hesap silmek için "yeni" giriş yapmış olmak gerekir
            if (error.code === 'auth/requires-recent-login') {
              alert("Güvenlik nedeniyle hesabınızı silebilmek için oturumu kapatıp tekrar giriş yapmanız gerekmektedir.");
            } else {
              alert("Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.");
              console.error(error);
            }
          }
        }
        break;

      case 'notifications':
        handleToggleNotifications();
        break;

      case 'terms':
        window.open('/legal/terms.html', '_blank', 'noopener,noreferrer');
        break;

      case 'privacy':
        window.open('/legal/privacy.html', '_blank', 'noopener,noreferrer');
        break;

      case 'profile_edit':
        window.location.href = '/garage';
        break;

      case 'lane_preferences':
        window.location.href = '/garage';
        break;

      default:
        break;
    }
  };

  const handleToggleNotifications = async () => {
    const newState = !notifToggle;
    setNotifToggle(newState); // Ekranda anında değişsin
    
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          notificationsEnabled: newState
        });
        setUser({ ...user, notificationsEnabled: newState });
      } catch (error) {
        console.error("Bildirim ayarı güncellenemedi:", error);
        setNotifToggle(!newState); // Hata olursa eski haline geri al
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
            Sürüm 1.0.0
          </p>
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}