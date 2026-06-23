import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';

import type { Farm, FarmActivityLog, FertilizerLog, IrrigationLog, SprayLog } from '@/types';

export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

export function logMatchesFarm(
  log: { farmId?: string; crop: string },
  farm: Farm,
): boolean {
  if (log.farmId) return log.farmId === farm.id;
  return log.crop === farm.crop;
}

export function getLogsForFarmAndDate(
  farm: Farm,
  dateKey: string,
  sprayLogs: SprayLog[],
  fertilizerLogs: FertilizerLog[],
  irrigationLogs: IrrigationLog[] = [],
  farmActivityLogs: FarmActivityLog[] = [],
) {
  const sprays = sprayLogs.filter((log) => logMatchesFarm(log, farm) && log.date === dateKey);
  const fertilizers = fertilizerLogs.filter(
    (log) => logMatchesFarm(log, farm) && log.date === dateKey,
  );
  const irrigations = irrigationLogs.filter(
    (log) => logMatchesFarm(log, farm) && log.date === dateKey,
  );
  const activities = farmActivityLogs.filter(
    (log) => logMatchesFarm(log, farm) && log.date === dateKey,
  );
  return { sprays, fertilizers, irrigations, activities };
}

export function getActiveDatesForFarm(
  farm: Farm,
  sprayLogs: SprayLog[],
  fertilizerLogs: FertilizerLog[],
  irrigationLogs: IrrigationLog[] = [],
  farmActivityLogs: FarmActivityLog[] = [],
): Set<string> {
  const dates = new Set<string>();
  for (const log of sprayLogs) {
    if (logMatchesFarm(log, farm)) dates.add(log.date);
  }
  for (const log of fertilizerLogs) {
    if (logMatchesFarm(log, farm)) dates.add(log.date);
  }
  for (const log of irrigationLogs) {
    if (logMatchesFarm(log, farm)) dates.add(log.date);
  }
  for (const log of farmActivityLogs) {
    if (logMatchesFarm(log, farm)) dates.add(log.date);
  }
  return dates;
}

export function getMonthDays(month: Date): Date[] {
  return eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
}

export function shiftMonth(month: Date, delta: number): Date {
  return delta < 0 ? subMonths(month, Math.abs(delta)) : addMonths(month, delta);
}

export { isSameDay, isSameMonth, format, startOfMonth };
