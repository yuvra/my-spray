import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FertActivityIcon } from '@/components/icons/AppIcons';
import { ActivityCard } from '@/components/home/ActivityCard';
import { AddActivityModal } from '@/components/home/AddActivityModal';
import { FarmStrip } from '@/components/home/FarmStrip';
import { MonthCalendar } from '@/components/home/MonthCalendar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  deleteFarmActivityLog,
  saveFarmActivityLog,
} from '@/services/firestoreService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFarmStore } from '@/stores/useFarmStore';
import { useScheduleStore } from '@/stores/useScheduleStore';
import {
  getActivityDetails,
  getActivityDisplayCost,
  getActivityTitle,
  getActivityVariant,
} from '@/utils/activity-display';
import {
  formatDateKey,
  getActiveDatesForFarm,
  getLogsForFarmAndDate,
} from '@/utils/farm-logs';
import { logToFormDate } from '@/utils/activity-form';
import type { FarmActivityLog } from '@/types';

const GREEN = '#3D6B35';

export function FarmActivitySection() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isDemo = useAuthStore((s) => s.isDemo);
  const profile = useAuthStore((s) => s.profile);
  const userId = user?.uid ?? (isDemo ? 'demo-user' : 'local-user');

  const farms = useFarmStore((s) => s.farms);
  const selectedFarmId = useFarmStore((s) => s.selectedFarmId);
  const setSelectedFarmId = useFarmStore((s) => s.setSelectedFarmId);
  const hydrate = useFarmStore((s) => s.hydrate);
  const seedFarms = useFarmStore((s) => s.seedFarms);
  const hydrated = useFarmStore((s) => s.hydrated);

  const sprayLogs = useScheduleStore((s) => s.sprayLogs);
  const fertilizerLogs = useScheduleStore((s) => s.fertilizerLogs);
  const irrigationLogs = useScheduleStore((s) => s.irrigationLogs);
  const farmActivityLogs = useScheduleStore((s) => s.farmActivityLogs);
  const addFarmActivityLog = useScheduleStore((s) => s.addFarmActivityLog);
  const updateFarmActivityLog = useScheduleStore((s) => s.updateFarmActivityLog);
  const removeFarmActivityLog = useScheduleStore((s) => s.removeFarmActivityLog);
  const removeSprayLog = useScheduleStore((s) => s.removeSprayLog);
  const removeFertilizerLog = useScheduleStore((s) => s.removeFertilizerLog);
  const removeIrrigationLog = useScheduleStore((s) => s.removeIrrigationLog);
  const hydrateFarmActivityLogs = useScheduleStore((s) => s.hydrateFarmActivityLogs);

  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLog, setEditingLog] = useState<FarmActivityLog | null>(null);

  useEffect(() => {
    hydrate(userId).then(() => {
      seedFarms(userId, profile?.preferredCrops ?? ['pomegranate']);
    });
    hydrateFarmActivityLogs(userId);
  }, [hydrate, seedFarms, hydrateFarmActivityLogs, userId, profile?.preferredCrops]);

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) ?? farms[0];
  const dateKey = formatDateKey(selectedDate);
  const dateLabel = format(selectedDate, 'd MMM yyyy');

  const activeDates = useMemo(() => {
    if (!selectedFarm) return new Set<string>();
    return getActiveDatesForFarm(
      selectedFarm,
      sprayLogs,
      fertilizerLogs,
      irrigationLogs,
      farmActivityLogs,
    );
  }, [selectedFarm, sprayLogs, fertilizerLogs, irrigationLogs, farmActivityLogs]);

  const { sprays, fertilizers, irrigations, activities } = useMemo(() => {
    if (!selectedFarm) {
      return {
        sprays: [],
        fertilizers: [],
        irrigations: [],
        activities: [] as FarmActivityLog[],
      };
    }
    return getLogsForFarmAndDate(
      selectedFarm,
      dateKey,
      sprayLogs,
      fertilizerLogs,
      irrigationLogs,
      farmActivityLogs,
    );
  }, [selectedFarm, dateKey, sprayLogs, fertilizerLogs, irrigationLogs, farmActivityLogs]);

  const hasActivities =
    activities.length > 0 ||
    sprays.length > 0 ||
    fertilizers.length > 0 ||
    irrigations.length > 0;

  const handleSaveActivity = async (
    data: Omit<FarmActivityLog, 'id' | 'createdAt'>,
    options?: { id?: string; createdAt?: string },
  ) => {
    const createdAt = options?.createdAt ?? new Date().toISOString();

    if (options?.id) {
      const payload = { ...data, createdAt };
      const updated: FarmActivityLog = { ...payload, id: options.id };
      updateFarmActivityLog(updated);
      await saveFarmActivityLog(payload, options.id);
      setEditingLog(null);
      return;
    }

    const payload = { ...data, createdAt };
    const localId = `local-${Date.now()}`;
    addFarmActivityLog({ ...payload, id: localId });
    const firestoreId = await saveFarmActivityLog(payload);
    if (firestoreId !== localId) {
      useScheduleStore.getState().setFarmActivityLogs(
        useScheduleStore
          .getState()
          .farmActivityLogs.map((log) => (log.id === localId ? { ...log, id: firestoreId } : log)),
      );
    }
  };

  const confirmDelete = (onConfirm: () => void) => {
    Alert.alert(t('home.deleteActivityTitle'), t('home.deleteActivityMessage'), [
      { text: t('home.cancel'), style: 'cancel' },
      { text: t('schedule.delete'), style: 'destructive', onPress: onConfirm },
    ]);
  };

  const handleDeleteActivity = (log: FarmActivityLog) => {
    confirmDelete(() => {
      removeFarmActivityLog(log.id);
      void deleteFarmActivityLog(log.id);
    });
  };

  const openAddModal = () => {
    setEditingLog(null);
    setShowAddModal(true);
  };

  const openEditModal = (log: FarmActivityLog) => {
    setEditingLog(log);
    setShowAddModal(true);
  };

  const closeActivityModal = () => {
    setShowAddModal(false);
    setEditingLog(null);
  };

  if (!hydrated) return null;

  return (
    <View style={styles.wrap}>
      <FarmStrip
        farms={farms}
        selectedFarmId={selectedFarm?.id ?? null}
        onSelect={setSelectedFarmId}
        onOpenCalendar={() => setShowCalendar(true)}
      />

      {selectedFarm && (
        <View style={styles.section}>
          <ThemedText type="smallBold" style={styles.dateHeader}>
            {dateLabel}
          </ThemedText>

          {!hasActivities ? (
            <View style={styles.emptyBox}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {t('home.noActivities')}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.cards}>
              {activities.map((log) => (
                <ActivityCard
                  key={log.id}
                  variant={getActivityVariant(log)}
                  moonPhase={log.moonPhase}
                  title={getActivityTitle(log, t)}
                  details={getActivityDetails(log, t)}
                  cost={getActivityDisplayCost(log)}
                  onEdit={() => openEditModal(log)}
                  onDelete={() => handleDeleteActivity(log)}
                />
              ))}

              {irrigations.map((log) => (
                <ActivityCard
                  key={log.id}
                  variant="irrigation"
                  title={t('home.waterDone')}
                  details={[
                    {
                      key: 'duration',
                      label: t('home.waterDuration'),
                      value: t('home.waterDurationValue', {
                        hours: log.durationHours,
                        minutes: log.durationMinutes,
                      }),
                    },
                    ...(log.notes
                      ? [{ key: 'notes' as const, label: t('schedule.notes'), value: log.notes }]
                      : []),
                  ]}
                  onDelete={() => confirmDelete(() => removeIrrigationLog(log.id))}
                />
              ))}

              {sprays.map((log) => (
                <ActivityCard
                  key={log.id}
                  variant="spray"
                  title={t('home.sprayDone')}
                  details={[
                    { key: 'product', label: t('schedule.product'), value: log.productName },
                    {
                      key: 'other',
                      label: t('schedule.type'),
                      value: `${t(`schedule.${log.type}`)} · ${log.quantity}${log.unit}`,
                    },
                    ...(log.notes
                      ? [{ key: 'notes' as const, label: t('schedule.notes'), value: log.notes }]
                      : []),
                  ]}
                  cost={log.cost}
                  onDelete={() => confirmDelete(() => removeSprayLog(log.id))}
                />
              ))}

              {fertilizers.map((log) => (
                <ActivityCard
                  key={log.id}
                  variant="fertilizer"
                  title={t('home.fertigationDone')}
                  details={[
                    {
                      key: 'product',
                      label: t('schedule.product'),
                      value: `${log.quantity}${log.unit} ${log.fertilizerName}`,
                    },
                    ...(log.notes
                      ? [{ key: 'notes' as const, label: t('schedule.notes'), value: log.notes }]
                      : []),
                  ]}
                  cost={log.cost}
                  onDelete={() => confirmDelete(() => removeFertilizerLog(log.id))}
                />
              ))}
            </View>
          )}
        </View>
      )}

      <Pressable
        onPress={openAddModal}
        style={styles.fab}
        accessibilityLabel={t('home.addActivity')}
        accessibilityRole="button">
        <FertActivityIcon size={28} color="#FFFFFF" />
        <ThemedText type="smallBold" style={styles.fabText}>
          {t('home.addActivity')}
        </ThemedText>
      </Pressable>

      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCalendar(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCalendar(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <MonthCalendar
              month={month}
              selectedDate={selectedDate}
              activeDates={activeDates}
              onMonthChange={setMonth}
              onSelectDate={setSelectedDate}
              onClose={() => setShowCalendar(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <AddActivityModal
        visible={showAddModal}
        onClose={closeActivityModal}
        farms={farms}
        defaultFarmId={selectedFarm?.id ?? null}
        defaultDate={editingLog ? logToFormDate(editingLog) : selectedDate}
        activeDates={activeDates}
        userId={userId}
        editLog={editingLog}
        onSave={handleSaveActivity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three, paddingBottom: 72 },
  section: { gap: Spacing.three },
  dateHeader: {
    textAlign: 'center',
    color: GREEN,
    fontSize: 15,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: Spacing.four,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  empty: { textAlign: 'center' },
  cards: { gap: Spacing.three },
  fab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 28,
    backgroundColor: '#1A4D3E',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fabText: { color: '#FFFFFF' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
});
