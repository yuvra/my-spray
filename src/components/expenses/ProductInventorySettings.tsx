import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Spacing } from '@/constants/theme';
import {
  BACTERICIDE_PRODUCTS,
  BIOLOGICAL_AGENT_PRODUCTS,
  FERTILIZER_SPRAY_PRODUCTS,
  FUNGICIDE_PRODUCTS,
  INSECTICIDE_PRODUCTS,
  MICRONUTRIENT_PRODUCTS,
  NEMATICIDE_PRODUCTS,
  NUTRIENT_IRRIGATION_PRODUCTS,
  PGR_PRODUCTS,
  SPREADER_STICKER_PRODUCTS,
  WATER_PH_BALANCER_PRODUCTS,
} from '@/constants/farm-activities';
import { KRUSHI_SARTHI_PRODUCT_SEED, lookupProductChemical } from '@/data/krushi-sarthi-seed';
import { useProductCatalogStore } from '@/stores/useProductCatalogStore';
import {
  PRODUCT_GROUPS,
  type InventorySeedEntry,
  type ProductGroup,
  useProductInventoryStore,
} from '@/stores/useProductInventoryStore';
import { WorkerSettingsPanel } from '@/components/expenses/WorkerSettingsPanel';
import type { DoseUnit } from '@/types';

const TEXT = '#111827';
const TEXT_SECONDARY = '#374151';
const TEXT_MUTED = '#6B7280';
const BORDER = '#D1D5DB';
const BG = '#FFFFFF';
const PAGE_BG = '#F3F4F6';
const ACCENT = '#3D6B35';
const INPUT_BG = '#FFFFFF';
const DOSE_UNITS: DoseUnit[] = ['g', 'ml', 'kg'];

const STATIC_BY_GROUP: Record<string, readonly string[]> = {
  fungicide: FUNGICIDE_PRODUCTS,
  insecticide: INSECTICIDE_PRODUCTS,
  bactericide: BACTERICIDE_PRODUCTS,
  pgr: PGR_PRODUCTS,
  fertilizer_spray: FERTILIZER_SPRAY_PRODUCTS,
  micronutrient_spray: MICRONUTRIENT_PRODUCTS,
  water_ph_balancer: WATER_PH_BALANCER_PRODUCTS,
  spreader_sticker: SPREADER_STICKER_PRODUCTS,
  nutrient: NUTRIENT_IRRIGATION_PRODUCTS,
  nematicide_drench: NEMATICIDE_PRODUCTS,
  biological: BIOLOGICAL_AGENT_PRODUCTS,
};

type SettingsTab = 'products' | 'workers';

type Props = {
  visible: boolean;
  onClose: () => void;
};

function groupLabelKey(group: ProductGroup): string {
  if (group === 'nutrient' || group === 'nematicide_drench' || group === 'biological') {
    return `home.irrigationSubTypes.${group}`;
  }
  return `home.spraySubTypes.${group}`;
}

