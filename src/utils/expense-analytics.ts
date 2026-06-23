import type { FarmActivityLog } from '@/types';
import { sumProductLineCosts } from '@/utils/product-usage';

export type DailyExpenseBar = {
  date: string;
  label: string;
  value: number;
};

export type ProductExpenseBar = {
  name: string;
  label: string;
  value: number;
};

export type WorkerExpenseBar = ProductExpenseBar;

function logSpend(log: FarmActivityLog): number {
  const fromLines = sumProductLineCosts(log.productLines);
  const worker = log.workerSpend ?? 0;
  if (fromLines > 0) return fromLines + worker;
  return (log.cost ?? 0) + worker;
}

export function logWorkerSpend(log: FarmActivityLog): number {
  return log.workerSpend ?? 0;
}

/** Daily totals from farm activity logs (for bar chart). */
export function getDailyActivityExpenses(
  logs: FarmActivityLog[],
  mode: 'total' | 'worker' = 'total',
): DailyExpenseBar[] {
  const byDate = new Map<string, number>();
  for (const log of logs) {
    const spend = mode === 'worker' ? logWorkerSpend(log) : logSpend(log);
    if (spend <= 0) continue;
    byDate.set(log.date, (byDate.get(log.date) ?? 0) + spend);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, value]) => ({
      date,
      label: date.slice(5),
      value: Math.round(value),
    }));
}

/** Per-product spend across all activity logs. */
export function getProductExpenseBreakdown(logs: FarmActivityLog[]): ProductExpenseBar[] {
  const byProduct = new Map<string, number>();

  for (const log of logs) {
    if (log.productLines?.length) {
      for (const line of log.productLines) {
        if (!line.totalCost || line.totalCost <= 0) continue;
        byProduct.set(line.name, (byProduct.get(line.name) ?? 0) + line.totalCost);
      }
      continue;
    }
    if (log.cost && log.cost > 0 && log.productName) {
      byProduct.set(log.productName, (byProduct.get(log.productName) ?? 0) + log.cost);
    }
  }

  return [...byProduct.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([name, value]) => ({
      name,
      label: name.length > 10 ? `${name.slice(0, 9)}…` : name,
      value: Math.round(value),
    }));
}

export function getActivityExpenseTotal(logs: FarmActivityLog[]): number {
  return logs.reduce((sum, log) => sum + logSpend(log), 0);
}

export function getWorkerExpenseTotal(logs: FarmActivityLog[]): number {
  return logs.reduce((sum, log) => sum + logWorkerSpend(log), 0);
}

export function getWorkerExpenseTotalForWorker(logs: FarmActivityLog[], workerName: string): number {
  return logs.reduce((sum, log) => {
    const name = log.workerName?.trim() || 'Unknown';
    if (name !== workerName) return sum;
    return sum + logWorkerSpend(log);
  }, 0);
}

export function getWorkerNamesFromLogs(logs: FarmActivityLog[]): string[] {
  return getWorkerExpenseBreakdown(logs).map((w) => w.name);
}

/** Daily worker pay, optionally filtered to one worker. */
export function getDailyWorkerExpenses(
  logs: FarmActivityLog[],
  workerName: string | null = null,
): DailyExpenseBar[] {
  const filtered = workerName
    ? logs.filter((log) => {
        const name = log.workerName?.trim() || 'Unknown';
        return name === workerName;
      })
    : logs;
  return getDailyActivityExpenses(filtered, 'worker');
}

export type DailyWorkerStackBar = {
  date: string;
  label: string;
  total: number;
  stacks: { value: number; color: string; workerName: string }[];
};

/** Daily worker pay stacked by worker (for "All" filter). */
export function getDailyWorkerStackedExpenses(logs: FarmActivityLog[]): DailyWorkerStackBar[] {
  const workerRows = getWorkerExpenseBreakdown(logs);
  const colorByWorker = new Map(workerRows.map((w, i) => [w.name, workerBarColor(i)]));
  const workers = workerRows.map((w) => w.name);
  const byDate = new Map<string, Map<string, number>>();

  for (const log of logs) {
    const amount = logWorkerSpend(log);
    if (amount <= 0) continue;
    const name = log.workerName?.trim() || 'Unknown';
    if (!byDate.has(log.date)) byDate.set(log.date, new Map());
    const day = byDate.get(log.date)!;
    day.set(name, (day.get(name) ?? 0) + amount);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, dayMap]) => {
      const stacks = workers
        .map((name) => ({
          workerName: name,
          value: Math.round(dayMap.get(name) ?? 0),
          color: colorByWorker.get(name) ?? '#7C3AED',
        }))
        .filter((s) => s.value > 0);
      return {
        date,
        label: date.slice(5),
        stacks,
        total: stacks.reduce((sum, s) => sum + s.value, 0),
      };
    })
    .filter((d) => d.stacks.length > 0);
}

/** Per-worker spend from worker_spend activities. */
export function getWorkerExpenseBreakdown(
  logs: FarmActivityLog[],
  workerName: string | null = null,
): WorkerExpenseBar[] {
  const byWorker = new Map<string, number>();

  for (const log of logs) {
    const amount = logWorkerSpend(log);
    if (amount <= 0) continue;
    const name = log.workerName?.trim() || 'Unknown';
    if (workerName && name !== workerName) continue;
    byWorker.set(name, (byWorker.get(name) ?? 0) + amount);
  }

  return [...byWorker.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name,
      label: name.length > 8 ? `${name.slice(0, 7)}…` : name,
      value: Math.round(value),
    }));
}

export const WORKER_BAR_COLORS = [
  '#7C3AED',
  '#2563EB',
  '#059669',
  '#D97706',
  '#DC2626',
  '#DB2777',
  '#0891B2',
  '#4F46E5',
] as const;

export function workerBarColor(index: number): string {
  return WORKER_BAR_COLORS[index % WORKER_BAR_COLORS.length];
}
