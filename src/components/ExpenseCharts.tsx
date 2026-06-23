import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useScheduleStore } from '@/stores/useScheduleStore';
import {
  getActivityExpenseTotal,
  getDailyActivityExpenses,
  getDailyWorkerExpenses,
  getDailyWorkerStackedExpenses,
  getWorkerExpenseTotal,
  getWorkerExpenseTotalForWorker,
  getWorkerNamesFromLogs,
  workerBarColor,
} from '@/utils/expense-analytics';

type SpendView = 'total' | 'worker';

function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function SpendToggle({
  spendView,
  onChange,
}: {
  spendView: SpendView;
  onChange: (view: SpendView) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={[styles.toggleWrap, { backgroundColor: theme.backgroundSelected }]}>
      <Pressable
        onPress={() => onChange('total')}
        style={[
          styles.toggleChip,
          spendView === 'total' && { backgroundColor: theme.card },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: spendView === 'total' }}>
        <Text
          style={[
            styles.toggleLabel,
            { color: spendView === 'total' ? theme.text : theme.textSecondary },
          ]}>
          {t('expenses.spendViewTotal')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('worker')}
        style={[
          styles.toggleChip,
          spendView === 'worker' && { backgroundColor: theme.card },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: spendView === 'worker' }}>
        <Text
          style={[
            styles.toggleLabel,
            { color: spendView === 'worker' ? theme.text : theme.textSecondary },
          ]}>
          {t('expenses.spendViewWorker')}
        </Text>
      </Pressable>
    </View>
  );
}

function BarTopLabel({ value, color }: { value: number; color: string }) {
  return (
    <Text style={[styles.barTopLabel, { color }]} numberOfLines={1}>
      {formatInr(value)}
    </Text>
  );
}

