import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { CropType, Farm } from '@/types';

const STORAGE_KEY = 'farms_v1';

interface FarmState {
  farms: Farm[];
  selectedFarmId: string | null;
  hydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  seedFarms: (userId: string, crops: CropType[]) => void;
  setSelectedFarmId: (id: string | null) => void;
  addFarm: (farm: Farm) => void;
  setFarms: (farms: Farm[]) => void;
}

async function loadFarms(userId: string): Promise<Farm[]> {
  const raw = await AsyncStorage.getItem(`${STORAGE_KEY}:${userId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Farm[];
  } catch {
    return [];
  }
}

async function persistFarms(userId: string, farms: Farm[]) {
  await AsyncStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(farms));
}

function buildDefaultFarms(userId: string, crops: CropType[]): Farm[] {
  const list = crops.length > 0 ? crops : (['pomegranate'] as CropType[]);
  return list.map((crop, index) => ({
    id: `farm-${crop}-${index}-${Date.now()}`,
    userId,
    name: `Farm ${index + 1}`,
    crop,
    createdAt: new Date().toISOString(),
  }));
}

export const useFarmStore = create<FarmState>((set, get) => ({
  farms: [],
  selectedFarmId: null,
  hydrated: false,

  hydrate: async (userId) => {
    const stored = await loadFarms(userId);
    set({
      farms: stored,
      selectedFarmId: stored[0]?.id ?? null,
      hydrated: true,
    });
  },

  seedFarms: (userId, crops) => {
    const { farms, hydrated } = get();
    if (!hydrated || farms.length > 0) return;
    const seeded = buildDefaultFarms(userId, crops);
    set({ farms: seeded, selectedFarmId: seeded[0]?.id ?? null });
    persistFarms(userId, seeded).catch(() => {});
  },

  setSelectedFarmId: (id) => set({ selectedFarmId: id }),

  addFarm: (farm) => {
    set((s) => {
      const farms = [...s.farms, farm];
      persistFarms(farm.userId, farms).catch(() => {});
      return { farms, selectedFarmId: s.selectedFarmId ?? farm.id };
    });
  },

  setFarms: (farms) => {
    set({ farms });
    const userId = farms[0]?.userId;
    if (userId) persistFarms(userId, farms).catch(() => {});
  },
}));
