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

function logSpend(log: FarmActivityLog): number {
  const fromLines = sumProductLineCosts(log.productLines);
  const worker = log.workerSpend ?? 0;
  if (fromLines > 0) return fromLines + worker;
  return (log.cost ?? 0) + worker;
}

/** Daily totals from farm activity logs (for bar chart). */
export function getDailyActivityExpenses(logs: FarmActivityLog[]): DailyExpenseBar[] {
  const byDate = new Map<string, number>();
  for (const log of logs) {
    const spend = logSpend(log);
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