function WorkerFilterChips({
  workers,
  selected,
  onSelect,
}: {
  workers: string[];
  selected: string | null;
  onSelect: (name: string | null) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (workers.length === 0) return null;

  return (
    <View style={styles.filterBlock}>
      <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>
        {t('expenses.filterByWorker')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Pressable
          onPress={() => onSelect(null)}
          style={[
            styles.filterChip,
            { borderColor: theme.border, backgroundColor: theme.backgroundElement },
            selected === null && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}>
          <Text
            style={[
              styles.filterChipText,
              { color: theme.text },
              selected === null && styles.filterChipTextActive,
            ]}>
            {t('expenses.filterAllWorkers')}
          </Text>
        </Pressable>
        {workers.map((name, index) => {
          const active = selected === name;
          const color = workerBarColor(index);
          return (
            <Pressable
              key={name}
              onPress={() => onSelect(name)}
              style={[
                styles.filterChip,
                { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                active && { backgroundColor: color, borderColor: color },
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  { color: theme.text },
                  active && styles.filterChipTextActive,
                ]}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function ExpenseCharts() {
  const { t } = useTranslation();
  const theme = useTheme();
  const farmActivityLogs = useScheduleStore((s) => s.farmActivityLogs);
  const [spendView, setSpendView] = useState<SpendView>('total');
  const [workerFilter, setWorkerFilter] = useState<string | null>(null);

  const totalAmount = useMemo(() => getActivityExpenseTotal(farmActivityLogs), [farmActivityLogs]);
  const workerAmount = useMemo(() => getWorkerExpenseTotal(farmActivityLogs), [farmActivityLogs]);
  const workerNames = useMemo(() => getWorkerNamesFromLogs(farmActivityLogs), [farmActivityLogs]);

  const filteredWorkerAmount = useMemo(() => {
    if (!workerFilter) return workerAmount;
    return getWorkerExpenseTotalForWorker(farmActivityLogs, workerFilter);
  }, [farmActivityLogs, workerFilter, workerAmount]);

  const dailyRows = useMemo(
    () => getDailyActivityExpenses(farmActivityLogs, 'total'),
    [farmActivityLogs],
  );

  const dailyWorkerRows = useMemo(
    () => getDailyWorkerExpenses(farmActivityLogs, workerFilter),
    [farmActivityLogs, workerFilter],
  );

  const dailyWorkerStacked = useMemo(
    () => (workerFilter ? [] : getDailyWorkerStackedExpenses(farmActivityLogs)),
    [farmActivityLogs, workerFilter],
  );

  const dailyPointCount = workerFilter ? dailyWorkerRows.length : dailyWorkerStacked.length;
  const dailyChartWidth = Math.max(dailyPointCount * 48 + 48, 260);

  const displayedAmount = spendView === 'worker' ? filteredWorkerAmount : totalAmount;
  const amountLabel =
    spendView === 'worker' ? t('expenses.workerSpendTotal') : t('expenses.totalSpend');

  const filteredWorkerColor = workerFilter
    ? workerBarColor(Math.max(0, workerNames.indexOf(workerFilter)))
    : theme.primary;

  const hasWorkerDailyData = workerFilter
    ? dailyWorkerRows.length > 0
    : dailyWorkerStacked.length > 0;

  const handleSpendViewChange = (view: SpendView) => {
    setSpendView(view);
    if (view === 'total') setWorkerFilter(null);
  };

  const axisStyle = { color: theme.textSecondary, fontSize: 10 as const };

  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.cardHeader}>
          <ThemedText type="smallBold">{amountLabel}</ThemedText>
          <SpendToggle spendView={spendView} onChange={handleSpendViewChange} />
        </View>
        <ThemedText type="title" style={styles.totalAmount}>
          {formatInr(displayedAmount)}
        </ThemedText>
        {spendView === 'worker' && workerFilter ? (
          <Text style={[styles.filterHint, { color: theme.primaryLight }]}>
            {t('expenses.filteredWorker', { name: workerFilter })}
          </Text>
        ) : null}
        <View style={styles.summaryRow}>
          <ThemedText themeColor="textSecondary" style={styles.summaryLine}>
            {t('expenses.totalSpend')}: {formatInr(totalAmount)}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.summaryLine}>
            {t('expenses.workerSpendTotal')}: {formatInr(workerAmount)}
          </ThemedText>
        </View>
      </Card>

      {spendView === 'worker' ? (
        <Card>
          <ThemedText type="smallBold">{t('expenses.dailyWorkerSpend')}</ThemedText>
          <WorkerFilterChips
            workers={workerNames}
            selected={workerFilter}
            onSelect={setWorkerFilter}
          />
          {hasWorkerDailyData ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                {workerFilter ? (
                  <BarChart
                    data={dailyWorkerRows.map((d) => ({
                      value: d.value,
                      label: d.label,
                      frontColor: filteredWorkerColor,
                      topLabelComponent: () => (
                        <BarTopLabel value={d.value} color={filteredWorkerColor} />
                      ),
                    }))}
                    barWidth={28}
                    spacing={14}
                    roundedTop
                    hideRules
                    yAxisLabelPrefix="₹"
                    formatYLabel={(v) => Math.round(Number(v)).toLocaleString('en-IN')}
                    yAxisTextStyle={axisStyle}
                    xAxisLabelTextStyle={{ ...axisStyle, fontWeight: '600' }}
                    noOfSections={4}
                    maxValue={Math.max(...dailyWorkerRows.map((d) => d.value), 1) * 1.2}
                    width={dailyChartWidth}
                    height={220}
                    initialSpacing={12}
                    endSpacing={12}
                    xAxisThickness={0}
                    yAxisThickness={0}
                  />
                ) : (
                  <BarChart
                    stackData={dailyWorkerStacked.map((day) => ({
                      label: day.label,
                      stacks: day.stacks.map((s, i) => ({
                        value: s.value,
                        color: s.color,
                        marginBottom: i < day.stacks.length - 1 ? 2 : 0,
                      })),
                    }))}
                    barWidth={28}
                    spacing={14}
                    roundedTop
                    hideRules
                    yAxisLabelPrefix="₹"
                    formatYLabel={(v) => Math.round(Number(v)).toLocaleString('en-IN')}
                    yAxisTextStyle={axisStyle}
                    xAxisLabelTextStyle={axisStyle}
                    noOfSections={4}
                    maxValue={Math.max(...dailyWorkerStacked.map((d) => d.total), 1) * 1.2}
                    width={dailyChartWidth}
                    height={220}
                    initialSpacing={12}
                    endSpacing={12}
                    xAxisThickness={0}
                    yAxisThickness={0}
                  />
                )}
              </ScrollView>
              {!workerFilter ? (
                <View style={[styles.legend, { borderTopColor: theme.border }]}>
                  {workerNames.map((name, index) => (
                    <View key={name} style={styles.legendItem}>
                      <View
                        style={[styles.legendDot, { backgroundColor: workerBarColor(index) }]}
                      />
                      <ThemedText type="smallBold" style={styles.legendName}>
                        {name}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {t('expenses.noWorkerSpendYet')}
            </ThemedText>
          )}
        </Card>
      ) : (
        <Card>
          <ThemedText type="smallBold">{t('expenses.dailySpend')}</ThemedText>
          {dailyRows.length > 0 ? (
            <BarChart
              data={dailyRows.map((d) => ({
                value: d.value,
                label: d.label,
                frontColor: theme.primary,
              }))}
              barWidth={28}
              spacing={12}
              roundedTop
              hideRules
              yAxisLabelPrefix="₹"
              formatYLabel={(v) => Math.round(Number(v)).toLocaleString('en-IN')}
              yAxisTextStyle={axisStyle}
              xAxisLabelTextStyle={axisStyle}
              noOfSections={4}
              maxValue={Math.max(...dailyRows.map((d) => d.value), 1) * 1.2}
            />
          ) : (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {t('expenses.noSpendYet')}
            </ThemedText>
          )}
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  toggleWrap: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 52,
    alignItems: 'center',
  },
  toggleLabel: { fontSize: 11, fontWeight: '700' },
  totalAmount: { marginTop: Spacing.one },
  filterHint: { marginTop: 4, fontSize: 12, fontWeight: '600' },
  summaryRow: { marginTop: Spacing.two, gap: 4 },
  summaryLine: { fontSize: 13 },
  filterBlock: { marginTop: Spacing.two, gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: '700' },
  filterRow: { gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
  chartScroll: { marginTop: Spacing.two },
  barTopLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  legend: {
    marginTop: Spacing.three,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1 },
  empty: { marginTop: Spacing.two },
});
