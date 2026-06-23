import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { isOnboardingComplete } from '@/app/onboarding';
import {
  getUserProfile,
  isFirestoreDatabaseReady,
  subscribeFarmActivityLogs,
  subscribeFertilizerLogs,
  subscribeSprayLogs,
} from '@/services/firestoreService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { useProductCatalogStore } from '@/stores/useProductCatalogStore';
import { isFirebaseConfigured } from '@/lib/firebase';
import type { FarmActivityLog } from '@/types';

function mergeActivityLogs(local: FarmActivityLog[], remote: FarmActivityLog[]): FarmActivityLog[] {
  const byId = new Map<string, FarmActivityLog>();
  for (const log of local) byId.set(log.id, log);
  for (const log of remote) byId.set(log.id, log);
  return [...byId.values()].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export function useFirestoreSync() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isDemo = useAuthStore((s) => s.isDemo);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setSprayLogs = useScheduleStore((s) => s.setSprayLogs);
  const setFertilizerLogs = useScheduleStore((s) => s.setFertilizerLogs);
  const setFarmActivityLogs = useScheduleStore((s) => s.setFarmActivityLogs);
  const hydrateProductCatalog = useProductCatalogStore((s) => s.hydrate);

  useEffect(() => {
    isOnboardingComplete().then((done) => {
      if (!done) router.push('/onboarding');
    });
  }, [router]);

  useEffect(() => {
    if (!user || isDemo || !isFirebaseConfigured) return;
    void hydrateProductCatalog();
  }, [user, isDemo, hydrateProductCatalog]);

  useEffect(() => {
    if (!user || isDemo || !isFirebaseConfigured) return;

    let cancelled = false;
    const unsubs: Array<() => void> = [];

    void isFirestoreDatabaseReady().then((ready) => {
      if (cancelled || !ready) return;

      getUserProfile(user.uid)
        .then((profile) => {
          if (cancelled) return;
          if (profile) {
            setProfile(profile);
            return;
          }
          const phone =
            user.phoneNumber?.replace(/\D/g, '').slice(-10) ??
            (user.uid.startsWith('phone_') ? user.uid.replace('phone_', '') : '');
          setProfile({
            uid: user.uid,
            phone,
            name: '',
            village: '',
            preferredCrops: ['pomegranate'],
            language: 'en',
            createdAt: new Date().toISOString(),
          });
        })
        .catch(() => {});

      unsubs.push(subscribeSprayLogs(user.uid, setSprayLogs));
      unsubs.push(subscribeFertilizerLogs(user.uid, setFertilizerLogs));
      unsubs.push(
        subscribeFarmActivityLogs(user.uid, (remote) => {
          const local = useScheduleStore.getState().farmActivityLogs;
          setFarmActivityLogs(mergeActivityLogs(local, remote));
        }),
      );
    });

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, [user, isDemo, setProfile, setSprayLogs, setFertilizerLogs, setFarmActivityLogs]);
}
