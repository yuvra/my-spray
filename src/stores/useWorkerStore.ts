import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { WorkerRecord } from '@/types';

const DEFAULT_WORKER_NAMES = ['Govinda'];

function workerId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

type WorkerState = {
  workers: WorkerRecord[];
  seeded: boolean;
  addWorker: (name: string) => WorkerRecord | undefined;
  removeWorker: (id: string) => void;
  ensureWorker: (name: string) => void;
  seedDefaultWorkers: () => void;
};

export const useWorkerStore = create<WorkerState>()(
  persist(
    (set, get) => ({
      workers: [],
      seeded: false,

      addWorker: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return undefined;
        const id = workerId(trimmed);
        const existing = get().workers.find((w) => w.id === id);
        if (existing) return existing;
        const record: WorkerRecord = { id, name: trimmed };
        set((s) => ({ workers: [...s.workers, record].sort((a, b) => a.name.localeCompare(b.name)) }));
        return record;
      },

      removeWorker: (id) => {
        set((s) => ({ workers: s.workers.filter((w) => w.id !== id) }));
      },

      ensureWorker: (name) => {
        get().addWorker(name);
      },

      seedDefaultWorkers: () => {
        for (const name of DEFAULT_WORKER_NAMES) {
          get().addWorker(name);
        }
        if (!get().seeded) set({ seeded: true });
      },
    }),
    {
      name: 'farm-spray-workers',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function getWorkerNames(workers: WorkerRecord[]): string[] {
  return workers.map((w) => w.name);
}
