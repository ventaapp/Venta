import { db } from '../config/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

export type BadgeId = 'yeni-uye' | 'modifiye-tutkunu' | 'topluluk-sesi';

export type BadgeDefinition = {
  id: BadgeId;
  image: string;
  name: string;
  subtitle: string;
};

export type BadgeStats = {
  hasVehicle: boolean;
  masallahReceived: number;
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'yeni-uye',
    image: '/badges/badge-yeni-uye.png',
    name: 'Yeni Üye',
    subtitle: 'HOŞGELDİN',
  },
  {
    id: 'modifiye-tutkunu',
    image: '/badges/badge-modifiye-tutkunu.png',
    name: 'Modifiye Tutkunu',
    subtitle: 'HARİKASIN',
  },
  {
    id: 'topluluk-sesi',
    image: '/badges/badge-topluluk-sesi.png',
    name: 'Topluluk Sesi',
    subtitle: '10 NUMARA',
  },
];

const BADGE_ORDER: BadgeId[] = ['yeni-uye', 'modifiye-tutkunu', 'topluluk-sesi'];

const MASALLAH_RECEIVED_GOAL = 10;

const MASALLAH_TYPES = new Set(['like', 'plus_one_like']);

export function computeEarnedBadges(stats: BadgeStats): BadgeId[] {
  const earned: BadgeId[] = ['yeni-uye'];
  if (stats.hasVehicle) earned.push('modifiye-tutkunu');
  if (stats.masallahReceived >= MASALLAH_RECEIVED_GOAL) earned.push('topluluk-sesi');
  return earned;
}

export function getCurrentBadge(earned: BadgeId[]): BadgeDefinition {
  const currentId = earned[earned.length - 1] ?? 'yeni-uye';
  return BADGE_DEFINITIONS.find((badge) => badge.id === currentId) ?? BADGE_DEFINITIONS[0];
}

export function getNextGoalLabel(stats: BadgeStats, earned: BadgeId[]): string {
  if (!earned.includes('modifiye-tutkunu')) {
    return stats.hasVehicle ? 'Kazanıldı!' : 'İlk aracını ekle';
  }

  if (!earned.includes('topluluk-sesi')) {
    if (stats.masallahReceived >= MASALLAH_RECEIVED_GOAL) return 'Kazanıldı!';
    return `${stats.masallahReceived}/${MASALLAH_RECEIVED_GOAL} Maşallah al`;
  }

  return 'Tüm rozetler tamamlandı';
}

export async function fetchBadgeStats(uid: string): Promise<BadgeStats> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  const userData = userSnap.data();
  const hasVehicle = !!userData?.hasVehicle;

  const receivedQuery = query(collection(db, 'interactions'), where('to', '==', uid));
  const receivedSnap = await getDocs(receivedQuery);

  const masallahReceived = receivedSnap.docs.filter((entry) =>
    MASALLAH_TYPES.has(entry.data().type as string)
  ).length;

  const earnedBadges = computeEarnedBadges({ hasVehicle, masallahReceived });

  try {
    await updateDoc(doc(db, 'users', uid), {
      earnedBadges,
      masallahReceivedCount: masallahReceived,
    });
  } catch (error) {
    console.error('Rozet durumu senkronize edilemedi:', error);
  }

  return { hasVehicle, masallahReceived };
}

export async function recordMasallah(
  fromUid: string,
  toUid: string,
  type: 'like' | 'plus_one_like' = 'like'
) {
  await addDoc(collection(db, 'interactions'), {
    from: fromUid,
    to: toUid,
    type,
    timestamp: serverTimestamp(),
  });

  try {
    await updateDoc(doc(db, 'users', fromUid), {
      masallahGivenCount: increment(1),
    });
    await updateDoc(doc(db, 'users', toUid), {
      masallahReceivedCount: increment(1),
    });
  } catch (error) {
    console.error('Maşallah sayacı güncellenemedi:', error);
  }
}

export { BADGE_ORDER, MASALLAH_RECEIVED_GOAL };
