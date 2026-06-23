import { create } from 'zustand';

import {
  fetchProductCatalog,
  lookupCatalogPrice,
  type ProductCatalogSource,
} from '@/services/productCatalogService';

type ProductCatalogState = {
  fungicides: string[];
  insecticides: string[];
  priceByName: Record<string, { unitPrice: number; unit: string }>;
  source: ProductCatalogSource;
  loading: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  getPriceFor: (productName: string) => { unitPrice: number; unit: string } | undefined;
};

export const useProductCatalogStore = create<ProductCatalogState>((set, get) => ({
  fungicides: [],
  insecticides: [],
  priceByName: {},
  source: 'local',
  loading: false,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated || get().loading) return;
    set({ loading: true });
    try {
      const catalog = await fetchProductCatalog();
      set({
        fungicides: catalog.fungicides,
        insecticides: catalog.insecticides,
        priceByName: catalog.priceByName,
        source: catalog.source,
        hydrated: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    set({ loading: true, hydrated: false });
    try {
      const catalog = await fetchProductCatalog();
      set({
        fungicides: catalog.fungicides,
        insecticides: catalog.insecticides,
        priceByName: catalog.priceByName,
        source: catalog.source,
        hydrated: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  getPriceFor: (productName) => lookupCatalogPrice(get().priceByName, productName),
}));
