import type { DoseUnit, ProductLineItem } from '@/types';
import { lookupProductChemical } from '@/data/krushi-sarthi-seed';

export type ProductUsageDraft = {
  dosePerLiter: string;
  doseUnit: DoseUnit;
  unitPrice: string;
  priceUnit: string;
};

export function usageKey(group: string, product: string): string {
  return `${group}::${product}`;
}

export function defaultUsageDraft(unitPrice?: number, priceUnit = 'kg'): ProductUsageDraft {
  return {
    dosePerLiter: '',
    doseUnit: 'g',
    unitPrice: unitPrice != null && unitPrice > 0 ? String(unitPrice) : '',
    priceUnit,
  };
}

/** Total product used = dosePerLiter × waterLiters (same dose unit). */
export function computeTotalProductUsed(
  dosePerLiter: number,
  waterLiters: number,
): number {
  if (!dosePerLiter || !waterLiters) return dosePerLiter || 0;
  return dosePerLiter * waterLiters;
}

export function computeLineCost(
  dosePerLiter: number,
  doseUnit: DoseUnit,
  waterLiters: number,
  unitPrice: number,
  priceUnit: string,
): number {
  if (!unitPrice) return 0;
  const totalUsed = computeTotalProductUsed(dosePerLiter, waterLiters || 1);

  if (priceUnit === 'kg') {
    if (doseUnit === 'g') return (totalUsed / 1000) * unitPrice;
    if (doseUnit === 'kg') return totalUsed * unitPrice;
    if (doseUnit === 'ml') return (totalUsed / 1000) * unitPrice;
  }
  if (priceUnit === 'g') {
    if (doseUnit === 'g') return totalUsed * unitPrice;
  }
  if (priceUnit === 'L' || priceUnit === 'l') {
    if (doseUnit === 'ml') return (totalUsed / 1000) * unitPrice;
  }
  return totalUsed * unitPrice;
}

export function draftToLineItem(
  group: string,
  name: string,
  draft: ProductUsageDraft,
  waterLiters: number,
): ProductLineItem | null {
  const dosePerLiter = Number(draft.dosePerLiter);
  const unitPrice = Number(draft.unitPrice);
  if (!name.trim()) return null;

  const line: ProductLineItem = {
    name: name.trim(),
    group,
    chemical: lookupProductChemical(name.trim(), group),
    doseUnit: draft.doseUnit,
    priceUnit: draft.priceUnit || 'kg',
  };

  if (!Number.isNaN(dosePerLiter) && dosePerLiter > 0) {
    line.dosePerLiter = dosePerLiter;
  }
  if (waterLiters > 0) line.waterLiters = waterLiters;
  if (!Number.isNaN(unitPrice) && unitPrice > 0) line.unitPrice = unitPrice;

  if (line.dosePerLiter != null) {
    line.totalCost = computeLineCost(
      line.dosePerLiter,
      line.doseUnit ?? 'g',
      line.waterLiters ?? 0,
      line.unitPrice ?? 0,
      line.priceUnit ?? 'kg',
    );
    if (line.totalCost <= 0 && line.unitPrice && line.dosePerLiter) {
      line.totalCost = line.dosePerLiter * line.unitPrice;
    }
  }

  return line;
}

export function formatProductLineFullSummary(line: ProductLineItem): string {
  const lines: string[] = [line.name];
  const chemical = line.chemical ?? lookupProductChemical(line.name, line.group);
  if (chemical) lines.push(`Technical: ${chemical}`);
  if (line.dosePerLiter != null) {
    lines.push(`Dose: ${line.dosePerLiter}${line.doseUnit ?? 'g'}/L`);
  }
  if (line.unitPrice != null && line.unitPrice > 0) {
    lines.push(`Price: ₹${line.unitPrice}/${line.priceUnit ?? 'kg'}`);
  }
  if (line.waterLiters) lines.push(`Water: ${line.waterLiters}L`);
  if (line.totalCost && line.totalCost > 0) lines.push(`Cost: ₹${Math.round(line.totalCost)}`);
  return lines.join('\n');
}

/** Brief card label — brand name only. */
export function formatProductLineCardSummary(line: ProductLineItem): string {
  return line.name;
}

/** @deprecated use formatProductLineFullSummary for modal, formatProductLineCardSummary for cards */
export function formatProductLineSummary(line: ProductLineItem): string {
  return formatProductLineFullSummary(line).replace(/\n/g, ' · ');
}

export function sumProductLineCosts(lines?: ProductLineItem[]): number {
  if (!lines?.length) return 0;
  return lines.reduce((sum, line) => sum + (line.totalCost ?? 0), 0);
}
