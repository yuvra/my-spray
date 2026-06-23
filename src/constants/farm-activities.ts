import type { ActivityGroupId, FarmActivityType, IrrigationSubType, SpraySubType } from '@/types';

export const IRRIGATION_MULTI_SELECT_TYPES: IrrigationSubType[] = [
  'plain',
  'nutrient',
  'nematicide_drench',
  'biological',
];

export const SPRAY_MULTI_SELECT_TYPES: SpraySubType[] = [
  'fungicide',
  'insecticide',
  'bactericide',
  'pgr',
  'fertilizer_spray',
  'micronutrient_spray',
  'water_ph_balancer',
  'spreader_sticker',
];

export const IRRIGATION_ACTIVITY_TYPES: FarmActivityType[] = [
  'irrigation_plain',
  'irrigation_nutrient',
  'irrigation',
  'irrigation_nematicide_drench',
  'irrigation_biological',
];

export const SOIL_FERTILIZER_ACTIVITY_TYPES: FarmActivityType[] = ['fertilizer', 'fym_distribution'];

export const CULTURAL_ACTIVITY_TYPES: FarmActivityType[] = [
  'pruning',
  'topping_water_shoot',
  'remove_water_shoot',
  'stem_pasting',
  'weed_removing',
  'stem_wash',
];

export const WORKER_SPEND_ACTIVITY_TYPES: FarmActivityType[] = ['worker_spend'];

export type ActivityGroup = {
  id: ActivityGroupId;
  labelKey: string;
  hintKey?: string;
  accentColor: string;
  multiSelect: boolean;
  items: (SpraySubType | IrrigationSubType | FarmActivityType)[];
};

export const ACTIVITY_GROUPS: ActivityGroup[] = [
  {
    id: 'spray',
    labelKey: 'home.activityGroups.spray',
    hintKey: 'home.sprayMultiSelectHint',
    accentColor: '#2E7D32',
    multiSelect: true,
    items: SPRAY_MULTI_SELECT_TYPES,
  },
  {
    id: 'irrigation',
    labelKey: 'home.activityGroups.irrigation',
    hintKey: 'home.irrigationMultiSelectHint',
    accentColor: '#0284C7',
    multiSelect: true,
    items: IRRIGATION_MULTI_SELECT_TYPES,
  },
  {
    id: 'soil',
    labelKey: 'home.activityGroups.soilFertilizer',
    accentColor: '#B45309',
    multiSelect: false,
    items: SOIL_FERTILIZER_ACTIVITY_TYPES,
  },
  {
    id: 'other',
    labelKey: 'home.activityGroups.other',
    accentColor: '#6B7280',
    multiSelect: false,
    items: CULTURAL_ACTIVITY_TYPES,
  },
  {
    id: 'labour',
    labelKey: 'home.activityGroups.labour',
    accentColor: '#7C3AED',
    multiSelect: false,
    items: WORKER_SPEND_ACTIVITY_TYPES,
  },
];

export const FERTILIZER_ACTIVITY_TYPES = SOIL_FERTILIZER_ACTIVITY_TYPES;

export const FUNGICIDE_PRODUCTS = [
  'Biostadt Roko',
  'Ridomil Gold',
  'Curzate M-8',
  'Bavistin',
  'Nativo',
  'Score',
  'Amistar',
  'Kavach',
  'Blitox',
  'Anvil',
  'Topsin M',
  'Saaf',
  'Contaf',
  'Merger',
  'Sulphur 80% WP',
  'Other',
] as const;

export const INSECTICIDE_PRODUCTS = [
  'Proclaim',
  'Hamla',
  'Oberon',
  'Regent',
  'Coragen',
  'Confidor',
  'Vertimec',
  'Actara',
  'Polo',
  'Lannate',
  'Marshal',
  'Tracer',
  'Other',
] as const;

export const PGR_PRODUCTS = [
  'Ethrel (Ethephon)',
  'NAA',
  'Paclobutrazol (Contaf)',
  'Cycocel (CCC)',
  'Brassinolide',
  'Triacontanol',
  'Gibberellic Acid (GA3)',
  'Other',
] as const;

