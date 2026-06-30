import { create } from 'zustand';

export type Lane = 'Otomobil' | 'Motosiklet' | 'Off-Road' | null;

export interface Vehicle {
  id: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  imageUrl: string;
  category: string;
  brand?: string;
  year?: string;
  story?: string;
  likes: number;
}

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  bio: string;
  lane: Lane;
  profileCompleted: boolean;
  hasVehicle: boolean;
  vehiclePhotos: string[];
  createdAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  type: 'email_verify' | 'like' | 'system';
  createdAt: Date;
}

interface AppState {
  // Auth
  user: AppUser | null;
  isAuthenticated: boolean;

  // Onboarding
  onboardingStep: number;
  tempName: string;
  tempLane: Lane;
  tempPhotos: string[];
  skippedUpload: boolean;

  // Spotify
  isSpotifyConnected: boolean;
  spotifyAccessToken: string | null;

  // Feed
  feedVehicles: Vehicle[];
  currentIndex: number;
  swipeCount: number;
  showAd: boolean;
  feedEnded: boolean;

  // Profile
  profileEditMode: boolean;

  // Notifications
  notifications: Notification[];

  // Navigation
  currentTab: string;

  // Actions
  setUser: (user: AppUser | null) => void;
  setAuthenticated: (val: boolean) => void;
  setOnboardingStep: (step: number) => void;
  setTempName: (name: string) => void;
  setTempLane: (lane: Lane) => void;
  setTempPhotos: (photos: string[]) => void;
  setSkippedUpload: (skipped: boolean) => void;
  setIsSpotifyConnected: (connected: boolean) => void;
  setSpotifyAccessToken: (token: string | null) => void;
  setFeedVehicles: (vehicles: Vehicle[]) => void;
  nextVehicle: () => void;
  resetFeed: () => void;
  incrementSwipeCount: () => void;
  setShowAd: (show: boolean) => void;
  setFeedEnded: (ended: boolean) => void;
  setProfileEditMode: (mode: boolean) => void;
  setNotifications: (notifs: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  setCurrentTab: (tab: string) => void;
  updateUserBio: (bio: string) => void;
  updateUserPhoto: (url: string) => void;
  addVehiclePhotos: (photos: string[]) => void;
  logout: () => void;

  // Feed interactions
  interactions: { vehicleId: string; type: 'like' | 'pass' }[];
  addInteraction: (vehicleId: string, type: 'like' | 'pass') => void;
}

const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    userId: 'u2',
    userName: 'Kullanıcı Adı',
    userHandle: '@user',
    userAvatar: '',
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=800&fit=crop',
    category: 'Otomobil',
    brand: 'BMW M4',
    year: '2023',
    story: 'Yeni aracımla ilk gezim!',
    likes: 24,
  },
  {
    id: 'v2',
    userId: 'u3',
    userName: 'Ahmet Yılmaz',
    userHandle: '@ahmety',
    userAvatar: '',
    imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&h=800&fit=crop',
    category: 'Otomobil',
    brand: 'Mercedes AMG GT',
    year: '2022',
    story: 'Modifiye tutkusu',
    likes: 56,
  },
  {
    id: 'v3',
    userId: 'u4',
    userName: 'Zeynep Kaya',
    userHandle: '@zeynepk',
    userAvatar: '',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=800&fit=crop',
    category: 'Otomobil',
    brand: 'Porsche 911',
    year: '2021',
    story: 'Garajımdaki en sevdiğim',
    likes: 89,
  },
  {
    id: 'v4',
    userId: 'u5',
    userName: 'Mehmet Demir',
    userHandle: '@mehmetd',
    userAvatar: '',
    imageUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=800&fit=crop',
    category: 'Otomobil',
    brand: 'Lamborghini Huracan',
    year: '2023',
    story: 'Hayalimdi, gerçek oldu',
    likes: 134,
  },
  {
    id: 'v5',
    userId: 'u6',
    userName: 'Elif Şahin',
    userHandle: '@elifs',
    userAvatar: '',
    imageUrl: 'https://images.unsplash.com/photo-1580274455191-1c62238d788f?w=600&h=800&fit=crop',
    category: 'Otomobil',
    brand: 'Audi R8',
    year: '2022',
    story: 'V10 sesi paha biçilemez',
    likes: 67,
  },
];

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'E-Posta Adresinizi Doğrulayın!',
    body: 'Daha fazlası için Doğrula',
    read: false,
    type: 'email_verify',
    createdAt: new Date(),
  },
];

export const useStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  isAuthenticated: false,

  // Onboarding
  onboardingStep: 0,
  tempName: '',
  tempLane: null,
  tempPhotos: [],
  skippedUpload: false,

  // Spotify
  isSpotifyConnected: false,
  spotifyAccessToken: null,

  // Feed
  feedVehicles: mockVehicles,
  currentIndex: 0,
  swipeCount: 0,
  showAd: false,
  feedEnded: false,

  // Profile
  profileEditMode: false,

  // Notifications
  notifications: mockNotifications,

  // Navigation
  currentTab: 'home',

  // Interactions
  interactions: [],

  setUser: (user) => set({ user }),
  setAuthenticated: (val) => set({ isAuthenticated: val }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  setTempName: (name) => set({ tempName: name }),
  setTempLane: (lane) => set({ tempLane: lane }),
  setTempPhotos: (photos) => set({ tempPhotos: photos }),
  setSkippedUpload: (skipped) => set({ skippedUpload: skipped }),
  setIsSpotifyConnected: (connected) => set({ isSpotifyConnected: connected }),
  setSpotifyAccessToken: (token) => set({ spotifyAccessToken: token }),
  setFeedVehicles: (vehicles) => set({ feedVehicles: vehicles }),

  nextVehicle: () => {
    const state = get();
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.feedVehicles.length) {
      set({ feedEnded: true, currentIndex: nextIndex });
    } else {
      set({ currentIndex: nextIndex });
    }
  },

  resetFeed: () => set({ currentIndex: 0, swipeCount: 0, showAd: false, feedEnded: false }),

  incrementSwipeCount: () => {
    const state = get();
    const newCount = state.swipeCount + 1;
    set({ swipeCount: newCount });
    if (newCount > 0 && newCount % 15 === 0) {
      set({ showAd: true });
    }
  },

  setShowAd: (show) => set({ showAd: show }),
  setFeedEnded: (ended) => set({ feedEnded: ended }),
  setProfileEditMode: (mode) => set({ profileEditMode: mode }),
  setNotifications: (notifs) => set({ notifications: notifs }),

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  setCurrentTab: (tab) => set({ currentTab: tab }),

  updateUserBio: (bio) =>
    set((state) => ({
      user: state.user ? { ...state.user, bio } : null,
    })),

  updateUserPhoto: (url) =>
    set((state) => ({
      user: state.user ? { ...state.user, photoURL: url } : null,
    })),

  addVehiclePhotos: (photos) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, vehiclePhotos: [...state.user.vehiclePhotos, ...photos], hasVehicle: true }
        : null,
    })),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      onboardingStep: 0,
      tempName: '',
      tempLane: null,
      tempPhotos: [],
      skippedUpload: false,
      isSpotifyConnected: false,
      spotifyAccessToken: null,
      currentIndex: 0,
      swipeCount: 0,
      showAd: false,
      feedEnded: false,
      interactions: [],
    }),

  addInteraction: (vehicleId, type) =>
    set((state) => ({
      interactions: [...state.interactions, { vehicleId, type }],
    })),
}));
