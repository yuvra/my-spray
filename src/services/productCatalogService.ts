import { collection, getDocs } from 'firebase/firestore';

import {
  FUNGICIDE_PRODUCTS,
  INSECTICIDE_PRODUCTS,
} from '@/constants/farm-activities';
import {
  KRUSHI_SARTHI_FUNGICIDES,
  KRUSHI_SARTHI_INSECTICIDES,
  KRUSHI_SARTHI_PRODUCT_SEED,
  type KrushiSarthiSeedProduct,
} from '@/data/krushi-sarthi-seed';
import { getProductCatalogDb, isProductCatalogConfigured } from '@/lib/firebase';
import type { DoseUnit } from '@/types';

export type ProductCatalogSource = 'firestore' | 'local';

export type CatalogProduct = {
  name: string;
  category: 'fungicide' | 'insecticide';
  unitPrice?: number;
  unit?: string;
  dosePerLiter?: number;
  doseUnit?: DoseUnit;
  chemical?: string;
};

export type ProductCatalog = {
  fungicides: string[];
  insecticides: string[];
  products: CatalogProduct[];
  priceByName: Record<string, { unitPrice: number; unit: string }>;
  source: ProductCatalogSource;
};

type ProductCategory = 'fungicide' | 'insecticide';

const CATEGORY_FIELDS = ['category', 'type', 'productType', 'productCategory', 'group', 'kind'];
const NAME_FIELDS = ['name', 'productName', 'product_name', 'title', 'label', 'brandName', 'brand'];
const PRICE_FIELDS = ['unitPrice', 'price', 'mrp', 'rate', 'sellingPrice', 'cost', 'marketPrice', 'productPrice'];
const UNIT_FIELDS = ['unit', 'priceUnit', 'uom', 'unitOfMeasure'];
const VARIANT_PRICE_FIELDS = ['price', 'sellingPrice', 'mrp', 'productPrice', 'salePrice'];

function readLocalizedString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const key of ['en', 'hi', 'mr']) {
      const part = obj[key];
      if (typeof part === 'string' && part.trim()) return part.trim();
    }
  }
  return null;
}

function normalizeCategory(value: unknown): ProductCategory | null {
  const text = (readLocalizedString(value) ?? (typeof value === 'string' ? value : '')).toLowerCase().trim();
  if (!text) return null;
  if (text.includes('fung')) return 'fungicide';
  if (text.includes('insect') || text.includes('pest')) return 'insecticide';
  return null;
}

function readName(data: Record<string, unknown>): string | null {
  for (const key of NAME_FIELDS) {
    const localized = readLocalizedString(data[key]);
    if (localized) return localized;
  }
  return null;
}

function readCategory(data: Record<string, unknown>, docId: string): ProductCategory | null {
  for (const key of CATEGORY_FIELDS) {
    const match = normalizeCategory(data[key]);
    if (match) return match;
  }
  return normalizeCategory(docId);
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value) && value > 0) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function readPackSizeGrams(value: unknown): number | undefined {
  const text = readLocalizedString(value) ?? (typeof value === 'string' ? value : '');
  if (!text) return undefined;
  const lower = text.toLowerCase();
  const kg = lower.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kg) return Number(kg[1]) * 1000;
  const g = lower.match(/(\d+(?:\.\d+)?)\s*g(?:m|ms)?/);
  if (g) return Number(g[1]);
  const ml = lower.match(/(\d+(?:\.\d+)?)\s*ml/);
  if (ml) return Number(ml[1]);
  const l = lower.match(/(\d+(?:\.\d+)?)\s*l(?:tr|itre)?/);
  if (l) return Number(l[1]) * 1000;
  return undefined;
}

function readPriceFromVariant(variant: Record<string, unknown>): {
  unitPrice?: number;
  unit?: string;
} {
  let packPrice: number | undefined;
  for (const key of VARIANT_PRICE_FIELDS) {
    const val = readNumber(variant[key]);
    if (val) {
      packPrice = val;
      break;
    }
  }
  if (!packPrice) return {};

  const packLabel =
    readLocalizedString(variant.packSize) ??
    readLocalizedString(variant.weight) ??
    readLocalizedString(variant.variantName) ??
    readLocalizedString(variant.size);

  const grams = readPackSizeGrams(packLabel);
  if (grams && grams >= 1000) {
    return { unitPrice: Math.round((packPrice / grams) * 1000), unit: 'kg' };
  }
  if (grams && grams > 0) {
    return { unitPrice: Math.round((packPrice / grams) * 1000), unit: 'kg' };
  }

  const lower = (packLabel ?? '').toLowerCase();
  if (lower.includes('ml') || lower.includes('ltr') || lower.includes('litre')) {
    return { unitPrice: packPrice, unit: 'L' };
  }

  return { unitPrice: packPrice, unit: 'pack' };
}

