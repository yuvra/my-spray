import { useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ExpenseCharts } from '@/components/ExpenseCharts';
import { ProductInventorySettings } from '@/components/expenses/ProductInventorySettings';
import { SettingsIcon } from '@/components/icons/AppIcons';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useProductInventoryStore } from '@/stores/useProductInventoryStore';
import { useWorkerStore } from '@/stores/useWorkerStore';

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const [showInventory, setShowInventory] = useState(false);
  const seedKrushiSarthiDefaults = useProductInventoryStore((s) => s.seedKrushiSarthiDefaults);
  const seedDefaultWorkers = useWorkerStore((s) => s.seedDefaultWorkers);

  useLayoutEffect(() => {
    seedKrushiSarthiDefaults();
    seedDefaultWorkers();
  }, [seedKrushiSarthiDefaults, seedDefaultWorkers]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setShowInventory(true)}
          style={styles.settingsBtn}
          accessibilityLabel={t('expenses.settingsTitle')}
          hitSlop={12}>
          <SettingsIcon size={22} color={theme.primary} />
        </Pressable>
      ),
    });
  }, [navigation, theme.primary, t]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ExpenseCharts />
      </ScrollView>

      <ProductInventorySettings visible={showInventory} onClose={() => setShowInventory(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.three, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
  settingsBtn: { marginRight: Spacing.two, padding: 4 },
});
