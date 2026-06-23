import { Pressable, StyleSheet, View } from 'react-native';
import {
  addMonths,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey, getMonthDays } from '@/utils/farm-logs';

type Props = {
  month: Date;
  selectedDate: Date;
  activeDates: Set<string>;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  onClose?: () => void;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const GREEN = '#3D6B35';

export function MonthCalendar({
  month,
  selectedDate,
  activeDates,
  onMonthChange,
  onSelectDate,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const days = getMonthDays(month);
  const leadingBlanks = getDay(startOfMonth(month));

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Pressable onPress={() => onMonthChange(subMonths(month, 1))} hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: GREEN }}>
            ‹
          </ThemedText>
        </Pressable>
        <ThemedText type="smallBold">{format(month, 'MMMM yyyy')}</ThemedText>
        <Pressable onPress={() => onMonthChange(addMonths(month, 1))} hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: GREEN }}>
            ›
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => (
          <ThemedText key={day} type="small" themeColor="textSecondary" style={styles.weekday}>
            {day}
          </ThemedText>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.cell} />
        ))}
        {days.map((day) => {
          const key = formatDateKey(day);
          const selected = isSameDay(day, selectedDate);
          const inMonth = isSameMonth(day, month);
          const hasActivity = activeDates.has(key);
          const isToday = isSameDay(day, new Date());

          return (
            <Pressable
              key={key}
              onPress={() => {
                onSelectDate(day);
                onClose?.();
              }}
              style={[
                styles.cell,
                selected && { backgroundColor: GREEN, borderRadius: 10 },
                isToday && !selected && { borderWidth: 1, borderColor: GREEN, borderRadius: 10 },
              ]}>
              <ThemedText
                type="small"
                style={{
                  color: selected ? '#FFFFFF' : inMonth ? theme.text : theme.textSecondary,
                  fontWeight: selected || isToday ? '700' : '500',
                }}>
                {format(day, 'd')}
              </ThemedText>
              {hasActivity && (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: selected ? '#FFFFFF' : GREEN },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        {t('home.selectedDate', { date: format(selectedDate, 'd MMM yyyy') })}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
  },
});
