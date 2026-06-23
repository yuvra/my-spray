import { create } from 'zustand';

import type { CostCategory, CropType, ExpenseLineItem } from '@/types';

interface ExpenseState {
  selectedCrop: CropType;
  lineItems: ExpenseLineItem[];
  labourCost: number;
  acres: number;
  setSelectedCrop: (crop: CropType) => void;
  setLabourCost: (cost: number) => void;
  setAcres: (acres: number) => void;
  addLineItem: (item: ExpenseLineItem) => void;
  updateLineItem: (catalogId: string, quantity: number, unitPrice?: number) => void;
  removeLineItem: (catalogId: string) => void;
  reset: () => void;
  getCategoryTotal: (category: CostCategory) => number;
  getGrandTotal: () => number;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  selectedCrop: 'pomegranate',
  lineItems: [],
  labourCost: 0,
  acres: 1,

  setSelectedCrop: (selectedCrop) => set({ selectedCrop }),
  setLabourCost: (labourCost) => set({ labourCost }),
  setAcres: (acres) => set({ acres }),

  addLineItem: (item) =>
    set((s) => {
      const existing = s.lineItems.find((l) => l.catalogId === item.catalogId);
      if (existing) {
        return {
          lineItems: s.lineItems.map((l) =>
            l.catalogId === item.catalogId
              ? { ...l, quantity: l.quantity + item.quantity }
              : l,
          ),
        };
      }
      return { lineItems: [...s.lineItems, item] };
    }),

  updateLineItem: (catalogId, quantity, unitPrice) =>
    set((s) => ({
      lineItems: s.lineItems.map((l) =>
        l.catalogId === catalogId
          ? { ...l, quantity, ...(unitPrice !== undefined ? { unitPrice } : {}) }
          : l,
      ),
    })),

  removeLineItem: (catalogId) =>
    set((s) => ({ lineItems: s.lineItems.filter((l) => l.catalogId !== catalogId) })),

  reset: () => set({ lineItems: [], labourCost: 0, acres: 1 }),

  getCategoryTotal: (category) => {
    const { lineItems, labourCost } = get();
    if (category === 'labour') return labourCost;
    return lineItems
      .filter((l) => l.category === category)
      .reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  },

  getGrandTotal: () => {
    const { lineItems, labourCost } = get();
    const products = lineItems.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
    return products + labourCost;
  },
}));
