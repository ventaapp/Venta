import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, Bell, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';

const navItems = [
  { id: 'home', label: 'Ana Sayfa', icon: Home, path: '/feed' },
  { id: 'profile', label: 'Profil', icon: User, path: '/garage' },
  { id: 'notifications', label: 'Bildirimler', icon: Bell, path: '/notifications' },
  { id: 'settings', label: 'Ayarlar', icon: Settings, path: '/settings' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentTab, notifications } = useStore();
  
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNav = (item: typeof navItems[0]) => {
    setCurrentTab(item.id);
    navigate(item.path);
  };

  return (
    <div className="bottom-nav px-4 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNav(item)}
              className="flex flex-col items-center justify-center py-2 px-3 relative"
              whileTap={{ scale: 0.9 }}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{ color: isActive ? '#fff' : '#555' }}
                />
                {/* Notification badge */}
                {item.id === 'notifications' && unreadCount > 0 && (
                  <div
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: '#ff3b30', color: '#fff', padding: '0 4px' }}
                  >
                    {unreadCount}
                  </div>
                )}
              </div>
              <span
                className="text-[10px] mt-1 font-medium"
                style={{ color: isActive ? '#fff' : '#555' }}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
