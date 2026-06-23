import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { FarmActivityLog, FertilizerLog, IrrigationLog, SprayLog } from '@/types';

const ACTIVITY_LOGS_KEY = 'farm_activity_logs_v1';

async function loadActivityLogs(userId: string): Promise<FarmActivityLog[]> {
  const raw = await AsyncStorage.getItem(`${ACTIVITY_LOGS_KEY}:${userId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FarmActivityLog[];
  } catch {
    return [];
  }
}

async function persistActivityLogs(userId: string, logs: FarmActivityLog[]) {
  await AsyncStorage.setItem(`${ACTIVITY_LOGS_KEY}:${userId}`, JSON.stringify(logs));
}

interface ScheduleState {
  sprayLogs: SprayLog[];
  fertilizerLogs: FertilizerLog[];
  irrigationLogs: IrrigationLog[];
  farmActivityLogs: FarmActivityLog[];
  activityLogsHydrated: boolean;
  setSprayLogs: (logs: SprayLog[]) => void;
  setFertilizerLogs: (logs: FertilizerLog[]) => void;
  setIrrigationLogs: (logs: IrrigationLog[]) => void;
  setFarmActivityLogs: (logs: FarmActivityLog[]) => void;
  hydrateFarmActivityLogs: (userId: string) => Promise<void>;
  addSprayLog: (log: SprayLog) => void;
  updateSprayLog: (log: SprayLog) => void;
  removeSprayLog: (id: string) => void;
  addFertilizerLog: (log: FertilizerLog) => void;
  updateFertilizerLog: (log: FertilizerLog) => void;
  removeFertilizerLog: (id: string) => void;
  addIrrigationLog: (log: IrrigationLog) => void;
  removeIrrigationLog: (id: string) => void;
  addFarmActivityLog: (log: FarmActivityLog) => void;
  removeFarmActivityLog: (id: string) => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  sprayLogs: [],
  fertilizerLogs: [],
  irrigationLogs: [],
  farmActivityLogs: [],
  activityLogsHydrated: false,

  setSprayLogs: (sprayLogs) => set({ sprayLogs }),
  setFertilizerLogs: (fertilizerLogs) => set({ fertilizerLogs }),
  setIrrigationLogs: (irrigationLogs) => set({ irrigationLogs }),
  setFarmActivityLogs: (farmActivityLogs) => {
    set({ farmActivityLogs });
    const userId = farmActivityLogs[0]?.userId;
    if (userId) persistActivityLogs(userId, farmActivityLogs).catch(() => {});
  },

  hydrateFarmActivityLogs: async (userId) => {
    const logs = await loadActivityLogs(userId);
    set({ farmActivityLogs: logs, activityLogsHydrated: true });
  },

  addSprayLog: (log) => set((s) => ({ sprayLogs: [log, ...s.sprayLogs] })),
  updateSprayLog: (log) =>
    set((s) => ({
      sprayLogs: s.sprayLogs.map((l) => (l.id === log.id ? log : l)),
    })),
  removeSprayLog: (id) =>
    set((s) => ({ sprayLogs: s.sprayLogs.filter((l) => l.id !== id) })),

  addFertilizerLog: (log) => set((s) => ({ fertilizerLogs: [log, ...s.fertilizerLogs] })),
  updateFertilizerLog: (log) =>
    set((s) => ({
      fertilizerLogs: s.fertilizerLogs.map((l) => (l.id === log.id ? log : l)),
    })),
  removeFertilizerLog: (id) =>
    set((s) => ({ fertilizerLogs: s.fertilizerLogs.filter((l) => l.id !== id) })),

  addIrrigationLog: (log) => set((s) => ({ irrigationLogs: [log, ...s.irrigationLogs] })),
  removeIrrigationLog: (id) =>
    set((s) => ({ irrigationLogs: s.irrigationLogs.filter((l) => l.id !== id) })),

  addFarmActivityLog: (log) => {
    set((s) => {
      const farmActivityLogs = [log, ...s.farmActivityLogs];
      persistActivityLogs(log.userId, farmActivityLogs).catch(() => {});
      return { farmActivityLogs };
    });
  },
  removeFarmActivityLog: (id) => {
    const log = get().farmActivityLogs.find((l) => l.id === id);
    set((s) => {
      const farmActivityLogs = s.farmActivityLogs.filter((l) => l.id !== id);
      if (log) persistActivityLogs(log.userId, farmActivityLogs).catch(() => {});
      return { farmActivityLogs };
    });
  },
}));
