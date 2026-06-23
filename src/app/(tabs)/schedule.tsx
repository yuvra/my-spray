import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FertilizerLogForm, SprayLogForm } from '@/components/LogForm';
import { Card } from '@/components/ui/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CROP_SCHEDULES, CROPS } from '@/data/crop-schedules';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  deleteFertilizerLog,
  deleteSprayLog,
  saveFertilizerLog,
  saveSprayLog,
} from '@/services/firestoreService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useScheduleStore } from '@/stores/useScheduleStore';
import type { CropType, FertilizerLog, Language, SprayLog } from '@/types';

type Tab = 'logs' | 'reference';

export default function ScheduleScreen() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isDemo = useAuthStore((s) => s.isDemo);
  const userId = user?.uid ?? (isDemo ? 'demo-user' : '');

  const sprayLogs = useScheduleStore((s) => s.sprayLogs);
  const fertilizerLogs = useScheduleStore((s) => s.fertilizerLogs);
  const addSprayLog = useScheduleStore((s) => s.addSprayLog);
  const addFertilizerLog = useScheduleStore((s) => s.addFertilizerLog);
  const removeSprayLog = useScheduleStore((s) => s.removeSprayLog);
  const removeFertilizerLog = useScheduleStore((s) => s.removeFertilizerLog);

  const [tab, setTab] = useState<Tab>('logs');
  const [filterCrop, setFilterCrop] = useState<CropType | 'all'>('all');
  const [showSprayForm, setShowSprayForm] = useState(false);
  const [showFertForm, setShowFertForm] = useState(false);
  const [refCrop, setRefCrop] = useState<CropType>('pomegranate');

  const lang = (i18n.language as Language) ?? 'en';

  const filteredSpray = filterCrop === 'all' ? sprayLogs : sprayLogs.filter((l) => l.crop === filterCrop);
  const filteredFert =
    filterCrop === 'all' ? fertilizerLogs : fertilizerLogs.filter((l) => l.crop === filterCrop);

  const handleSaveSpray = async (data: Omit<SprayLog, 'id' | 'createdAt'>) => {
    const id = await saveSprayLog({ ...data, createdAt: new Date().toISOString() });
    addSprayLog({ ...data, id, createdAt: new Date().toISOString() });
  };

  const handleSaveFert = async (data: Omit<FertilizerLog, 'id' | 'createdAt'>) => {
    const id = await saveFertilizerLog({ ...data, createdAt: new Date().toISOString() });
    addFertilizerLog({ ...data, id, createdAt: new Date().toISOString() });
  };

  const handleDeleteSpray = (id: string) => {
    Alert.alert(t('schedule.delete'), '', [
      { text: t('schedule.cancel'), style: 'cancel' },
      {
        text: t('schedule.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteSprayLog(id);
          removeSprayLog(id);
        },
      },
    ]);
  };

  const schedule = CROP_SCHEDULES.find((c) => c.crop === refCrop);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.tabs}>
        {(['logs', 'reference'] as Tab[]).map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}>
            <ThemedText type="smallBold">
              {item === 'logs' ? t('schedule.sprayLogs') : t('schedule.reference')}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {tab === 'logs' ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.chips}>
            <Pressable onPress={() => setFilterCrop('all')} style={styles.chip}>
              <ThemedText type="small">All</ThemedText>
            </Pressable>
            {CROPS.map((c) => (
              <Pressable key={c} onPress={() => setFilterCrop(c)} style={styles.chip}>
                <ThemedText type="small">{t(`crops.${c}`)}</ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => setShowSprayForm(true)} style={styles.addBtn}>
            <ThemedText style={styles.addText}>+ {t('schedule.addSpray')}</ThemedText>
          </Pressable>
          <Pressable onPress={() => setShowFertForm(true)} style={styles.addBtn}>
            <ThemedText style={styles.addText}>+ {t('schedule.addFertilizer')}</ThemedText>
          </Pressable>

          <ThemedText type="smallBold">{t('schedule.sprayLogs')}</ThemedText>
          {filteredSpray.length === 0 ? (
            <ThemedText themeColor="textSecondary">{t('schedule.noLogs')}</ThemedText>
          ) : (
            filteredSpray.map((log) => (
              <Card key={log.id}>
                <ThemedText type="smallBold">{t(`crops.${log.crop}`)} — {log.productName}</ThemedText>
                <ThemedText type="small">{log.date} | {log.quantity}{log.unit} | ₹{log.cost}</ThemedText>
                <Pressable onPress={() => handleDeleteSpray(log.id)}>
                  <ThemedText type="small" style={{ color: '#C1121F' }}>{t('schedule.delete')}</ThemedText>
                </Pressable>
              </Card>
            ))
          )}

          <ThemedText type="smallBold">{t('schedule.fertilizerLogs')}</ThemedText>
          {filteredFert.map((log) => (
            <Card key={log.id}>
              <ThemedText type="smallBold">{t(`crops.${log.crop}`)} — {log.fertilizerName}</ThemedText>
              <ThemedText type="small">{log.date} | ₹{log.cost}</ThemedText>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.chips}>
            {CROPS.map((c) => (
              <Pressable key={c} onPress={() => setRefCrop(c)} style={[styles.chip, refCrop === c && styles.tabActive]}>
                <ThemedText type="small">{t(`crops.${c}`)}</ThemedText>
              </Pressable>
            ))}
          </View>
          {schedule?.stages.map((stage) => (
            <Card key={stage.week}>
              <ThemedText type="smallBold">{t('schedule.week')} {stage.week}: {stage.activity}</ThemedText>
              <ThemedText type="small">{stage.product} — {stage.dosage}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {lang === 'hi' ? stage.notes_hi : lang === 'mr' ? stage.notes_mr : stage.notes_en}
              </ThemedText>
            </Card>
          ))}
        </ScrollView>
      )}

      <SprayLogForm
        visible={showSprayForm}
        onClose={() => setShowSprayForm(false)}
        onSave={handleSaveSpray}
        userId={userId}
      />
      <FertilizerLogForm
        visible={showFertForm}
        onClose={() => setShowFertForm(false)}
        onSave={handleSaveFert}
        userId={userId}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.three, gap: Spacing.two, paddingBottom: BottomTabInset + Spacing.four },
  tabs: { flexDirection: 'row', padding: Spacing.two, gap: Spacing.two },
  tab: { flex: 1, padding: Spacing.two, alignItems: 'center', borderRadius: Spacing.two, backgroundColor: '#FCE4E0' },
  tabActive: { backgroundColor: '#9B1B3033' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, backgroundColor: '#FCE4E0', borderRadius: Spacing.two },
  addBtn: { backgroundColor: '#9B1B30', padding: Spacing.two, borderRadius: Spacing.two, alignItems: 'center' },
  addText: { color: '#FFF', fontWeight: '700' },
});
