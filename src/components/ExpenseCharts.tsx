import { StyleSheet, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { useScheduleStore } from '@/stores/useScheduleStore';

export function ExpenseCharts() {
  const { t } = useTranslation();
  const theme = useTheme();
  const getCategoryTotal = useExpenseStore((s) => s.getCategoryTotal);
  const getGrandTotal = useExpenseStore((s) => s.getGrandTotal);
  const sprayLogs = useScheduleStore((s) => s.sprayLogs);
  const fertilizerLogs = useScheduleStore((s) => s.fertilizerLogs);

  const categories = [
    { key: 'insecticide', color: theme.chart1 },
    { key: 'fungicide', color: theme.chart2 },
    { key: 'fertilizer', color: theme.chart3 },
    { key: 'labour', color: theme.chart4 },
  ] as const;

  const barData = categories.map((c) => ({
    value: getCategoryTotal(c.key),
    label: t(`expenses.${c.key}`).slice(0, 6),
    frontColor: c.color,
  }));

  const pieData = categories
    .map((c) => ({ value: getCategoryTotal(c.key), color: c.color, text: t(`expenses.${c.key}`) }))
    .filter((d) => d.value > 0);

  const allLogs = [...sprayLogs, ...fertilizerLogs].sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;
  const lineData = allLogs.map((log) => {
    cumulative += 'cost' in log ? log.cost : 0;
    return { value: cumulative, label: log.date.slice(5) };
  });

  const total = getGrandTotal();

  return (
    <View style={styles.container}>
      <Card>
        <ThemedText type="smallBold">{t('expenses.total')}: ₹{total.toLocaleString()}</ThemedText>
      </Card>

      <Card>
        <ThemedText type="smallBold">{t('expenses.breakdown')}</ThemedText>
        {barData.some((d) => d.value > 0) ? (
          <BarChart
            data={barData}
            barWidth={32}
            spacing={16}
            roundedTop
            hideRules
            yAxisTextStyle={{ color: theme.textSecondary }}
            xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
            noOfSections={4}
          />
        ) : (
          <ThemedText themeColor="textSecondary">{t('schedule.noLogs')}</ThemedText>
        )}
      </Card>

      {pieData.length > 0 && (
        <Card style={styles.center}>
          <PieChart data={pieData} donut radius={90} innerRadius={50} showText />
        </Card>
      )}

      {lineData.length > 1 && (
        <Card>
          <ThemedText type="smallBold">{t('expenses.cumulativeSpend')}</ThemedText>
          <LineChart
            data={lineData}
            color={theme.primary}
            thickness={2}
            hideRules
            yAxisTextStyle={{ color: theme.textSecondary }}
            xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
          />
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  center: { alignItems: 'center' },
});
