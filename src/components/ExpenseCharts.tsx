import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { getActivityExpenseTotal, getDailyActivityExpenses } from '@/utils/expense-analytics';

function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function ExpenseCharts() {
  const { t } = useTranslation();
  const theme = useTheme();
  const farmActivityLogs = useScheduleStore((s) => s.farmActivityLogs);

  const dailyRows = getDailyActivityExpenses(farmActivityLogs);
  const dailyActivityData = dailyRows.map((d) => ({
    value: d.value,
    label: d.label,
    frontColor: theme.primary,
  }));

  const activityTotal = getActivityExpenseTotal(farmActivityLogs);

  return (
    <View style={styles.container}>
      <Card>
        <ThemedText type="smallBold">{t('expenses.totalSpend')}</ThemedText>
        <ThemedText type="title" style={styles.totalAmount}>
          {formatInr(activityTotal)}
        </ThemedText>
      </Card>

      <Card>
        <ThemedText type="smallBold">{t('expenses.dailySpend')}</ThemedText>
        {dailyActivityData.length > 0 ? (
          <BarChart
            data={dailyActivityData}
            barWidth={28}
            spacing={12}
            roundedTop
            hideRules
            yAxisLabelPrefix="₹"
            formatYLabel={(v) => Math.round(Number(v)).toLocaleString('en-IN')}
            yAxisTextStyle={{ color: theme.textSecondary }}
            xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
            noOfSections={4}
            maxValue={Math.max(...dailyRows.map((d) => d.value), 1) * 1.2}
          />
        ) : (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            {t('expenses.noSpendYet')}
          </ThemedText>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  totalAmount: { marginTop: Spacing.one },
  empty: { marginTop: Spacing.two },
});
