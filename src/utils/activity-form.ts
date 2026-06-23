import type {
  FarmActivityLog,
  FarmActivityType,
  IrrigationSubType,
  MoonPhase,
  SpraySubType,
} from '@/types';
import {
  isCulturalActivity,
  isFertilizerActivity,
  isWorkerSpendActivity,
} from '@/constants/farm-activities';
import { getWorkerNames, useWorkerStore } from '@/stores/useWorkerStore';

function productsFrom(list?: string[], legacy?: string): string[] {
  if (list?.length) return list;
  if (legacy?.trim()) return legacy.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

export function logToFormDate(log: FarmActivityLog): Date {
  const [y, m, d] = log.date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function resolveSpraySubTypesFromLog(log: FarmActivityLog): SpraySubType[] {
  if (log.spraySubTypes?.length) return [...log.spraySubTypes];
  if (log.activityType === 'fungicide') return ['fungicide'];
  if (log.activityType === 'insecticide') return ['insecticide'];
  if (log.activityType === 'micronutrient_spray') return ['micronutrient_spray'];
  return [];
}

export function resolveIrrigationSubTypesFromLog(log: FarmActivityLog): IrrigationSubType[] {
  if (log.irrigationSubTypes?.length) return [...log.irrigationSubTypes];
  if (log.activityType === 'irrigation_plain') return ['plain'];
  if (log.activityType === 'irrigation_nutrient') return ['nutrient'];
  if (log.activityType === 'irrigation_nematicide_drench') return ['nematicide_drench'];
  if (log.activityType === 'irrigation_biological') return ['biological'];
  if (log.activityType === 'irrigation') return ['plain'];
  return [];
}

export function resolveSingleActivityFromLog(log: FarmActivityLog): FarmActivityType | null {
  if (log.spraySubTypes?.length || log.activityType === 'spray') return null;
  if (log.irrigationSubTypes?.length || log.activityType.startsWith('irrigation')) return null;
  if (
    isFertilizerActivity(log.activityType) ||
    isCulturalActivity(log.activityType) ||
    isWorkerSpendActivity(log.activityType)
  ) {
    return log.activityType;
  }
  return null;
}

export type ActivityFormSnapshot = {
  date: Date;
  farmId: string;
  spraySubTypes: SpraySubType[];
  irrigationSubTypes: IrrigationSubType[];
  singleActivity: FarmActivityType | null;
  fungicideProducts: string[];
  insecticideProducts: string[];
  micronutrientProducts: string[];
  pgrProducts: string[];
  fertilizerSprayProducts: string[];
  bactericideProducts: string[];
  waterPhBalancerProducts: string[];
  spreaderStickerProducts: string[];
  nutrientProducts: string[];
  nematicideProducts: string[];
  biologicalProducts: string[];
  moonPhase: MoonPhase | null;
  productName: string;
  quantity: string;
  unit: string;
  waterHours: string;
  waterMinutes: string;
  sprayWaterLiters: string;
  notes: string;
  cost: string;
  workName: string;
  selectedWorker: string;
  customWorker: string;
  workerSpend: string;
};

export function snapshotFromActivityLog(log: FarmActivityLog): ActivityFormSnapshot {
  const workerNames = getWorkerNames(useWorkerStore.getState().workers);
  let selectedWorker = '';
  let customWorker = '';
  if (log.workerName) {
    if (workerNames.includes(log.workerName)) {
      selectedWorker = log.workerName;
    } else {
      selectedWorker = 'Other';
      customWorker = log.workerName;
    }
  }

  return {
    date: logToFormDate(log),
    farmId: log.farmId ?? '',
    spraySubTypes: resolveSpraySubTypesFromLog(log),
    irrigationSubTypes: resolveIrrigationSubTypesFromLog(log),
    singleActivity: resolveSingleActivityFromLog(log),
    fungicideProducts: productsFrom(log.fungicideProducts, log.fungicideProduct),
    insecticideProducts: productsFrom(log.insecticideProducts, log.insecticideProduct),
    micronutrientProducts: productsFrom(log.micronutrientProducts, log.micronutrientProduct),
    pgrProducts: productsFrom(log.pgrProducts),
    fertilizerSprayProducts: productsFrom(log.fertilizerSprayProducts),
    bactericideProducts: productsFrom(log.bactericideProducts),
    waterPhBalancerProducts: productsFrom(log.waterPhBalancerProducts),
    spreaderStickerProducts: productsFrom(log.spreaderStickerProducts),
    nutrientProducts: productsFrom(log.nutrientProducts, log.productName),
    nematicideProducts: productsFrom(log.nematicideProducts),
    biologicalProducts: productsFrom(log.biologicalProducts),
    moonPhase: log.moonPhase ?? null,
    productName: log.productName ?? '',
    quantity: log.quantity != null ? String(log.quantity) : '',
    unit: log.unit ?? 'kg',
    waterHours: String(log.durationHours ?? 1),
    waterMinutes: String(log.durationMinutes ?? 0),
    sprayWaterLiters:
      log.sprayWaterLiters != null
        ? String(log.sprayWaterLiters)
        : log.waterUsedLiters != null
          ? String(log.waterUsedLiters)
          : '',
    notes: log.notes ?? '',
    cost: log.cost != null ? String(log.cost) : '',
    workName: log.workName ?? '',
    selectedWorker,
    customWorker,
    workerSpend: log.workerSpend != null ? String(log.workerSpend) : '',
  };
}
