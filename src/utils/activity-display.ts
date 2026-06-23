import type { TFunction } from 'i18next';

import {
  formatProductList,
  getActivityLabelKey,
  hasIrrigationDetails,
  hasSprayDetails,
  isCulturalActivity,
  isFertilizerActivity,
  isIrrigationActivity,
  isWorkerSpendActivity,
} from '@/constants/farm-activities';
import type { FarmActivityLog, IrrigationSubType, ProductLineItem, SpraySubType } from '@/types';
import { formatProductLineFullSummary, sumProductLineCosts } from '@/utils/product-usage';

export type ActivityVariant = 'spray' | 'irrigation' | 'fertilizer' | 'cultural' | 'labour';

export type ActivityDetailKey =
  | SpraySubType
  | IrrigationSubType
  | 'duration'
  | 'product'
  | 'notes'
  | 'other'
  | 'moon_phase';

export type ActivityDetail = {
  key: ActivityDetailKey;
  label: string;
  /** Full text for info (ⓘ) modal — dose, technical name, price, cost. */
  value: string;
  /** Brief text on the activity card (e.g. brand names only). */
  cardValue?: string;
};

function resolveIrrigationSubTypes(log: FarmActivityLog): IrrigationSubType[] {
  if (log.irrigationSubTypes?.length) return log.irrigationSubTypes;
  if (log.activityType === 'irrigation_plain') return ['plain'];
  if (log.activityType === 'irrigation_nutrient') return ['nutrient'];
  if (log.activityType === 'irrigation_nematicide_drench') return ['nematicide_drench'];
  if (log.activityType === 'irrigation_biological') return ['biological'];
  return [];
}

function linesForGroup(lines: ProductLineItem[] | undefined, group: string): ProductLineItem[] {
  return lines?.filter((l) => l.group === group) ?? [];
}

function formatLinesCardValue(lines: ProductLineItem[]): string {
  return lines.map((line) => line.name).join(', ');
}

function formatLinesFullValue(lines: ProductLineItem[]): string {
  return lines.map((line) => formatProductLineFullSummary(line)).join('\n\n');
}

function productDetailFromLines(
  log: FarmActivityLog,
  group: string,
  labelKey: string,
  t: TFunction,
): ActivityDetail | null {
  const lines = linesForGroup(log.productLines, group);
  if (lines.length) {
    return {
      key: group as ActivityDetailKey,
      label: t(labelKey),
      value: formatLinesFullValue(lines),
      cardValue: formatLinesCardValue(lines),
    };
  }
  return null;
}

export function getActivityTitle(log: FarmActivityLog, t: TFunction): string {
  if (isWorkerSpendActivity(log.activityType)) {
    if (log.workName?.trim()) return log.workName.trim();
    if (log.workerName?.trim()) return log.workerName.trim();
    return t('home.activityTypes.worker_spend');
  }
  if (isCulturalActivity(log.activityType) && log.workName?.trim()) {
    return log.workName.trim();
  }
  if (log.activityType === 'spray' && log.spraySubTypes?.length) {
    return log.spraySubTypes.map((st) => t(`home.spraySubTypes.${st}`)).join(' + ');
  }
  const irrigationSubs = resolveIrrigationSubTypes(log);
  if (isIrrigationActivity(log.activityType) && irrigationSubs.length) {
    return irrigationSubs.map((st) => t(`home.irrigationSubTypes.${st}`)).join(' + ');
  }
  return t(`home.activityTypes.${log.activityType}`);
}

/** One-line summary on worker pay cards — worker + amount only. */
export function getActivityCardSubtitle(log: FarmActivityLog, _t: TFunction): string | undefined {
  if (!isWorkerSpendActivity(log.activityType)) return undefined;

  const pay =
    log.workerSpend != null && log.workerSpend > 0
      ? `₹${Math.round(log.workerSpend).toLocaleString('en-IN')}`
      : undefined;
  const work = log.workName?.trim();
  const worker = log.workerName?.trim();

  if (work) {
    const parts = [worker, pay].filter(Boolean);
    return parts.length ? parts.join(' · ') : undefined;
  }
  return pay;
}

