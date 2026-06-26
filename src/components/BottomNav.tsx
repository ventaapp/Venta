import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Zap, Medal, User } from 'lucide-react';
import { useStore } from '../store/useStore';

const navItems = [
  { id: 'home', label: 'Ana Sayfa', icon: Home, path: '/feed' },
  { id: 'plus-one', label: '+1', icon: Zap, path: '/plus-one' },
  { id: 'badges', label: 'Rozetler', icon: Medal, path: '/badges' },
  { id: 'profile', label: 'Profil', icon: User, path: '/garage' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentTab } = useStore();

  const handleNav = (item: (typeof navItems)[number]) => {
    setCurrentTab(item.id);
    navigate(item.path);
  };

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner flex items-stretch justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handleNav(item)}
              className="relative flex flex-1 flex-col items-center justify-center min-h-[50px] py-2 px-1"
              whileTap={{ scale: 0.96 }}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-pill"
                  className="bottom-nav-active-pill absolute inset-x-1 inset-y-1"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}

              <Icon
                size={20}
                strokeWidth={isActive ? 2.1 : 1.75}
                className="relative z-10 shrink-0 transition-colors duration-200"
                style={{
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.42)',
                }}
              />
              <span
                className="relative z-10 mt-[5px] text-[10px] font-medium leading-none transition-colors duration-200"
                style={{
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.42)',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