export const FERTILIZER_SPRAY_PRODUCTS = [
  '19:19:19',
  '0:0:50',
  '13:0:45',
  '12:61:00',
  '10:26:26',
  'Urea Foliar',
  'Potassium Nitrate',
  'Calcium Nitrate',
  'Other',
] as const;

export const MICRONUTRIENT_PRODUCTS = [
  'Nutrivant / Multi K',
  'Zinc Sulphate',
  'Ferrous Sulphate',
  'Boron (Solubor)',
  'Calcium Nitrate',
  'Magnesium Sulphate',
  'Seaweed Extract',
  'Amino Acid Spray',
  'Other',
] as const;

export const BACTERICIDE_PRODUCTS = [
  'Streptocyclin',
  '2-Bromo-2-nitropropane (BNP)',
  'Kasugamycin',
  'Copper Hydroxide',
  'Other',
] as const;

export const WATER_PH_BALANCER_PRODUCTS = [
  'Citric Acid',
  'Humic Acid',
  'pH Down / Buffer',
  'Acetic Acid (Vinegar)',
  'Potassium Carbonate',
  'Other',
] as const;

export const SPREADER_STICKER_PRODUCTS = [
  'Silwet / Silicone Spreader',
  'LI-700',
  'Teepol',
  'Sandalwood Oil Sticker',
  'Nonoxynol',
  'Sticker / Spreader',
  'Other',
] as const;

export const NUTRIENT_IRRIGATION_PRODUCTS = [
  '19:19:19',
  '0:52:34',
  '0:0:50',
  '13:0:45',
  '12:61:00',
  '10:26:26',
  'Humic Acid',
  'Other',
] as const;

export const NEMATICIDE_PRODUCTS = [
  'Velum Prime',
  'Vaniva',
  'Nimon',
  'Other',
] as const;

export const BIOLOGICAL_AGENT_PRODUCTS = [
  'Trichoderma',
  'Pseudomonas',
  'Bacillus',
  'Other',
] as const;

export function isSpraySubType(value: string): value is SpraySubType {
  return SPRAY_MULTI_SELECT_TYPES.includes(value as SpraySubType);
}

export function isIrrigationSubType(value: string): value is IrrigationSubType {
  return IRRIGATION_MULTI_SELECT_TYPES.includes(value as IrrigationSubType);
}

export function isIrrigationActivity(type: FarmActivityType): boolean {
  return IRRIGATION_ACTIVITY_TYPES.includes(type);
}

export function isFertilizerActivity(type: FarmActivityType): boolean {
  return FERTILIZER_ACTIVITY_TYPES.includes(type);
}

export function isCulturalActivity(type: FarmActivityType): boolean {
  return CULTURAL_ACTIVITY_TYPES.includes(type);
}

export function isWorkerSpendActivity(type: FarmActivityType): boolean {
  return WORKER_SPEND_ACTIVITY_TYPES.includes(type);
}

export function hasSprayDetails(spraySubTypes: SpraySubType[]): boolean {
  return spraySubTypes.length > 0;
}

export function hasIrrigationDetails(irrigationSubTypes: IrrigationSubType[]): boolean {
  return irrigationSubTypes.length > 0;
}

export function toggleProductInList(list: string[], product: string): string[] {
  return list.includes(product) ? list.filter((item) => item !== product) : [...list, product];
}

export function resolveProducts(selected: string[], custom: string): string[] {
  const resolved = selected.filter((item) => item !== 'Other');
  if (selected.includes('Other') && custom.trim()) {
    resolved.push(custom.trim());
  }
  return resolved;
}

export function formatProductList(products?: string[], legacy?: string): string | undefined {
  if (products?.length) return products.join(', ');
  return legacy;
}

export function getActivityLabelKey(type: SpraySubType | IrrigationSubType | FarmActivityType): string {
  if (isSpraySubType(type)) return `home.spraySubTypes.${type}`;
  if (isIrrigationSubType(type)) return `home.irrigationSubTypes.${type}`;
  return `home.activityTypes.${type}`;
}
