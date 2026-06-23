import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { KRUSHI_SARTHI_PRODUCT_SEED, lookupProductChemical } from '@/data/krushi-sarthi-seed';
import type { DoseUnit, ProductInventoryItem } from '@/types';
import { defaultUsageDraft, usageKey, type ProductUsageDraft } from '@/utils/product-usage';

export const PRODUCT_GROUPS = [
  'fungicide',
  'insecticide',
  'bactericide',
  'pgr',
  'fertilizer_spray',
  'micronutrient_spray',
  'water_ph_balancer',
  'spreader_sticker',
  'nutrient',
  'nematicide_drench',
  'biological',
] as const;

export type ProductGroup = (typeof PRODUCT_GROUPS)[number];

function itemId(group: string, name: string): string {
  return usageKey(group, name);
}

export type InventorySeedEntry = {
  name: string;
  group: string;
  chemical?: string;
  unitPrice?: number;
  priceUnit?: string;
  dosePerLiter?: number;
  doseUnit?: DoseUnit;
};

type ProductInventoryState = {
  items: ProductInventoryItem[];
  seeded: boolean;
  upsert: (item: Omit<ProductInventoryItem, 'id'> & { id?: string }) => void;
  remove: (id: string) => void;
  getItem: (group: string, name: string) => ProductInventoryItem | undefined;
  getNamesForGroup: (group: string) => string[];
  getUsageDraft: (group: string, name: string) => ProductUsageDraft;
  mergeCatalogProducts: (entries: InventorySeedEntry[]) => void;
  seedKrushiSarthiDefaults: (force?: boolean) => void;
};

export const useProductInventoryStore = create<ProductInventoryState>()(
  persist(
    (set, get) => ({
      items: [],
      seeded: false,

      upsert: (item) => {
        const id = item.id ?? itemId(item.group, item.name);
        set((s) => {
          const idx = s.items.findIndex((i) => i.id === id);
          const next: ProductInventoryItem = {
            id,
            name: item.name.trim(),
            group: item.group,
            chemical: item.chemical ?? lookupProductChemical(item.name.trim(), item.group),
            dosePerLiter: item.dosePerLiter,
            doseUnit: item.doseUnit ?? 'g',
            unitPrice: item.unitPrice,
            priceUnit: item.priceUnit ?? 'kg',
            stockQuantity: item.stockQuantity,
          };
          if (idx >= 0) {
            const copy = [...s.items];
            copy[idx] = { ...copy[idx], ...next };
            return { items: copy };
          }
          return { items: [...s.items, next] };
        });
      },

      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      getItem: (group, name) => get().items.find((i) => i.group === group && i.name === name),

      getNamesForGroup: (group) =>
        get()
          .items.filter((i) => i.group === group)
          .map((i) => i.name)
          .sort((a, b) => a.localeCompare(b)),

      getUsageDraft: (group, name) => {
        const item = get().getItem(group, name);
        if (!item) return defaultUsageDraft();
        return {
          dosePerLiter: item.dosePerLiter != null ? String(item.dosePerLiter) : '',
          doseUnit: (item.doseUnit ?? 'g') as DoseUnit,
          unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
          priceUnit: item.priceUnit ?? 'kg',
        };
      },

      mergeCatalogProducts: (entries) => {
        set((s) => {
          const copy = [...s.items];
          for (const entry of entries) {
            const id = itemId(entry.group, entry.name);
            const existing = copy.find((i) => i.id === id);
            if (existing) {
              if (entry.unitPrice && !existing.unitPrice) existing.unitPrice = entry.unitPrice;
              if (entry.priceUnit && !existing.priceUnit) existing.priceUnit = entry.priceUnit;
              if (entry.dosePerLiter != null && existing.dosePerLiter == null) {
                existing.dosePerLiter = entry.dosePerLiter;
              }
              if (entry.doseUnit && !existing.doseUnit) existing.doseUnit = entry.doseUnit;
              continue;
            }
            copy.push({
              id,
              name: entry.name,
              group: entry.group,
              chemical: entry.chemical ?? lookupProductChemical(entry.name, entry.group),
              doseUnit: entry.doseUnit ?? 'g',
              priceUnit: entry.priceUnit ?? 'kg',
              unitPrice: entry.unitPrice,
              dosePerLiter: entry.dosePerLiter,
            });
          }
          return { items: copy };
        });
      },

      seedKrushiSarthiDefaults: (force = false) => {
        const { items, upsert, mergeCatalogProducts } = get();
        if (!force && items.length > 0 && get().seeded) return;

        mergeCatalogProducts(
          KRUSHI_SARTHI_PRODUCT_SEED.map((p) => ({
            name: p.name,
            group: p.group,
            chemical: p.chemical,
            dosePerLiter: p.dosePerLiter,
            doseUnit: p.doseUnit,
            unitPrice: p.unitPrice,
            priceUnit: p.priceUnit,
          })),
        );

        for (const seed of KRUSHI_SARTHI_PRODUCT_SEED) {
          const existing = get().getItem(seed.group, seed.name);
          if (existing && !force) {
            if (
              !existing.chemical ||
              existing.dosePerLiter == null ||
              existing.unitPrice == null
            ) {
              upsert({
                ...existing,
                chemical: existing.chemical ?? seed.chemical,
                dosePerLiter: existing.dosePerLiter ?? seed.dosePerLiter,
                doseUnit: existing.doseUnit ?? seed.doseUnit,
                unitPrice: existing.unitPrice ?? seed.unitPrice,
                priceUnit: existing.priceUnit ?? seed.priceUnit,
              });
            }
            continue;
          }
          upsert({
            id: itemId(seed.group, seed.name),
            name: seed.name,
            group: seed.group,
            chemical: seed.chemical,
            dosePerLiter: seed.dosePerLiter,
            doseUnit: seed.doseUnit,
            unitPrice: seed.unitPrice,
            priceUnit: seed.priceUnit,
          });
        }

        set({ seeded: true });
      },
    }),
    {
      name: 'product-inventory',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.seedKrushiSarthiDefaults();
      },
    },
  ),
);
