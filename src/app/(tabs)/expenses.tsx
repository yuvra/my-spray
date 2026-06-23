import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ExpenseCharts } from '@/components/ExpenseCharts';
import { Button, Card, Input } from '@/components/ui/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COST_CATALOG, CROPS } from '@/data/crop-schedules';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useExpenseStore } from '@/stores/useExpenseStore';
import type { CropType } from '@/types';

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const selectedCrop = useExpenseStore((s) => s.selectedCrop);
  const lineItems = useExpenseStore((s) => s.lineItems);
  const labourCost = useExpenseStore((s) => s.labourCost);
  const acres = useExpenseStore((s) => s.acres);
  const setSelectedCrop = useExpenseStore((s) => s.setSelectedCrop);
  const setLabourCost = useExpenseStore((s) => s.setLabourCost);
  const setAcres = useExpenseStore((s) => s.setAcres);
  const addLineItem = useExpenseStore((s) => s.addLineItem);
  const updateLineItem = useExpenseStore((s) => s.updateLineItem);
  const removeLineItem = useExpenseStore((s) => s.removeLineItem);
  const reset = useExpenseStore((s) => s.reset);
  const getGrandTotal = useExpenseStore((s) => s.getGrandTotal);

  const products = COST_CATALOG.filter((c) => c.category !== 'labour');

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="smallBold">{t('expenses.selectCrop')}</ThemedText>
        <View style={styles.chips}>
          {CROPS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setSelectedCrop(c as CropType)}
              style={[styles.chip, selectedCrop === c && styles.chipActive]}>
              <ThemedText type="small">{t(`crops.${c}`)}</ThemedText>
            </Pressable>
          ))}
        </View>

        <Input
          label={t('expenses.acres')}
          keyboardType="numeric"
          value={String(acres)}
          onChangeText={(v) => setAcres(Number(v) || 1)}
        />
        <Input
          label={t('expenses.labourCost')}
          keyboardType="numeric"
          value={String(labourCost)}
          onChangeText={(v) => setLabourCost(Number(v) || 0)}
        />

        <ThemedText type="smallBold">{t('expenses.addItem')}</ThemedText>
        {products.map((item) => {
          const existing = lineItems.find((l) => l.catalogId === item.id);
          return (
            <Card key={item.id}>
              <ThemedText type="smallBold">{item.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                ₹{item.unitPrice}/{item.unit} — {t(`expenses.${item.category}`)}
              </ThemedText>
              <View style={styles.row}>
                <Input
                  label={t('expenses.qty')}
                  keyboardType="numeric"
                  value={String(existing?.quantity ?? 0)}
                  onChangeText={(v) => {
                    const qty = Number(v) || 0;
                    if (qty === 0) {
                      removeLineItem(item.id);
                    } else if (existing) {
                      updateLineItem(item.id, qty);
                    } else {
                      addLineItem({
                        catalogId: item.id,
                        name: item.name,
                        category: item.category,
                        quantity: qty,
                        unitPrice: item.unitPrice,
                        unit: item.unit,
                      });
                    }
                  }}
                  style={styles.qtyInput}
                />
              </View>
            </Card>
          );
        })}

        <Card>
          <ThemedText type="smallBold">
            {t('expenses.total')}: ₹{getGrandTotal().toLocaleString()}
          </ThemedText>
        </Card>

        <ExpenseCharts />

        <Button title={t('expenses.reset')} onPress={reset} variant="secondary" />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.three, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, backgroundColor: '#FCE4E0', borderRadius: Spacing.two },
  chipActive: { backgroundColor: '#9B1B3033' },
  row: { flexDirection: 'row', gap: Spacing.two },
  qtyInput: { flex: 1 },
});
