import type { DoseUnit } from '@/types';

/** Brand-name products with typical dose & retail price (₹) — aligned with Krushi Sarthi / agri retail. */
export type KrushiSarthiSeedProduct = {
  name: string;
  group: 'fungicide' | 'insecticide';
  dosePerLiter: number;
  doseUnit: DoseUnit;
  /** Price per kg or per L (see priceUnit). */
  unitPrice: number;
  priceUnit: string;
  chemical?: string;
};

export const KRUSHI_SARTHI_FUNGICIDES: KrushiSarthiSeedProduct[] = [
  {
    name: 'Biostadt Roko',
    group: 'fungicide',
    chemical: 'Thiophanate Methyl 70% WP',
    dosePerLiter: 1.5,
    doseUnit: 'g',
    unitPrice: 1500,
    priceUnit: 'kg',
  },
  {
    name: 'Ridomil Gold',
    group: 'fungicide',
    chemical: 'Metalaxyl 8% + Mancozeb 64% WP',
    dosePerLiter: 2,
    doseUnit: 'g',
    unitPrice: 1200,
    priceUnit: 'kg',
  },
  {
    name: 'Curzate M-8',
    group: 'fungicide',
    chemical: 'Cymoxanil 8% + Mancozeb 64% WP',
    dosePerLiter: 2,
    doseUnit: 'g',
    unitPrice: 1100,
    priceUnit: 'kg',
  },
  {
    name: 'Bavistin',
    group: 'fungicide',
    chemical: 'Carbendazim 50% WP',
    dosePerLiter: 1,
    doseUnit: 'g',
    unitPrice: 850,
    priceUnit: 'kg',
  },
  {
    name: 'Nativo',
    group: 'fungicide',
    chemical: 'Trifloxystrobin 25% + Tebuconazole 50% WG',
    dosePerLiter: 0.5,
    doseUnit: 'g',
    unitPrice: 4200,
    priceUnit: 'kg',
  },
  {
    name: 'Score',
    group: 'fungicide',
    chemical: 'Difenoconazole 25% EC',
    dosePerLiter: 0.5,
    doseUnit: 'ml',
    unitPrice: 2800,
    priceUnit: 'L',
  },
  {
    name: 'Amistar',
    group: 'fungicide',
    chemical: 'Azoxystrobin 23% SC',
    dosePerLiter: 1,
    doseUnit: 'ml',
    unitPrice: 3200,
    priceUnit: 'L',
  },
  {
    name: 'Kavach',
    group: 'fungicide',
    chemical: 'Chlorothalonil 75% WP',
    dosePerLiter: 2,
    doseUnit: 'g',
    unitPrice: 900,
    priceUnit: 'kg',
  },
  {
    name: 'Blitox',
    group: 'fungicide',
    chemical: 'Copper Oxychloride 50% WP',
    dosePerLiter: 3,
    doseUnit: 'g',
    unitPrice: 450,
    priceUnit: 'kg',
  },
  {
    name: 'Anvil',
    group: 'fungicide',
    chemical: 'Hexaconazole 5% SC',
    dosePerLiter: 1,
    doseUnit: 'ml',
    unitPrice: 1800,
    priceUnit: 'L',
  },
  {
    name: 'Topsin M',
    group: 'fungicide',
    chemical: 'Thiophanate Methyl 70% WP',
    dosePerLiter: 1.5,
    doseUnit: 'g',
    unitPrice: 1400,
    priceUnit: 'kg',
  },
  {
    name: 'Saaf',
    group: 'fungicide',
    chemical: 'Carbendazim 12% + Mancozeb 63% WP',
    dosePerLiter: 2,
    doseUnit: 'g',
    unitPrice: 950,
    priceUnit: 'kg',
  },
  {
    name: 'Contaf',
    group: 'fungicide',
    chemical: 'Hexaconazole 5% EC',
    dosePerLiter: 1,
    doseUnit: 'ml',
    unitPrice: 1600,
    priceUnit: 'L',
  },
  {
    name: 'Merger',
    group: 'fungicide',
    chemical: 'Propiconazole 25% EC',
    dosePerLiter: 0.5,
    doseUnit: 'ml',
    unitPrice: 2200,
    priceUnit: 'L',
  },
  {
    name: 'Sulphur 80% WP',
    group: 'fungicide',
    chemical: 'Sulphur 80% WP',
    dosePerLiter: 3,
    doseUnit: 'g',
    unitPrice: 180,
    priceUnit: 'kg',
  },
];