function readPrice(data: Record<string, unknown>): { unitPrice?: number; unit?: string } {
  const mapVariant = data.mapVariant;
  if (mapVariant && typeof mapVariant === 'object' && !Array.isArray(mapVariant)) {
    let best: { unitPrice?: number; unit?: string } = {};
    for (const variant of Object.values(mapVariant as Record<string, unknown>)) {
      if (!variant || typeof variant !== 'object') continue;
      const parsed = readPriceFromVariant(variant as Record<string, unknown>);
      if (parsed.unitPrice && (!best.unitPrice || parsed.unitPrice < best.unitPrice)) {
        best = parsed;
      }
    }
    if (best.unitPrice) return best;
  }

  let unitPrice: number | undefined;
  for (const key of PRICE_FIELDS) {
    const val = readNumber(data[key]);
    if (val) {
      unitPrice = val;
      break;
    }
  }
  let unit: string | undefined;
  for (const key of UNIT_FIELDS) {
    const value = data[key];
    const localized = readLocalizedString(value) ?? (typeof value === 'string' ? value : undefined);
    if (localized?.trim()) {
      unit = localized.trim().toLowerCase();
      break;
    }
  }
  return { unitPrice, unit: unit ?? 'kg' };
}

function seedByName(name: string): KrushiSarthiSeedProduct | undefined {
  const key = name.toLowerCase().trim();
  return KRUSHI_SARTHI_PRODUCT_SEED.find(
    (p) =>
      p.name.toLowerCase() === key ||
      key.includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(key),
  );
}

function mergeWithFallback(names: string[], fallback: readonly string[]): string[] {
  const unique = new Set<string>();
  for (const name of names) {
    const trimmed = name.trim();
    if (trimmed && trimmed !== 'Other') unique.add(trimmed);
  }
  for (const name of fallback) {
    if (name !== 'Other') unique.add(name);
  }
  return [...unique].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).concat('Other');
}

function buildPriceMap(products: CatalogProduct[]): Record<string, { unitPrice: number; unit: string }> {
  const map: Record<string, { unitPrice: number; unit: string }> = {};
  for (const product of products) {
    if (product.unitPrice != null && product.unitPrice > 0) {
      map[product.name.toLowerCase()] = {
        unitPrice: product.unitPrice,
        unit: product.unit ?? 'kg',
      };
    }
  }
  for (const seed of KRUSHI_SARTHI_PRODUCT_SEED) {
    const key = seed.name.toLowerCase();
    if (!map[key]) {
      map[key] = { unitPrice: seed.unitPrice, unit: seed.priceUnit };
    }
  }
  return map;
}

function localFallback(): ProductCatalog {
  const products: CatalogProduct[] = KRUSHI_SARTHI_PRODUCT_SEED.map((seed) => ({
    name: seed.name,
    category: seed.group,
    unitPrice: seed.unitPrice,
    unit: seed.priceUnit,
    dosePerLiter: seed.dosePerLiter,
    doseUnit: seed.doseUnit,
    chemical: seed.chemical,
  }));

  return {
    fungicides: [...FUNGICIDE_PRODUCTS],
    insecticides: [...INSECTICIDE_PRODUCTS],
    products,
    priceByName: buildPriceMap(products),
    source: 'local',
  };
}

/** Loads fungicide & insecticide from Firestore `products` (Krushi Sarthi catalog). */
export async function fetchProductCatalog(): Promise<ProductCatalog> {
  if (!isProductCatalogConfigured) {
    return localFallback();
  }

  try {
    const db = getProductCatalogDb();
    const snapshot = await getDocs(collection(db, 'products'));

    const catalogProducts: CatalogProduct[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const name = readName(data);
      if (!name) return;

      const category = readCategory(data, docSnap.id);
      if (!category) return;

      const { unitPrice, unit } = readPrice(data);
      const seed = seedByName(name);
      const chemical =
        readLocalizedString(data.chemicalComposition) ??
        (typeof data.chemicalComposition === 'string' ? data.chemicalComposition : undefined) ??
        seed?.chemical;

      catalogProducts.push({
        name,
        category,
        unitPrice: unitPrice ?? seed?.unitPrice,
        unit: unit ?? seed?.priceUnit ?? 'kg',
        dosePerLiter: seed?.dosePerLiter,
        doseUnit: seed?.doseUnit,
        chemical,
      });
    });

    const fungicides = catalogProducts.filter((p) => p.category === 'fungicide').map((p) => p.name);
    const insecticides = catalogProducts.filter((p) => p.category === 'insecticide').map((p) => p.name);

    if (fungicides.length === 0 && insecticides.length === 0) {
      console.warn('[productCatalog] Firestore products empty or unrecognized schema — using Krushi Sarthi seed');
      return localFallback();
    }

    return {
      fungicides: mergeWithFallback(fungicides, FUNGICIDE_PRODUCTS),
      insecticides: mergeWithFallback(insecticides, INSECTICIDE_PRODUCTS),
      products: catalogProducts,
      priceByName: buildPriceMap(catalogProducts),
      source: 'firestore',
    };
  } catch (error) {
    console.warn('[productCatalog] Failed to load products from Firestore — using Krushi Sarthi seed', error);
    return localFallback();
  }
}

export function lookupCatalogPrice(
  priceByName: Record<string, { unitPrice: number; unit: string }>,
  productName: string,
): { unitPrice: number; unit: string } | undefined {
  const key = productName.toLowerCase();
  if (priceByName[key]) return priceByName[key];
  const seed = seedByName(productName);
  if (seed) return { unitPrice: seed.unitPrice, unit: seed.priceUnit };
  return undefined;
}

export { KRUSHI_SARTHI_FUNGICIDES, KRUSHI_SARTHI_INSECTICIDES, KRUSHI_SARTHI_PRODUCT_SEED };