export function ProductInventorySettings({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const items = useProductInventoryStore((s) => s.items);
  const upsert = useProductInventoryStore((s) => s.upsert);
  const remove = useProductInventoryStore((s) => s.remove);
  const mergeCatalogProducts = useProductInventoryStore((s) => s.mergeCatalogProducts);
  const seedKrushiSarthiDefaults = useProductInventoryStore((s) => s.seedKrushiSarthiDefaults);
  const hydrateCatalog = useProductCatalogStore((s) => s.hydrate);
  const catalogFungicides = useProductCatalogStore((s) => s.fungicides);
  const catalogInsecticides = useProductCatalogStore((s) => s.insecticides);
  const priceByName = useProductCatalogStore((s) => s.priceByName);

  const [activeGroup, setActiveGroup] = useState<ProductGroup>('fungicide');
  const [customName, setCustomName] = useState('');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('products');

  useEffect(() => {
    if (!visible) return;
    void hydrateCatalog();
  }, [visible, hydrateCatalog]);

  const groupItems = useMemo(
    () => items.filter((i) => i.group === activeGroup).sort((a, b) => a.name.localeCompare(b.name)),
    [items, activeGroup],
  );

  const importDefaults = () => {
    seedKrushiSarthiDefaults(true);

    const entries: InventorySeedEntry[] = KRUSHI_SARTHI_PRODUCT_SEED.map((p) => ({
      name: p.name,
      group: p.group,
      chemical: p.chemical,
      dosePerLiter: p.dosePerLiter,
      doseUnit: p.doseUnit,
      unitPrice: priceByName[p.name.toLowerCase()]?.unitPrice ?? p.unitPrice,
      priceUnit: priceByName[p.name.toLowerCase()]?.unit ?? p.priceUnit,
    }));

    for (const group of PRODUCT_GROUPS) {
      if (group === 'fungicide' || group === 'insecticide') continue;
      for (const name of STATIC_BY_GROUP[group] ?? []) {
        if (name === 'Other') continue;
        const meta = priceByName[name.toLowerCase()];
        entries.push({
          name,
          group,
          unitPrice: meta?.unitPrice,
          priceUnit: meta?.unit ?? 'kg',
        });
      }
    }

    for (const name of catalogFungicides) {
      if (name === 'Other') continue;
      const meta = priceByName[name.toLowerCase()];
      if (!entries.some((e) => e.name === name && e.group === 'fungicide')) {
        entries.push({
          name,
          group: 'fungicide',
          chemical: lookupProductChemical(name, 'fungicide'),
          unitPrice: meta?.unitPrice,
          priceUnit: meta?.unit ?? 'kg',
        });
      }
    }
    for (const name of catalogInsecticides) {
      if (name === 'Other') continue;
      const meta = priceByName[name.toLowerCase()];
      if (!entries.some((e) => e.name === name && e.group === 'insecticide')) {
        entries.push({
          name,
          group: 'insecticide',
          chemical: lookupProductChemical(name, 'insecticide'),
          unitPrice: meta?.unitPrice,
          priceUnit: meta?.unit ?? 'kg',
        });
      }
    }

    mergeCatalogProducts(entries);
  };

  const addCustomProduct = () => {
    const name = customName.trim();
    if (!name) return;
    upsert({ name, group: activeGroup, doseUnit: 'g', priceUnit: 'kg' });
    setCustomName('');
  };

  const addFromList = (name: string) => {
    const meta = priceByName[name.toLowerCase()];
    const seed = KRUSHI_SARTHI_PRODUCT_SEED.find(
      (p) => p.name.toLowerCase() === name.toLowerCase() && p.group === activeGroup,
    );
    upsert({
      name,
      group: activeGroup,
      chemical: seed?.chemical ?? lookupProductChemical(name, activeGroup),
      doseUnit: seed?.doseUnit ?? 'g',
      priceUnit: meta?.unit ?? seed?.priceUnit ?? 'kg',
      unitPrice: meta?.unitPrice ?? seed?.unitPrice,
      dosePerLiter: seed?.dosePerLiter,
    });
  };

  const configuredIds = new Set(groupItems.map((i) => i.name));
  const suggestions = (STATIC_BY_GROUP[activeGroup] ?? [])
    .filter((n) => n !== 'Other' && !configuredIds.has(n))
    .slice(0, 8);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('expenses.settingsTitle')}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeBtn}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.mainTabs}>
          <Pressable
            onPress={() => setSettingsTab('products')}
            style={[styles.mainTab, settingsTab === 'products' && styles.mainTabActive]}>
            <Text style={[styles.mainTabText, settingsTab === 'products' && styles.mainTabTextActive]}>
              {t('expenses.productsTab')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSettingsTab('workers')}
            style={[styles.mainTab, settingsTab === 'workers' && styles.mainTabActive]}>
            <Text style={[styles.mainTabText, settingsTab === 'workers' && styles.mainTabTextActive]}>
              {t('expenses.workersTab')}
            </Text>
          </Pressable>
        </View>

        {settingsTab === 'workers' ? (
          <View style={styles.workerPanel}>
            <WorkerSettingsPanel />
          </View>
        ) : (
          <>
        <Text style={styles.subtitle}>{t('expenses.productSettingsHint')}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupTabs}>
          {PRODUCT_GROUPS.map((group) => {
            const active = activeGroup === group;
            return (
              <Pressable
                key={group}
                onPress={() => setActiveGroup(group)}
                style={[styles.groupTab, active && styles.groupTabActive]}>
                <Text style={[styles.groupTabText, active && styles.groupTabTextActive]} numberOfLines={1}>
                  {t(groupLabelKey(group))}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.toolbar}>
          <Pressable onPress={importDefaults} style={styles.importBtn}>
            <Text style={styles.importBtnText}>{t('expenses.importProducts')}</Text>
          </Pressable>
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestBlock}>
            <Text style={styles.suggestLabel}>{t('expenses.quickAdd')}</Text>
            <View style={styles.chips}>
              {suggestions.map((name) => (
                <Pressable key={name} onPress={() => addFromList(name)} style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    + {name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.addRow}>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder={t('expenses.addProductName')}
            placeholderTextColor={TEXT_SECONDARY}
            style={styles.addInput}
          />
          <Pressable onPress={addCustomProduct} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{t('expenses.add')}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          {groupItems.length === 0 ? (
            <Text style={styles.empty}>{t('expenses.noProductsConfigured')}</Text>
          ) : (
            groupItems.map((item) => {
              const chemical =
                item.chemical ?? lookupProductChemical(item.name, item.group);
              const doseText =
                item.dosePerLiter != null
                  ? `${item.dosePerLiter} ${item.doseUnit ?? 'g'}/L`
                  : null;
              const priceText =
                item.unitPrice != null
                  ? `₹${item.unitPrice}/${item.priceUnit ?? 'kg'}`
                  : null;

              return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleBlock}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {chemical ? (
                      <Text style={styles.chemicalName} numberOfLines={2}>
                        {chemical}
                      </Text>
                    ) : null}
                    {doseText || priceText ? (
                      <Text style={styles.summaryLine} numberOfLines={2}>
                        {[doseText, priceText].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable onPress={() => remove(item.id)}>
                    <Text style={styles.removeText}>{t('schedule.delete')}</Text>
                  </Pressable>
                </View>

                <Text style={styles.fieldLabel}>{t('home.dosePerLiter')}</Text>
                <View style={styles.row}>
                  <TextInput
                    value={item.dosePerLiter != null ? String(item.dosePerLiter) : ''}
                    onChangeText={(v) =>
                      upsert({
                        ...item,
                        dosePerLiter: v === '' ? undefined : Number(v) || undefined,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="2"
                    placeholderTextColor={TEXT_SECONDARY}
                    style={styles.input}
                  />
                  <View style={styles.unitRow}>
                    {DOSE_UNITS.map((unit) => {
                      const active = (item.doseUnit ?? 'g') === unit;
                      return (
                        <Pressable
                          key={unit}
                          onPress={() => upsert({ ...item, doseUnit: unit })}
                          style={[styles.unitChip, active && styles.unitChipActive]}>
                          <Text style={[styles.unitChipText, active && styles.unitChipTextActive]}>
                            {unit}/L
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Text style={styles.fieldLabel}>{t('expenses.unitPrice')}</Text>
                <View style={styles.row}>
                  <Text style={styles.rupee}>₹</Text>
                  <TextInput
                    value={item.unitPrice != null ? String(item.unitPrice) : ''}
                    onChangeText={(v) =>
                      upsert({
                        ...item,
                        unitPrice: v === '' ? undefined : Number(v) || undefined,
                      })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={TEXT_SECONDARY}
                    style={[styles.input, styles.flex]}
                  />
                  <Text style={styles.perUnit}>/{item.priceUnit ?? 'kg'}</Text>
                </View>

                <Text style={styles.fieldLabel}>{t('expenses.stockQty')}</Text>
                <TextInput
                  value={item.stockQuantity != null ? String(item.stockQuantity) : ''}
                  onChangeText={(v) =>
                    upsert({
                      ...item,
                      stockQuantity: v === '' ? undefined : Number(v) || undefined,
                    })
                  }
                  keyboardType="numeric"
                  placeholder={t('expenses.stockQtyHint')}
                  placeholderTextColor={TEXT_SECONDARY}
                  style={styles.input}
                />
              </View>
            );
            })
          )}
        </ScrollView>
        </>
        )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PAGE_BG },
  container: { flex: 1, backgroundColor: PAGE_BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  title: { fontSize: 20, fontWeight: '800', color: TEXT, flex: 1 },
  closeBtn: { fontSize: 22, color: TEXT_SECONDARY, padding: Spacing.one },
  mainTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
  },
  mainTabActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  mainTabText: { fontSize: 13, fontWeight: '700', color: TEXT },
  mainTabTextActive: { color: '#FFFFFF' },
  workerPanel: { flex: 1, paddingHorizontal: Spacing.three },
  subtitle: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    lineHeight: 18,
  },
  groupTabs: { paddingHorizontal: Spacing.three, gap: 8, paddingBottom: Spacing.two },
  groupTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  groupTabActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  groupTabText: { fontSize: 12, fontWeight: '700', color: TEXT, maxWidth: 120 },
  groupTabTextActive: { color: '#FFFFFF' },
  toolbar: { paddingHorizontal: Spacing.three, marginBottom: Spacing.two },
  importBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  importBtnText: { fontSize: 13, fontWeight: '700', color: '#166534' },
  suggestBlock: { paddingHorizontal: Spacing.three, marginBottom: Spacing.two, gap: 6 },
  suggestLabel: { fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    maxWidth: '48%',
  },
  chipText: { fontSize: 11, fontWeight: '600', color: TEXT },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
    color: TEXT,
    backgroundColor: INPUT_BG,
  },
  addBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  list: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 40 },
  empty: { textAlign: 'center', color: TEXT_MUTED, marginTop: Spacing.four, fontSize: 14 },
  card: {
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  cardTitleBlock: { flex: 1, gap: 2 },
  productName: { fontSize: 16, fontWeight: '800', color: TEXT },
  chemicalName: { fontSize: 11, fontWeight: '500', color: TEXT_MUTED, fontStyle: 'italic', lineHeight: 15 },
  summaryLine: { fontSize: 12, fontWeight: '600', color: ACCENT, marginTop: 2 },
  removeText: { fontSize: 13, color: '#DC2626', fontWeight: '700' },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    backgroundColor: INPUT_BG,
    minWidth: 80,
  },
  flex: { flex: 1 },
  unitRow: { flexDirection: 'row', gap: 4, flex: 1, flexWrap: 'wrap' },
  unitChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#F3F4F6',
  },
  unitChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  unitChipText: { fontSize: 11, fontWeight: '700', color: TEXT_SECONDARY },
  unitChipTextActive: { color: '#FFFFFF' },
  rupee: { fontSize: 16, fontWeight: '800', color: TEXT },
  perUnit: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY, minWidth: 32 },
});