/** Details shown on the card. Worker pay keeps the card minimal — full text is in the ⓘ modal. */
export function getActivityCardDetails(log: FarmActivityLog, t: TFunction): ActivityDetail[] {
  if (isWorkerSpendActivity(log.activityType)) return [];
  return getActivityDetails(log, t);
}

export function getActivityDetails(log: FarmActivityLog, t: TFunction): ActivityDetail[] {
  const details: ActivityDetail[] = [];

  if (log.sprayWaterLiters && log.sprayWaterLiters > 0) {
    details.push({
      key: 'other',
      label: t('home.waterUsedLiters'),
      value: t('home.waterUsedValue', { liters: log.sprayWaterLiters }),
    });
  }

  if (isIrrigationActivity(log.activityType)) {
    const irrigationSubs = resolveIrrigationSubTypes(log);

    if (log.durationHours != null || log.durationMinutes != null) {
      details.push({
        key: 'duration',
        label: t('home.waterDuration'),
        value: t('home.waterDurationValue', {
          hours: log.durationHours ?? 0,
          minutes: log.durationMinutes ?? 0,
        }),
      });
    }

    const nutrients = formatProductList(log.nutrientProducts, log.productName);
    const nutrientDetail =
      productDetailFromLines(log, 'nutrient', 'home.irrigationSubTypes.nutrient', t) ??
      (nutrients && (irrigationSubs.includes('nutrient') || log.activityType === 'irrigation_nutrient')
        ? { key: 'nutrient' as const, label: t('home.irrigationSubTypes.nutrient'), value: nutrients }
        : null);
    if (nutrientDetail) details.push(nutrientDetail);

    const nematicides = formatProductList(log.nematicideProducts);
    const nematicideDetail =
      productDetailFromLines(log, 'nematicide_drench', 'home.irrigationSubTypes.nematicide_drench', t) ??
      (nematicides && irrigationSubs.includes('nematicide_drench')
        ? {
            key: 'nematicide_drench' as const,
            label: t('home.irrigationSubTypes.nematicide_drench'),
            value: nematicides,
          }
        : null);
    if (nematicideDetail) details.push(nematicideDetail);

    const biologicals = formatProductList(log.biologicalProducts);
    const biologicalDetail =
      productDetailFromLines(log, 'biological', 'home.irrigationSubTypes.biological', t) ??
      (biologicals && irrigationSubs.includes('biological')
        ? {
            key: 'biological' as const,
            label: t('home.irrigationSubTypes.biological'),
            value: biologicals,
          }
        : null);
    if (biologicalDetail) details.push(biologicalDetail);

    if (log.moonPhase && irrigationSubs.includes('biological')) {
      details.push({
        key: 'moon_phase',
        label: t('home.moonPhase'),
        value: t(`home.moonPhases.${log.moonPhase}`),
      });
    }
  }

  if (hasSprayDetails(log.spraySubTypes ?? [])) {
    const sprayGroups: { group: string; labelKey: string; fallback: string | undefined }[] = [
      { group: 'fungicide', labelKey: 'home.spraySubTypes.fungicide', fallback: formatProductList(log.fungicideProducts, log.fungicideProduct) },
      { group: 'insecticide', labelKey: 'home.spraySubTypes.insecticide', fallback: formatProductList(log.insecticideProducts, log.insecticideProduct) },
      { group: 'bactericide', labelKey: 'home.spraySubTypes.bactericide', fallback: formatProductList(log.bactericideProducts) },
      { group: 'pgr', labelKey: 'home.spraySubTypes.pgr', fallback: formatProductList(log.pgrProducts) },
      { group: 'fertilizer_spray', labelKey: 'home.spraySubTypes.fertilizer_spray', fallback: formatProductList(log.fertilizerSprayProducts) },
      { group: 'micronutrient_spray', labelKey: 'home.spraySubTypes.micronutrient_spray', fallback: formatProductList(log.micronutrientProducts, log.micronutrientProduct) },
      { group: 'water_ph_balancer', labelKey: 'home.spraySubTypes.water_ph_balancer', fallback: formatProductList(log.waterPhBalancerProducts) },
      { group: 'spreader_sticker', labelKey: 'home.spraySubTypes.spreader_sticker', fallback: formatProductList(log.spreaderStickerProducts) },
    ];

    for (const { group, labelKey, fallback } of sprayGroups) {
      const fromLines = productDetailFromLines(log, group, labelKey, t);
      if (fromLines) {
        details.push(fromLines);
      } else if (fallback) {
        details.push({
          key: group as ActivityDetailKey,
          label: t(labelKey),
          value: fallback,
        });
      }
    }
  }

  if (isFertilizerActivity(log.activityType)) {
    if (log.productName) {
      details.push({ key: 'product', label: t('schedule.product'), value: log.productName });
    }
    if (log.quantity != null && log.quantity > 0) {
      details.push({
        key: 'other',
        label: t('schedule.quantity'),
        value: `${log.quantity}${log.unit ?? ''}`,
      });
    }
  }

  if (isCulturalActivity(log.activityType)) {
    details.push({
      key: 'other',
      label: t('home.activityDetails'),
      value: t(getActivityLabelKey(log.activityType)),
    });
  }

  if (isWorkerSpendActivity(log.activityType)) {
    if (log.workName?.trim()) {
      details.push({ key: 'other', label: t('home.workName'), value: log.workName.trim() });
    }
    if (log.workerName) {
      details.push({ key: 'other', label: t('home.workerName'), value: log.workerName });
    }
    if (log.workerSpend != null && log.workerSpend > 0) {
      details.push({
        key: 'other',
        label: t('home.workerSpend'),
        value: `₹${Math.round(log.workerSpend).toLocaleString('en-IN')}`,
      });
    }
  }

  if (log.notes) {
    details.push({ key: 'notes', label: t('schedule.notes'), value: log.notes });
  }

  return details;
}

