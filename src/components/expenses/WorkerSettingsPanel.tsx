import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Spacing } from '@/constants/theme';
import { useWorkerStore } from '@/stores/useWorkerStore';

const TEXT = '#111827';
const TEXT_SECONDARY = '#374151';
const TEXT_MUTED = '#6B7280';
const BORDER = '#D1D5DB';
const ACCENT = '#3D6B35';

export function WorkerSettingsPanel() {
  const { t } = useTranslation();
  const workers = useWorkerStore((s) => s.workers);
  const addWorker = useWorkerStore((s) => s.addWorker);
  const removeWorker = useWorkerStore((s) => s.removeWorker);
  const [customName, setCustomName] = useState('');

  const handleAdd = () => {
    if (!customName.trim()) return;
    addWorker(customName);
    setCustomName('');
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.subtitle}>{t('expenses.workerSettingsHint')}</Text>

      <View style={styles.addRow}>
        <TextInput
          value={customName}
          onChangeText={setCustomName}
          placeholder={t('expenses.addWorkerName')}
          placeholderTextColor={TEXT_MUTED}
          style={styles.input}
          keyboardAppearance="light"
          onSubmitEditing={handleAdd}
        />
        <Pressable onPress={handleAdd} style={styles.addBtn}>
          <Text style={styles.addBtnText}>{t('expenses.add')}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {workers.length === 0 ? (
          <Text style={styles.empty}>{t('expenses.noWorkersConfigured')}</Text>
        ) : (
          workers.map((worker) => (
            <View key={worker.id} style={styles.row}>
              <Text style={styles.workerName}>{worker.name}</Text>
              <Pressable onPress={() => removeWorker(worker.id)} hitSlop={8}>
                <Text style={styles.removeBtn}>{t('schedule.delete')}</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: Spacing.two },
  subtitle: { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 20 },
  addRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: TEXT,
    backgroundColor: '#FFFFFF',
  },
  addBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  list: { flex: 1 },
  listContent: { gap: Spacing.two, paddingBottom: Spacing.four },
  empty: { fontSize: 14, color: TEXT_MUTED, fontStyle: 'italic', marginTop: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  workerName: { fontSize: 15, fontWeight: '600', color: TEXT, flex: 1 },
  removeBtn: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
});
