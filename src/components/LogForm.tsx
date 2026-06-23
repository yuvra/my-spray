import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Card, Input } from '@/components/ui/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CROPS } from '@/data/crop-schedules';
import { Spacing } from '@/constants/theme';
import type { CropType, FertilizerLog, ProductType, SprayLog } from '@/types';

type SprayFormProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<SprayLog, 'id' | 'createdAt'>) => void;
  initial?: SprayLog;
  userId: string;
  initialCrop?: CropType;
  initialDate?: string;
  lockCrop?: boolean;
};

export function SprayLogForm({
  visible,
  onClose,
  onSave,
  initial,
  userId,
  initialCrop,
  initialDate,
  lockCrop,
}: SprayFormProps) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<CropType>(initial?.crop ?? initialCrop ?? 'pomegranate');
  const [productName, setProductName] = useState(initial?.productName ?? '');
  const [type, setType] = useState<ProductType>(initial?.type ?? 'insecticide');
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? ''));
  const [unit, setUnit] = useState(initial?.unit ?? 'ml');
  const [cost, setCost] = useState(String(initial?.cost ?? ''));
  const [date, setDate] = useState(initial?.date ?? initialDate ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSave = () => {
    onSave({
      userId,
      crop,
      productName,
      type,
      quantity: Number(quantity) || 0,
      unit,
      cost: Number(cost) || 0,
      date,
      notes,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="subtitle">{initial ? t('schedule.edit') : t('schedule.addSpray')}</ThemedText>
          <CropPicker crop={crop} onChange={setCrop} locked={lockCrop} />
          <Input label={t('schedule.product')} value={productName} onChangeText={setProductName} />
          <TypePicker type={type} onChange={setType} />
          <Input label={t('schedule.quantity')} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          <Input label="Unit" value={unit} onChangeText={setUnit} />
          <Input label={t('schedule.cost')} value={cost} onChangeText={setCost} keyboardType="numeric" />
          <Input label={t('schedule.date')} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <Input label={t('schedule.notes')} value={notes} onChangeText={setNotes} multiline />
          <Button title={t('schedule.save')} onPress={handleSave} />
          <Button title={t('schedule.cancel')} onPress={onClose} variant="secondary" />
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

type FertilizerFormProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<FertilizerLog, 'id' | 'createdAt'>) => void;
  initial?: FertilizerLog;
  userId: string;
  initialCrop?: CropType;
  initialDate?: string;
  lockCrop?: boolean;
};

export function FertilizerLogForm({
  visible,
  onClose,
  onSave,
  initial,
  userId,
  initialCrop,
  initialDate,
  lockCrop,
}: FertilizerFormProps) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<CropType>(initial?.crop ?? initialCrop ?? 'pomegranate');
  const [fertilizerName, setFertilizerName] = useState(initial?.fertilizerName ?? '');
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? ''));
  const [unit, setUnit] = useState(initial?.unit ?? 'kg');
  const [cost, setCost] = useState(String(initial?.cost ?? ''));
  const [date, setDate] = useState(initial?.date ?? initialDate ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSave = () => {
    onSave({
      userId,
      crop,
      fertilizerName,
      quantity: Number(quantity) || 0,
      unit,
      cost: Number(cost) || 0,
      date,
      notes,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="subtitle">{initial ? t('schedule.edit') : t('schedule.addFertilizer')}</ThemedText>
          <CropPicker crop={crop} onChange={setCrop} locked={lockCrop} />
          <Input label={t('schedule.product')} value={fertilizerName} onChangeText={setFertilizerName} />
          <Input label={t('schedule.quantity')} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          <Input label="Unit" value={unit} onChangeText={setUnit} />
          <Input label={t('schedule.cost')} value={cost} onChangeText={setCost} keyboardType="numeric" />
          <Input label={t('schedule.date')} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <Input label={t('schedule.notes')} value={notes} onChangeText={setNotes} multiline />
          <Button title={t('schedule.save')} onPress={handleSave} />
          <Button title={t('schedule.cancel')} onPress={onClose} variant="secondary" />
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

function CropPicker({
  crop,
  onChange,
  locked,
}: {
  crop: CropType;
  onChange: (c: CropType) => void;
  locked?: boolean;
}) {
  const { t } = useTranslation();
  if (locked) {
    return (
      <View style={styles.chips}>
        <ThemedText type="small">{t('schedule.crop')}</ThemedText>
        <ThemedText type="smallBold">{t(`crops.${crop}`)}</ThemedText>
      </View>
    );
  }
  return (
    <View style={styles.chips}>
      <ThemedText type="small">{t('schedule.crop')}</ThemedText>
      {CROPS.map((c) => (
        <Pressable key={c} onPress={() => onChange(c)} style={[styles.chip, crop === c && styles.chipActive]}>
          <ThemedText type="small">{t(`crops.${c}`)}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

function TypePicker({ type, onChange }: { type: ProductType; onChange: (t: ProductType) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.chips}>
      <ThemedText type="small">{t('schedule.type')}</ThemedText>
      {(['insecticide', 'fungicide'] as ProductType[]).map((item) => (
        <Pressable key={item} onPress={() => onChange(item)} style={[styles.chip, type === item && styles.chipActive]}>
          <ThemedText type="small">{t(`schedule.${item}`)}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: '#FCE4E0',
  },
  chipActive: { backgroundColor: '#9B1B3033' },
});
