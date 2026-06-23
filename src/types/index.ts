export type CropType = 'pomegranate' | 'grapes' | 'sugarcane' | 'ginger';

export type ProductType = 'insecticide' | 'fungicide';

export type CostCategory = 'insecticide' | 'fungicide' | 'fertilizer' | 'labour';

export type Language = 'en' | 'hi' | 'mr';

export type ThemeMode = 'system' | 'light' | 'dark';

export type MessageType = 'text' | 'image' | 'video';

export interface UserProfile {
  uid: string;
  phone: string;
  email?: string;
  name: string;
  village: string;
  preferredCrops: CropType[];
  language: Language;
  createdAt: string;
}

export interface Farm {
  id: string;
  userId: string;
  name: string;
  crop: CropType;
  createdAt: string;
}

export interface SprayLog {
  id: string;
  userId: string;
  farmId?: string;
  crop: CropType;
  productName: string;
  type: ProductType;
  quantity: number;
  unit: string;
  cost: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface FertilizerLog {
  id: string;
  userId: string;
  farmId?: string;
  crop: CropType;
  fertilizerName: string;
  quantity: number;
  unit: string;
  cost: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface IrrigationLog {
  id: string;
  userId: string;
  farmId?: string;
  crop: CropType;
  durationHours: number;
  durationMinutes: number;
  cost: number;
  date: string;
  notes: string;
  createdAt: string;
}

export type ActivityKind = 'spray' | 'water' | 'fertigation';

export type FarmActivityType =
  | 'irrigation_nutrient'
  | 'irrigation_plain'
  | 'spray'
  | 'fungicide'
  | 'insecticide'
  | 'micronutrient_spray'
  | 'plant_growth_promoter'
  | 'fertilizer'
  | 'fym_distribution'
  | 'pruning'
  | 'topping_water_shoot'
  | 'remove_water_shoot'
  | 'stem_pasting'
  | 'weed_removing'
  | 'ethrel_defoliation'
  | 'stem_wash';

export type SpraySubType =
  | 'fungicide'
  | 'insecticide'
  | 'bactericide'
  | 'pgr'
  | 'fertilizer_spray'
  | 'micronutrient_spray'
  | 'water_ph_balancer'
  | 'spreader_sticker';

export type ActivityGroupId = 'spray' | 'irrigation' | 'soil' | 'other';

export interface FarmActivityLog {
  id: string;
  userId: string;
  farmId?: string;
  crop: CropType;
  activityType: FarmActivityType;
  date: string;
  cost?: number;
  spraySubTypes?: SpraySubType[];
  productName?: string;
  fungicideProducts?: string[];
  insecticideProducts?: string[];
  pgrProducts?: string[];
  fertilizerSprayProducts?: string[];
  micronutrientProducts?: string[];
  bactericideProducts?: string[];
  waterPhBalancerProducts?: string[];
  spreaderStickerProducts?: string[];
  /** @deprecated use fungicideProducts */
  fungicideProduct?: string;
  /** @deprecated use insecticideProducts */
  insecticideProduct?: string;
  /** @deprecated use micronutrientProducts */
  micronutrientProduct?: string;
  dosePerLiter?: string;
  waterUsedLiters?: number;
  quantity?: number;
  unit?: string;
  durationHours?: number;
  durationMinutes?: number;
  notes?: string;
  createdAt: string;
}

export interface CropStage {
  week: number;
  activity: string;
  product: string;
  dosage: string;
  notes_en: string;
  notes_hi: string;
  notes_mr: string;
}

export interface CropSchedule {
  id: CropType;
  crop: CropType;
  stages: CropStage[];
}

export interface CostCatalogItem {
  id: string;
  category: CostCategory;
  name: string;
  unitPrice: number;
  unit: string;
}

export interface ExpenseLineItem {
  catalogId: string;
  name: string;
  category: CostCategory;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  type: MessageType;
  text: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface ChatGroup {
  id: CropType | 'general';
  name: string;
  crop: CropType | 'general';
  memberCount: number;
  lastMessageAt: string;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
  description: string;
  icon: string;
  conditionType: string;
  isDaytime: boolean;
  locationName: string;
  fetchedAt: string;
}
