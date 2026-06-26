import { db } from '../config/firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

const BATCH_LIMIT = 400;

async function deleteMatchingDocs(collectionName: string, field: string, uid: string) {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where(field, '==', uid))
  );

  if (snapshot.empty) return;

  let batch = writeBatch(db);
  let ops = 0;
  const commits: Promise<void>[] = [];

  for (const entry of snapshot.docs) {
    batch.delete(entry.ref);
    ops += 1;

    if (ops >= BATCH_LIMIT) {
      commits.push(batch.commit());
      batch = writeBatch(db);
      ops = 0;
    }
  }

  if (ops > 0) {
    commits.push(batch.commit());
  }

  await Promise.all(commits);
}

export async function deleteUserData(uid: string) {
  await deleteMatchingDocs('interactions', 'from', uid);
  await deleteMatchingDocs('interactions', 'to', uid);
  await deleteMatchingDocs('notifications', 'to', uid);
  await deleteMatchingDocs('plusOnePosts', 'userId', uid);
  await deleteDoc(doc(db, 'users', uid));
}
