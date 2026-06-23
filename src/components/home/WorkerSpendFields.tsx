import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Spacing } from '@/constants/theme';
import { getWorkerNames, useWorkerStore } from '@/stores/useWorkerStore';

const TEXT = '#1F2937';
const TEXT_SECONDARY = '#4B5563';
const TEXT_MUTED = '#6B7280';
const INPUT_BG = '#FFFFFF';
const BORDER = '#D1D5DB';
const ACCENT = '#7C3AED';

type Props = {
  workName: string;
  onWorkNameChange: (value: string) => void;
  selectedWorker: string;
  onSelectedWorkerChange: (value: string) => void;
  customWorker: string;
  onCustomWorkerChange: (value: string) => void;
  workerSpend: string;
  onWorkerSpendChange: (value: string) => void;
};

function FieldInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'numeric' | 'default';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={TEXT_MUTED}
      keyboardType={keyboardType}
      style={styles.field}
      keyboardAppearance="light"
    />
  );
}

export function resolveWorkerName(selectedWorker: string, customWorker: string): string {
  if (selectedWorker === 'Other') return customWorker.trim();
  return selectedWorker.trim();
}

export function WorkerSpendFields({
  workName,
  onWorkNameChange,
  selectedWorker,
  onSelectedWorkerChange,
  customWorker,
  onCustomWorkerChange,
  workerSpend,
  onWorkerSpendChange,
}: Props) {
  const { t } = useTranslation();
  const workers = useWorkerStore((s) => s.workers);
  const workerNames = useMemo(() => getWorkerNames(workers), [workers]);
  const options = useMemo(
    () => (workerNames.length ? [...workerNames, 'Other'] : ['Other']),
    [workerNames],
  );
  const showCustomWorker = selectedWorker === 'Other';

  return (
    <View style={styles.wrap}>
      <FieldInput
        value={workName}
        onChangeText={onWorkNameChange}
        placeholder={t('home.workNamePlaceholder')}
      />

      <Text style={styles.blockLabel}>{t('home.selectWorker')}</Text>
      <View style={styles.chipsRow}>
        {options.map((name) => {
          const selected = selectedWorker === name;
          return (
            <Pressable
              key={name}
              onPress={() => {
                onSelectedWorkerChange(name);
                if (name !== 'Other') onCustomWorkerChange('');
              }}
              style={[styles.chip, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>

      {showCustomWorker ? (
        <FieldInput
          value={customWorker}
          onChangeText={onCustomWorkerChange}
          placeholder={t('home.customWorkerPlaceholder')}
        />
      ) : null}

      <View style={styles.costRow}>
        <View style={styles.currencyBox}>
          <Text style={styles.currencyText}>INR</Text>
        </View>
        <FieldInput
          value={workerSpend}
          onChangeText={onWorkerSpendChange}
          placeholder={t('home.workerSpendPlaceholder')}
          keyboardType="numeric"
        />
      </View>

      {workerNames.length === 0 ? (
        <Text style={styles.hint}>{t('home.addWorkersInExpenses')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  field: {
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT,
  },
  blockLabel: { fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: INPUT_BG,
  },
  chipSelected: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipText: { fontSize: 13, fontWeight: '600', color: TEXT },
  chipTextSelected: { color: '#FFFFFF' },
  costRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  currencyBox: {
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  currencyText: { fontSize: 14, fontWeight: '700', color: TEXT },
  hint: { fontSize: 12, color: TEXT_SECONDARY, fontStyle: 'italic', lineHeight: 18 },
});
