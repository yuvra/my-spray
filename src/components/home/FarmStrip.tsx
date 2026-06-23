import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CalendarIcon } from '@/components/icons/AppIcons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Farm } from '@/types';

type Props = {
  farms: Farm[];
  selectedFarmId: string | null;
  onSelect: (farmId: string) => void;
  onOpenCalendar: () => void;
};

const GREEN = '#3D6B35';

export function FarmStrip({ farms, selectedFarmId, onSelect, onOpenCalendar }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (farms.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <ThemedText type="smallBold" style={styles.title}>
          {t('home.myFarms')}
        </ThemedText>
        <Pressable
          onPress={onOpenCalendar}
          hitSlop={10}
          style={[styles.calBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
          accessibilityLabel={t('home.openCalendar')}
          accessibilityRole="button">
          <CalendarIcon color={GREEN} size={22} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {farms.map((farm) => {
          const selected = farm.id === selectedFarmId;
          return (
            <Pressable
              key={farm.id}
              onPress={() => onSelect(farm.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? GREEN : theme.backgroundElement,
                  borderColor: selected ? GREEN : theme.border,
                },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: selected ? '#FFFFFF' : theme.text }}
                numberOfLines={1}>
                {farm.name}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: selected ? 'rgba(255,255,255,0.9)' : theme.textSecondary }}
                numberOfLines={1}>
                {t(`crops.${farm.crop}`)}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  title: { flex: 1 },
  calBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
    paddingBottom: Spacing.one,
  },
  chip: {
    minWidth: 120,
    maxWidth: 160,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
});