export const KRUSHI_SARTHI_INSECTICIDES: KrushiSarthiSeedProduct[] = [
  {
    name: 'Proclaim',
    group: 'insecticide',
    chemical: 'Emamectin Benzoate 5% SG',
    dosePerLiter: 0.4,
    doseUnit: 'g',
    unitPrice: 5800,
    priceUnit: 'kg',
  },
  {
    name: 'Hamla',
    group: 'insecticide',
    chemical: 'Thiamethoxam 25% WG',
    dosePerLiter: 0.3,
    doseUnit: 'g',
    unitPrice: 3500,
    priceUnit: 'kg',
  },
  {
    name: 'Oberon',
    group: 'insecticide',
    chemical: 'Spiromesifen 240 SC',
    dosePerLiter: 0.5,
    doseUnit: 'ml',
    unitPrice: 4500,
    priceUnit: 'L',
  },
  {
    name: 'Regent',
    group: 'insecticide',
    chemical: 'Fipronil 0.3% GR',
    dosePerLiter: 4,
    doseUnit: 'g',
    unitPrice: 650,
    priceUnit: 'kg',
  },
  {
    name: 'Coragen',
    group: 'insecticide',
    chemical: 'Chlorantraniliprole 18.5% SC',
    dosePerLiter: 0.3,
    doseUnit: 'ml',
    unitPrice: 8500,
    priceUnit: 'L',
  },
  {
    name: 'Confidor',
    group: 'insecticide',
    chemical: 'Imidacloprid 17.8% SL',
    dosePerLiter: 0.5,
    doseUnit: 'ml',
    unitPrice: 1200,
    priceUnit: 'L',
  },
  {
    name: 'Vertimec',
    group: 'insecticide',
    chemical: 'Abamectin 1.8% EC',
    dosePerLiter: 0.5,
    doseUnit: 'ml',
    unitPrice: 2500,
    priceUnit: 'L',
  },
  {
    name: 'Actara',
    group: 'insecticide',
    chemical: 'Thiamethoxam 25% WG',
    dosePerLiter: 0.3,
    doseUnit: 'g',
    unitPrice: 3800,
    priceUnit: 'kg',
  },
  {
    name: 'Polo',
    group: 'insecticide',
    chemical: 'Diafenthiuron 50% WP',
    dosePerLiter: 1,
    doseUnit: 'g',
    unitPrice: 2200,
    priceUnit: 'kg',
  },
  {
    name: 'Lannate',
    group: 'insecticide',
    chemical: 'Methomyl 40% SP',
    dosePerLiter: 1.5,
    doseUnit: 'g',
    unitPrice: 1100,
    priceUnit: 'kg',
  },
  {
    name: 'Marshal',
    group: 'insecticide',
    chemical: 'Carbosulfan 25% EC',
    dosePerLiter: 2,
    doseUnit: 'ml',
    unitPrice: 900,
    priceUnit: 'L',
  },
  {
    name: 'Tracer',
    group: 'insecticide',
    chemical: 'Spinetoram 11.7% SC',
    dosePerLiter: 0.3,
    doseUnit: 'ml',
    unitPrice: 5200,
    priceUnit: 'L',
  },
];

export const KRUSHI_SARTHI_PRODUCT_SEED: KrushiSarthiSeedProduct[] = [
  ...KRUSHI_SARTHI_FUNGICIDES,
  ...KRUSHI_SARTHI_INSECTICIDES,
];

export function seedProductNames(group: 'fungicide' | 'insecticide'): string[] {
  const list =
    group === 'fungicide'
      ? KRUSHI_SARTHI_FUNGICIDES.map((p) => p.name)
      : KRUSHI_SARTHI_INSECTICIDES.map((p) => p.name);
  return [...list, 'Other'];
}

/** Technical / chemical name for a brand product. */
export function lookupProductChemical(name: string, group?: string): string | undefined {
  const key = name.trim().toLowerCase();
  if (!key) return undefined;
  const match = KRUSHI_SARTHI_PRODUCT_SEED.find((p) => {
    if (group && p.group !== group) return false;
    const brand = p.name.toLowerCase();
    return brand === key || key.includes(brand) || brand.includes(key);
  });
  return match?.chemical;
}
