import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import type { FarmActivityLog, FertilizerLog, IrrigationLog, SprayLog, UserProfile } from '@/types';

function stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

let firestoreReady: boolean | null = null;
let firestoreCheckPromise: Promise<boolean> | null = null;

/** Returns false when Cloud Firestore database was never created in the Firebase project. */
export async function isFirestoreDatabaseReady(): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  if (firestoreReady === true) return true;
  if (firestoreReady === false) return false;

  if (!firestoreCheckPromise) {
    firestoreCheckPromise = (async () => {
      try {
        await getDoc(doc(getFirebaseDb(), '_health', 'check'));
        firestoreReady = true;
        return true;
      } catch (error) {
        const message = String((error as { message?: string })?.message ?? error);
        if (message.includes('not found') || message.includes('NOT_FOUND')) {
          firestoreReady = false;
          console.warn(
            `[Firestore] Database "(default)" does not exist for project "${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}". ` +
              'Open Firebase Console → Build → Firestore Database → Create database (region: asia-south1), then run: firebase deploy --only firestore:rules',
          );
          return false;
        }
        firestoreReady = true;
        return true;
      }
    })();
  }

  return firestoreCheckPromise;
}

export function subscribeSprayLogs(userId: string, callback: (logs: SprayLog[]) => void) {
  if (!isFirebaseConfigured) return () => {};
  const q = query(collection(getFirebaseDb(), 'sprayLogs'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SprayLog);
      callback(logs.sort((a, b) => b.date.localeCompare(a.date)));
    },
    () => callback([]),
  );
}

export function subscribeFertilizerLogs(
  userId: string,
  callback: (logs: FertilizerLog[]) => void,
) {
  if (!isFirebaseConfigured) return () => {};
  const q = query(collection(getFirebaseDb(), 'fertilizerLogs'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FertilizerLog);
      callback(logs.sort((a, b) => b.date.localeCompare(a.date)));
    },
    () => callback([]),
  );
}

export function subscribeFarmActivityLogs(
  userId: string,
  callback: (logs: FarmActivityLog[]) => void,
) {
  if (!isFirebaseConfigured) return () => {};
  const q = query(collection(getFirebaseDb(), 'farmActivityLogs'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FarmActivityLog);
      callback(logs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)));
    },
    () => callback([]),
  );
}

export async function saveSprayLog(log: Omit<SprayLog, 'id'>, id?: string) {
  if (!isFirebaseConfigured) return id ?? `local-${Date.now()}`;
  const data = stripUndefined(log);
  if (id) {
    await updateDoc(doc(getFirebaseDb(), 'sprayLogs', id), data);
    return id;
  }
  const ref = await addDoc(collection(getFirebaseDb(), 'sprayLogs'), data);
  return ref.id;
}

export async function saveFertilizerLog(log: Omit<FertilizerLog, 'id'>, id?: string) {
  if (!isFirebaseConfigured) return id ?? `local-${Date.now()}`;
  const data = stripUndefined(log);
  if (id) {
    await updateDoc(doc(getFirebaseDb(), 'fertilizerLogs', id), data);
    return id;
  }
  const ref = await addDoc(collection(getFirebaseDb(), 'fertilizerLogs'), data);
  return ref.id;
}

export async function deleteSprayLog(id: string) {
  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(getFirebaseDb(), 'sprayLogs', id));
}

export async function deleteFertilizerLog(id: string) {
  if (!isFirebaseConfigured) return;
  await deleteDoc(doc(getFirebaseDb(), 'fertilizerLogs', id));
}

export async function saveIrrigationLog(log: Omit<IrrigationLog, 'id'>, id?: string) {
  if (!isFirebaseConfigured) return id ?? `local-${Date.now()}`;
  const data = stripUndefined(log);
  if (id) {
    await updateDoc(doc(getFirebaseDb(), 'irrigationLogs', id), data);
    return id;
  }
  const ref = await addDoc(collection(getFirebaseDb(), 'irrigationLogs'), data);
  return ref.id;
}

export async function saveFarmActivityLog(log: Omit<FarmActivityLog, 'id'>, id?: string) {
  const localId = id ?? `local-${Date.now()}`;
  if (!isFirebaseConfigured) return localId;
  const data = stripUndefined(log);
  try {
    if (id) {
      await updateDoc(doc(getFirebaseDb(), 'farmActivityLogs', id), data);
      return id;
    }
    const ref = await addDoc(collection(getFirebaseDb(), 'farmActivityLogs'), data);
    return ref.id;
  } catch (error) {
    console.warn('[saveFarmActivityLog] Firestore write failed, using local id', error);
    return localId;
  }
}

export async function deleteFarmActivityLog(id: string) {
  if (!isFirebaseConfigured) return;
  try {
    await deleteDoc(doc(getFirebaseDb(), 'farmActivityLogs', id));
  } catch (error) {
    console.warn('[deleteFarmActivityLog] Firestore delete failed', error);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export async function saveUserProfile(profile: UserProfile) {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(getFirebaseDb(), 'users', profile.uid), profile, { merge: true });
}
