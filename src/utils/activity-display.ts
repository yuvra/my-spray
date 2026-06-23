import type { TFunction } from 'i18next';

import {
  formatProductList,
  getActivityLabelKey,
  hasSprayDetails,
  isCulturalActivity,
  isFertilizerActivity,
  isIrrigationActivity,
} from '@/constants/farm-activities';
import type { FarmActivityLog, SpraySubType } from '@/types';

export type ActivityVariant = 'spray' | 'irrigation' | 'fertilizer' | 'cultural';

export type ActivityDetailKey =
  | SpraySubType
  | 'duration'
  | 'product'
  | 'notes'
  | 'other';

export type ActivityDetail = {
  key: ActivityDetailKey;
  label: string;
  value: string;
};

export function getActivityTitle(log: FarmActivityLog, t: TFunction): string {
  if (log.activityType === 'spray' && log.spraySubTypes?.length) {
    return log.spraySubTypes.map((st) => t(`home.spraySubTypes.${st}`)).join(' + ');
  }
  return t(`home.activityTypes.${log.activityType}`);
}

export function getActivityDetails(log: FarmActivityLog, t: TFunction): ActivityDetail[] {
  const details: ActivityDetail[] = [];

  if (isIrrigationActivity(log.activityType)) {
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
    if (log.productName) {
      details.push({ key: 'product', label: t('home.nutrientProduct'), value: log.productName });
    }
  }

  if (hasSprayDetails(log.spraySubTypes ?? [])) {
    const fungicides = formatProductList(log.fungicideProducts, log.fungicideProduct);
    const insecticides = formatProductList(log.insecticideProducts, log.insecticideProduct);
    const pgrs = formatProductList(log.pgrProducts);
    const fertSprays = formatProductList(log.fertilizerSprayProducts);
    const micronutrients = formatProductList(log.micronutrientProducts, log.micronutrientProduct);
    const bactericides = formatProductList(log.bactericideProducts);
    const phBalancers = formatProductList(log.waterPhBalancerProducts);
    const spreaderStickers = formatProductList(log.spreaderStickerProducts);

    if (fungicides) {
      details.push({ key: 'fungicide', label: t('home.spraySubTypes.fungicide'), value: fungicides });
    }
    if (insecticides) {
      details.push({ key: 'insecticide', label: t('home.spraySubTypes.insecticide'), value: insecticides });
    }
    if (bactericides) {
      details.push({ key: 'bactericide', label: t('home.spraySubTypes.bactericide'), value: bactericides });
    }
    if (pgrs) {
      details.push({ key: 'pgr', label: t('home.spraySubTypes.pgr'), value: pgrs });
    }
    if (fertSprays) {
      details.push({
        key: 'fertilizer_spray',
        label: t('home.spraySubTypes.fertilizer_spray'),
        value: fertSprays,
      });
    }
    if (micronutrients) {
      details.push({
        key: 'micronutrient_spray',
        label: t('home.spraySubTypes.micronutrient_spray'),
        value: micronutrients,
      });
    }
    if (phBalancers) {
      details.push({
        key: 'water_ph_balancer',
        label: t('home.spraySubTypes.water_ph_balancer'),
        value: phBalancers,
      });
    }
    if (spreaderStickers) {
      details.push({
        key: 'spreader_sticker',
        label: t('home.spraySubTypes.spreader_sticker'),
        value: spreaderStickers,
      });
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

  if (log.notes) {
    details.push({ key: 'notes', label: t('schedule.notes'), value: log.notes });
  }

  return details;
}

/** @deprecated use getActivityDetails */
export function getActivityLines(log: FarmActivityLog, t: TFunction): string[] {
  return getActivityDetails(log, t).map((d) => (d.label ? `${d.label}: ${d.value}` : d.value));
}

export function getActivityVariant(log: FarmActivityLog): ActivityVariant {
  if (log.activityType === 'spray' || hasSprayDetails(log.spraySubTypes ?? [])) return 'spray';
  if (isIrrigationActivity(log.activityType)) return 'irrigation';
  if (isFertilizerActivity(log.activityType)) return 'fertilizer';
  return 'cultural';
}

export function getPrimaryDetailKey(log: FarmActivityLog): ActivityDetailKey {
  if (log.spraySubTypes?.length) return log.spraySubTypes[0];
  if (isIrrigationActivity(log.activityType)) return 'duration';
  if (isFertilizerActivity(log.activityType)) return 'product';
  return 'other';
}
