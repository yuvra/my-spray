import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { resolveProducts } from '@/constants/farm-activities';
import { Spacing } from '@/constants/theme';
import { lookupProductChemical } from '@/data/krushi-sarthi-seed';
import { useProductInventoryStore } from '@/stores/useProductInventoryStore';
import { computeLineCost } from '@/utils/product-usage';

const TEXT = '#111827';
const TEXT_SECONDARY = '#374151';
const TEXT_MUTED = '#6B7280';
const INPUT_BG = '#FFFFFF';
const BORDER = '#D1D5DB';

type Props = {
  group: string;
  label: string;
  hint: string;
  accentColor: string;
  products: readonly string[];
  selected: string[];
  onToggle: (product: string) => void;
  customValue: string;
  onCustomChange: (value: string) => void;
  customPlaceholder: string;
  waterLiters: string;
};

function FieldInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={TEXT_MUTED}
      style={styles.field}
      keyboardAppearance="light"
    />
  );
}

function ProductMeta({
  brand,
  chemical,
  doseText,
  priceText,
  selected,
  accentColor,
}: {
  brand: string;
  chemical?: string;
  doseText?: string | null;
  priceText?: string | null;
  selected: boolean;
  accentColor: string;
}) {
  return (
    <View style={styles.chipContent}>
      <Text
        style={[styles.productChipText, selected && styles.productChipTextSelected]}
        numberOfLines={2}>
        {brand}
      </Text>
      {chemical ? (
        <Text
          style={[styles.chipChemical, selected && styles.chipChemicalSelected]}
          numberOfLines={2}>
          {chemical}
        </Text>
      ) : null}
      {doseText || priceText ? (
        <Text style={[styles.chipMeta, selected && styles.chipMetaSelected, !selected && { color: accentColor }]}>
          {[doseText, priceText].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}

export function ProductUsagePicker({
  group,
  label,
  hint,
  accentColor,
  products,
  selected,
  onToggle,
  customValue,
  onCustomChange,
  customPlaceholder,
  waterLiters,
}: Props) {
  const { t } = useTranslation();
  const getItem = useProductInventoryStore((s) => s.getItem);
  const resolved = resolveProducts(selected, customValue);
  const waterNum = Number(waterLiters) || 0;

  return (
    <View style={[styles.detailBlock, { borderLeftColor: accentColor }]}>
      <View style={styles.detailBlockHeader}>
        <Text style={styles.productSectionLabel}>{label}</Text>
        {resolved.length > 0 ? (
          <View style={[styles.countBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.countBadgeText}>{resolved.length}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.productHint}>{hint}</Text>
      <Text style={styles.doseHint}>{t('expenses.useSavedProductRates')}</Text>

      {products.length === 0 ? (
        <Text style={styles.emptyHint}>{t('expenses.configureProductsHint')}</Text>
      ) : (
        <View style={styles.productList}>
          {products.map((name) => {
            const isSelected = selected.includes(name);
            const inv = getItem(group, name);
            const chemical = inv?.chemical ?? lookupProductChemical(name, group);
            const doseText =
              inv?.dosePerLiter != null ? `${inv.dosePerLiter}${inv.doseUnit ?? 'g'}/L` : null;
            const priceText =
              inv?.unitPrice != null ? `₹${inv.unitPrice}/${inv.priceUnit ?? 'kg'}` : null;

            return (
              <Pressable
                key={name}
                onPress={() => onToggle(name)}
                style={[
                  styles.productChip,
                  isSelected && [styles.productChipSelected, { borderColor: accentColor, backgroundColor: accentColor }],
                ]}>
                {isSelected ? <Text style={styles.chipCheck}>✓</Text> : null}
                <ProductMeta
                  brand={name}
                  chemical={chemical}
                  doseText={doseText}
                  priceText={priceText}
                  selected={isSelected}
                  accentColor={accentColor}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      {selected.includes('Other') && (
        <FieldInput value={customValue} onChangeText={onCustomChange} placeholder={customPlaceholder} />
      )}

      {resolved.map((name) => {
        const inv = getItem(group, name);
        const chemical = inv?.chemical ?? lookupProductChemical(name, group);
        const dose = inv?.dosePerLiter ?? 0;
        const price = inv?.unitPrice ?? 0;
        const lineCost =
          dose > 0 && price > 0
            ? computeLineCost(dose, inv?.doseUnit ?? 'g', waterNum, price, inv?.priceUnit ?? 'kg')
            : 0;

        return (
          <View key={name} style={styles.usageRow}>
            <Text style={styles.usageProductName} numberOfLines={2}>
              {name}
            </Text>
            {chemical ? (
              <Text style={styles.usageChemical} numberOfLines={2}>
                {chemical}
              </Text>
            ) : null}
            {inv ? (
              <Text style={styles.savedRates}>
                {inv.dosePerLiter
                  ? `${inv.dosePerLiter}${inv.doseUnit ?? 'g'}/L`
                  : t('expenses.doseNotSet')}
                {inv.unitPrice ? ` · ₹${inv.unitPrice}/${inv.priceUnit ?? 'kg'}` : ` · ${t('expenses.priceNotSet')}`}
              </Text>
            ) : (
              <Text style={styles.missingRates}>{t('expenses.productNotInInventory')}</Text>
            )}
            {lineCost > 0 ? (
              <Text style={[styles.lineCost, { color: accentColor }]}>
                {t('home.lineCost')}: ₹{Math.round(lineCost).toLocaleString('en-IN')}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  detailBlock: {
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  detailBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  productSectionLabel: { fontSize: 15, fontWeight: '800', color: TEXT, flex: 1 },
  productHint: { fontSize: 12, fontWeight: '500', color: TEXT_SECONDARY },
  doseHint: { fontSize: 11, color: TEXT_MUTED, fontStyle: 'italic' },
  emptyHint: { fontSize: 12, color: '#B45309', fontWeight: '700' },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  productList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#F9FAFB',
    maxWidth: '48%',
  },
  productChipSelected: {},
  chipCheck: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginTop: 2 },
  chipContent: { flexShrink: 1, gap: 1 },
  productChipText: { fontSize: 12, fontWeight: '700', color: TEXT },
  productChipTextSelected: { color: '#FFFFFF', fontWeight: '800' },
  chipChemical: { fontSize: 10, fontWeight: '500', color: TEXT_MUTED, fontStyle: 'italic', lineHeight: 13 },
  chipChemicalSelected: { color: '#FFFFFFDD' },
  chipMeta: { fontSize: 10, fontWeight: '700', color: TEXT_SECONDARY, marginTop: 2 },
  chipMetaSelected: { color: '#FFFFFF' },
  usageRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    paddingTop: Spacing.two,
    gap: 2,
  },
  usageProductName: { fontSize: 14, fontWeight: '800', color: TEXT },
  usageChemical: { fontSize: 11, fontWeight: '500', color: TEXT_MUTED, fontStyle: 'italic' },
  savedRates: { fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY },
  missingRates: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  field: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
    backgroundColor: INPUT_BG,
  },
  lineCost: { fontSize: 12, fontWeight: '800', marginTop: 2 },
});