export function getActivityDisplayCost(log: FarmActivityLog): number | undefined {
  const fromLines = sumProductLineCosts(log.productLines);
  const worker = log.workerSpend ?? 0;
  const manual = log.cost ?? 0;
  const total = fromLines > 0 ? fromLines + worker : manual + worker;
  if (total > 0) return Math.round(total);
  return undefined;
}

/** @deprecated use getActivityDetails */
export function getActivityLines(log: FarmActivityLog, t: TFunction): string[] {
  return getActivityDetails(log, t).map((d) => (d.label ? `${d.label}: ${d.value}` : d.value));
}

export function getActivityVariant(log: FarmActivityLog): ActivityVariant {
  if (log.activityType === 'spray' || hasSprayDetails(log.spraySubTypes ?? [])) return 'spray';
  if (isIrrigationActivity(log.activityType)) return 'irrigation';
  if (isFertilizerActivity(log.activityType)) return 'fertilizer';
  if (isWorkerSpendActivity(log.activityType)) return 'labour';
  return 'cultural';
}

export function logHasBiologicalMoon(log: FarmActivityLog): boolean {
  const subs = resolveIrrigationSubTypes(log);
  return subs.includes('biological') && Boolean(log.moonPhase);
}

export function getPrimaryDetailKey(log: FarmActivityLog): ActivityDetailKey {
  if (log.spraySubTypes?.length) return log.spraySubTypes[0];
  if (log.moonPhase && resolveIrrigationSubTypes(log).includes('biological')) return 'moon_phase';
  if (isIrrigationActivity(log.activityType)) return 'duration';
  if (isFertilizerActivity(log.activityType)) return 'product';
  return 'other';
}
