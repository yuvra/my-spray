import type { CropType, Farm, FertilizerLog, SprayLog } from '@/types';

export function logMatchesFarm(
  log: SprayLog | FertilizerLog,
  farm: Farm,
): boolean {
  if (log.farmId) return log.farmId === farm.id;
  return log.crop === farm.crop;
}

export function getActivityDates(
  farm: Farm,
  sprayLogs: SprayLog[],
  fertilizerLogs: FertilizerLog[],
): Set<string> {
  const dates = new Set<string>();
  for (const log of sprayLogs) {
    if (logMatchesFarm(log, farm)) dates.add(log.date);
  }
  for (const log of fertilizerLogs) {
    if (logMatchesFarm(log, farm)) dates.add(log.date);
  }
  return dates;
}

export function getLogsForFarmDate(
  farm: Farm,
  date: string,
  sprayLogs: SprayLog[],
  fertilizerLogs: FertilizerLog[],
): { spray: SprayLog[]; fertilizer: FertilizerLog[] } {
  return {
    spray: sprayLogs.filter((log) => logMatchesFarm(log, farm) && log.date === date),
    fertilizer: fertilizerLogs.filter((log) => logMatchesFarm(log, farm) && log.date === date),
  };
}

export function cropLabelKey(crop: CropType): `crops.${CropType}` {
  return `crops.${crop}`;
}
