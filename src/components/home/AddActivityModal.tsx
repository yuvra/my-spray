import type { Dispatch, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { CalendarIcon, CheckCircleIcon } from '@/components/icons/AppIcons';
import { MonthCalendar } from '@/components/home/MonthCalendar';
import { WorkerSpendFields, resolveWorkerName } from '@/components/home/WorkerSpendFields';
import { ProductUsagePicker } from '@/components/home/ProductUsagePicker';
import {
  ACTIVITY_GROUPS,
  BACTERICIDE_PRODUCTS,
  BIOLOGICAL_AGENT_PRODUCTS,
  FERTILIZER_SPRAY_PRODUCTS,
  FUNGICIDE_PRODUCTS,
  INSECTICIDE_PRODUCTS,
  MICRONUTRIENT_PRODUCTS,
  NEMATICIDE_PRODUCTS,
  NUTRIENT_IRRIGATION_PRODUCTS,
  PGR_PRODUCTS,
  SPREADER_STICKER_PRODUCTS,
  WATER_PH_BALANCER_PRODUCTS,
  getActivityLabelKey,
  hasIrrigationDetails,
  hasSprayDetails,
  isCulturalActivity,
  isWorkerSpendActivity,
  isFertilizerActivity,
  isIrrigationSubType,
  isSpraySubType,
  resolveProducts,
  toggleProductInList,
} from '@/constants/farm-activities';
import { Spacing } from '@/constants/theme';
import { useProductCatalogStore } from '@/stores/useProductCatalogStore';
import { useProductInventoryStore } from '@/stores/useProductInventoryStore';
import { useWorkerStore } from '@/stores/useWorkerStore';
import { formatDateKey, formatDisplayDate } from '@/utils/farm-logs';
import { snapshotFromActivityLog } from '@/utils/activity-form';
import type { Farm, FarmActivityLog, FarmActivityType, IrrigationSubType, MoonPhase, ProductLineItem, SpraySubType } from '@/types';
import {
  draftToLineItem,
  sumProductLineCosts,
} from '@/utils/product-usage';

const GREEN = '#3D6B35';
const SECTION_BG = '#E8F5E9';
const TEXT = '#1F2937';
const TEXT_SECONDARY = '#4B5563';
const INPUT_BG = '#FFFFFF';
const FUNGICIDE_ACCENT = '#2E7D32';
const INSECTICIDE_ACCENT = '#D97706';
const MICRONUTRIENT_ACCENT = '#2563EB';
const PGR_ACCENT = '#7C3AED';
const FERTILIZER_SPRAY_ACCENT = '#059669';
const BACTERICIDE_ACCENT = '#0D9488';
const PH_BALANCER_ACCENT = '#0891B2';
const SPREADER_STICKER_ACCENT = '#DB2777';
const NUTRIENT_IRRIGATION_ACCENT = '#0284C7';
const NEMATICIDE_ACCENT = '#7C2D12';
const BIOLOGICAL_ACCENT = '#6366F1';
const BORDER = '#D1D5DB';

function withOther(names: string[]): string[] {
  return names.includes('Other') ? names : [...names, 'Other'];
}

function resolveGroupProducts(
  inventoryNames: string[],
  catalogNames: string[],
  staticList: readonly string[],
): string[] {
  if (inventoryNames.length) return withOther(inventoryNames);
  const base = catalogNames.length ? catalogNames : [...staticList];
  return withOther(base);
}

type Props = {
  visible: boolean;
  onClose: () => void;
  farms: Farm[];
  defaultFarmId: string | null;
  defaultDate: Date;
  activeDates: Set<string>;
  userId: string;
  editLog?: FarmActivityLog | null;
  onSave: (
    data: Omit<FarmActivityLog, 'id' | 'createdAt'>,
    options?: { id?: string; createdAt?: string },
  ) => Promise<void>;
};

type SectionId = 'date' | 'plot' | 'activity' | 'details' | 'notes' | 'cost' | 'photo';

const DEFAULT_EXPANDED: Record<SectionId, boolean> = {
  date: true,
  plot: true,
  activity: true,
  details: true,
  notes: false,
  cost: false,
  photo: false,
};

function CollapsibleSection({
  label,
  summary,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  summary?: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Pressable onPress={onToggle} style={styles.sectionHeader} accessibilityRole="button">
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionLabel}>{label}</Text>
          {!expanded && summary ? (
            <Text style={styles.sectionSummary} numberOfLines={2}>
              {summary}
            </Text>
          ) : null}
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>
      {expanded ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

function FieldInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  flex,
  multiline,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'numeric' | 'default';
  flex?: boolean;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={TEXT_SECONDARY}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[styles.field, flex && styles.fieldFlex, multiline && styles.fieldMultiline]}
    />
  );
}

function ActivityGroupSection({
  title,
  hint,
  accentColor,
  children,
}: {
  title: string;
  hint?: string;
  accentColor: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.activityGroup, { borderLeftColor: accentColor }]}>
      <Text style={[styles.activityGroupTitle, { color: accentColor }]}>{title}</Text>
      {hint ? <Text style={styles.activityGroupHint}>{hint}</Text> : null}
      <View style={styles.activityGrid}>{children}</View>
    </View>
  );
}

export function AddActivityModal({
  visible,
  onClose,
  farms,
  defaultFarmId,
  defaultDate,
  activeDates,
  userId,
  editLog,
  onSave,
}: Props) {
  const { t } = useTranslation();

  const [date, setDate] = useState(defaultDate);
  const [farmId, setFarmId] = useState(defaultFarmId ?? farms[0]?.id ?? '');
  const [singleActivity, setSingleActivity] = useState<FarmActivityType | null>(null);
  const [spraySubTypes, setSpraySubTypes] = useState<SpraySubType[]>([]);
  const [irrigationSubTypes, setIrrigationSubTypes] = useState<IrrigationSubType[]>([]);
  const [cost, setCost] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const [saving, setSaving] = useState(false);

  const [productName, setProductName] = useState('');
  const [fungicideProducts, setFungicideProducts] = useState<string[]>([]);
  const [customFungicide, setCustomFungicide] = useState('');
  const [insecticideProducts, setInsecticideProducts] = useState<string[]>([]);
  const [customInsecticide, setCustomInsecticide] = useState('');
  const [micronutrientProducts, setMicronutrientProducts] = useState<string[]>([]);
  const [customMicronutrient, setCustomMicronutrient] = useState('');
  const [pgrProducts, setPgrProducts] = useState<string[]>([]);
  const [customPgr, setCustomPgr] = useState('');
  const [fertilizerSprayProducts, setFertilizerSprayProducts] = useState<string[]>([]);
  const [customFertilizerSpray, setCustomFertilizerSpray] = useState('');
  const [bactericideProducts, setBactericideProducts] = useState<string[]>([]);
  const [customBactericide, setCustomBactericide] = useState('');
  const [waterPhBalancerProducts, setWaterPhBalancerProducts] = useState<string[]>([]);
  const [customWaterPhBalancer, setCustomWaterPhBalancer] = useState('');
  const [spreaderStickerProducts, setSpreaderStickerProducts] = useState<string[]>([]);
  const [customSpreaderSticker, setCustomSpreaderSticker] = useState('');
  const [nutrientProducts, setNutrientProducts] = useState<string[]>([]);
  const [customNutrient, setCustomNutrient] = useState('');
  const [nematicideProducts, setNematicideProducts] = useState<string[]>([]);
  const [customNematicide, setCustomNematicide] = useState('');
  const [biologicalProducts, setBiologicalProducts] = useState<string[]>([]);
  const [customBiological, setCustomBiological] = useState('');
  const [moonPhase, setMoonPhase] = useState<MoonPhase | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [waterHours, setWaterHours] = useState('1');
  const [waterMinutes, setWaterMinutes] = useState('0');
  const [sprayWaterLiters, setSprayWaterLiters] = useState('');
  const [notes, setNotes] = useState('');
  const [workName, setWorkName] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [customWorker, setCustomWorker] = useState('');
  const [workerSpend, setWorkerSpend] = useState('');
  const [expanded, setExpanded] = useState(DEFAULT_EXPANDED);

  const catalogFungicides = useProductCatalogStore((s) => s.fungicides);
  const catalogInsecticides = useProductCatalogStore((s) => s.insecticides);
  const hydrateProductCatalog = useProductCatalogStore((s) => s.hydrate);
  const inventoryItems = useProductInventoryStore((s) => s.items);
  const getNamesForGroup = useProductInventoryStore((s) => s.getNamesForGroup);
  const getUsageDraft = useProductInventoryStore((s) => s.getUsageDraft);
  const ensureWorker = useWorkerStore((s) => s.ensureWorker);
  const seedDefaultWorkers = useWorkerStore((s) => s.seedDefaultWorkers);

  const fungicideProductList = useMemo(
    () => resolveGroupProducts(getNamesForGroup('fungicide'), catalogFungicides, FUNGICIDE_PRODUCTS),
    [inventoryItems, catalogFungicides, getNamesForGroup],
  );
  const insecticideProductList = useMemo(
    () => resolveGroupProducts(getNamesForGroup('insecticide'), catalogInsecticides, INSECTICIDE_PRODUCTS),
    [inventoryItems, catalogInsecticides, getNamesForGroup],
  );
  const bactericideProductList = useMemo(
    () => resolveGroupProducts(getNamesForGroup('bactericide'), [], BACTERICIDE_PRODUCTS),
    [inventoryItems, getNamesForGroup],
  );
  const pgrProductList = useMemo(
    () => resolveGroupProducts(getNamesForGroup('pgr'), [], PGR_PRODUCTS),
    [inventoryItems, getNamesForGroup],
  );
  const fertilizerSprayProductList = useMemo(
    () => resolveGroupProducts(getNamesForGroup('fertilizer_spray'), [], FERTILIZER_SPRAY_PRODUCTS),
    [inventoryItems, getNamesForGroup],
  );
  const micronutrientProductList = useMemo(
    () => resolveGroupProducts(getNamesForGroup('micronutrient_spray'), [], MICRONUTRIENT_PRODUCTS),
    [inventoryItems, getNamesForGroup],
  );
  const waterPhBalancerProductList = useMemo(
    () => resolveGroupProducts(getNamesForGroup('water_ph_balancer'), [], WATER_PH_BALANCER_PRODUCTS),
    [inventoryItems, getNamesForGroup],
  );
  const spreaderStickerProductList = useMemo(
    () => resolveGroupProducts(getNamesForGroup('spreader_sticker'), [], SPREADER_STICKER_PRODUCTS),
    [inventoryItems, getNamesForGroup],
  );
  const nutrientProductList = useMemo(
    () => resolveGroupProducts(getNamesForGroup('nutrient'), [], NUTRIENT_IRRIGATION_PRODUCTS),
    [inventoryItems, getNamesForGroup],
  );
  const nematicideProductList = useMemo(
    () => resolveGroupProducts(getNamesForGroup('nematicide_drench'), [], NEMATICIDE_PRODUCTS),
    [inventoryItems, getNamesForGroup],
  );
  const biologicalProductList = useMemo(
    () => resolveGroupProducts(getNamesForGroup('biological'), [], BIOLOGICAL_AGENT_PRODUCTS),
    [inventoryItems, getNamesForGroup],
  );

  const selectedFarm = farms.find((f) => f.id === farmId) ?? farms[0];
  const dateKey = formatDateKey(date);
  const showSprayDetails = hasSprayDetails(spraySubTypes);
  const showIrrigationDetails = hasIrrigationDetails(irrigationSubTypes);

  const resolvedFungicides = resolveProducts(fungicideProducts, customFungicide);
  const resolvedInsecticides = resolveProducts(insecticideProducts, customInsecticide);
  const resolvedMicronutrients = resolveProducts(micronutrientProducts, customMicronutrient);
  const resolvedPgrs = resolveProducts(pgrProducts, customPgr);
  const resolvedFertilizerSprays = resolveProducts(fertilizerSprayProducts, customFertilizerSpray);
  const resolvedBactericides = resolveProducts(bactericideProducts, customBactericide);
  const resolvedPhBalancers = resolveProducts(waterPhBalancerProducts, customWaterPhBalancer);
  const resolvedSpreaderStickers = resolveProducts(spreaderStickerProducts, customSpreaderSticker);
  const resolvedNutrients = resolveProducts(nutrientProducts, customNutrient);
  const resolvedNematicides = resolveProducts(nematicideProducts, customNematicide);
  const resolvedBiologicals = resolveProducts(biologicalProducts, customBiological);

  const makeProductToggle =
    (setter: Dispatch<React.SetStateAction<string[]>>, clearCustom: () => void) =>
    (product: string) => {
      setter((prev) => {
        const next = toggleProductInList(prev, product);
        if (!next.includes('Other')) clearCustom();
        return next;
      });
    };

  const collectProductLines = (group: string, names: string[]): ProductLineItem[] => {
    const waterNum = Number(sprayWaterLiters) || 0;
    return names
      .map((name) => {
        const draft = getUsageDraft(group, name);
        return draftToLineItem(group, name, draft, waterNum);
      })
      .filter((line): line is ProductLineItem => line != null);
  };

  const toggleFungicide = makeProductToggle(setFungicideProducts, () => setCustomFungicide(''));
  const toggleInsecticide = makeProductToggle(setInsecticideProducts, () => setCustomInsecticide(''));
  const toggleMicronutrient = makeProductToggle(setMicronutrientProducts, () => setCustomMicronutrient(''));
  const togglePgr = makeProductToggle(setPgrProducts, () => setCustomPgr(''));
  const toggleFertilizerSpray = makeProductToggle(setFertilizerSprayProducts, () => setCustomFertilizerSpray(''));
  const toggleBactericide = makeProductToggle(setBactericideProducts, () => setCustomBactericide(''));
  const toggleWaterPhBalancer = makeProductToggle(setWaterPhBalancerProducts, () => setCustomWaterPhBalancer(''));
  const toggleSpreaderSticker = makeProductToggle(setSpreaderStickerProducts, () => setCustomSpreaderSticker(''));
  const toggleNutrient = makeProductToggle(setNutrientProducts, () => setCustomNutrient(''));
  const toggleNematicide = makeProductToggle(setNematicideProducts, () => setCustomNematicide(''));
  const toggleBiological = makeProductToggle(setBiologicalProducts, () => setCustomBiological(''));

  useEffect(() => {
    if (!visible) return;
    void hydrateProductCatalog();
    seedDefaultWorkers();

    if (editLog) {
      const snap = snapshotFromActivityLog(editLog);
      setDate(snap.date);
      setFarmId(snap.farmId || defaultFarmId || farms[0]?.id || '');
      setSingleActivity(snap.singleActivity);
      setSpraySubTypes(snap.spraySubTypes);
      setIrrigationSubTypes(snap.irrigationSubTypes);
      setCost(snap.cost);
      setProductName(snap.productName);
      setFungicideProducts(snap.fungicideProducts);
      setCustomFungicide('');
      setInsecticideProducts(snap.insecticideProducts);
      setCustomInsecticide('');
      setMicronutrientProducts(snap.micronutrientProducts);
      setCustomMicronutrient('');
      setPgrProducts(snap.pgrProducts);
      setCustomPgr('');
      setFertilizerSprayProducts(snap.fertilizerSprayProducts);
      setCustomFertilizerSpray('');
      setBactericideProducts(snap.bactericideProducts);
      setCustomBactericide('');
      setWaterPhBalancerProducts(snap.waterPhBalancerProducts);
      setCustomWaterPhBalancer('');
      setSpreaderStickerProducts(snap.spreaderStickerProducts);
      setCustomSpreaderSticker('');
      setNutrientProducts(snap.nutrientProducts);
      setCustomNutrient('');
      setNematicideProducts(snap.nematicideProducts);
      setCustomNematicide('');
      setBiologicalProducts(snap.biologicalProducts);
      setCustomBiological('');
      setMoonPhase(snap.moonPhase);
      setQuantity(snap.quantity);
      setUnit(snap.unit);
      setWaterHours(snap.waterHours);
      setWaterMinutes(snap.waterMinutes);
      setSprayWaterLiters(snap.sprayWaterLiters);
      setNotes(snap.notes);
      setWorkName(snap.workName);
      setSelectedWorker(snap.selectedWorker);
      setCustomWorker(snap.customWorker);
      setWorkerSpend(snap.workerSpend);
      setExpanded({ ...DEFAULT_EXPANDED, details: true });
      return;
    }

    setDate(defaultDate);
    setFarmId(defaultFarmId ?? farms[0]?.id ?? '');
    setSingleActivity(null);
    setSpraySubTypes([]);
    setIrrigationSubTypes([]);
    setCost('');
    setProductName('');
    setFungicideProducts([]);
    setCustomFungicide('');
    setInsecticideProducts([]);
    setCustomInsecticide('');
    setMicronutrientProducts([]);
    setCustomMicronutrient('');
    setPgrProducts([]);
    setCustomPgr('');
    setFertilizerSprayProducts([]);
    setCustomFertilizerSpray('');
    setBactericideProducts([]);
    setCustomBactericide('');
    setWaterPhBalancerProducts([]);
    setCustomWaterPhBalancer('');
    setSpreaderStickerProducts([]);
    setCustomSpreaderSticker('');
    setNutrientProducts([]);
    setCustomNutrient('');
    setNematicideProducts([]);
    setCustomNematicide('');
    setBiologicalProducts([]);
    setCustomBiological('');
    setMoonPhase(null);
    setQuantity('');
    setUnit('kg');
    setWaterHours('1');
    setWaterMinutes('0');
    setSprayWaterLiters('');
    setNotes('');
    setWorkName('');
    setSelectedWorker('');
    setCustomWorker('');
    setWorkerSpend('');
    setExpanded({ ...DEFAULT_EXPANDED });
  }, [visible, defaultDate, defaultFarmId, farms, hydrateProductCatalog, editLog, seedDefaultWorkers]);

  const toggleSection = (id: SectionId) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSpraySubType = (type: SpraySubType) => {
    setSingleActivity(null);
    setIrrigationSubTypes([]);
    setSpraySubTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type];
      return next;
    });
    setExpanded((prev) => ({ ...prev, details: true }));
  };

  const toggleIrrigationSubType = (type: IrrigationSubType) => {
    setSingleActivity(null);
    setSpraySubTypes([]);
    setIrrigationSubTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type];
      return next;
    });
    if (type !== 'biological') {
      setMoonPhase(null);
    }
    setExpanded((prev) => ({ ...prev, details: true }));
  };

  const selectSingleActivity = (type: FarmActivityType) => {
    setSpraySubTypes([]);
    setIrrigationSubTypes([]);
    setMoonPhase(null);
    setSingleActivity(type);
    setExpanded((prev) => ({ ...prev, details: true }));
  };

  const activitySummary = (() => {
    if (spraySubTypes.length > 0) {
      return spraySubTypes.map((st) => t(`home.spraySubTypes.${st}`)).join(', ');
    }
    if (irrigationSubTypes.length > 0) {
      return irrigationSubTypes.map((st) => t(`home.irrigationSubTypes.${st}`)).join(', ');
    }
    if (singleActivity) {
      return t(`home.activityTypes.${singleActivity}`);
    }
    return t('home.selectActivityPrompt');
  })();

  const detailsLabel = showSprayDetails
    ? t('home.sprayDetails')
    : showIrrigationDetails
      ? t('home.irrigationDetails')
      : singleActivity && isFertilizerActivity(singleActivity)
        ? t('schedule.product')
      : singleActivity && isWorkerSpendActivity(singleActivity)
        ? t('home.workerSpendDetails')
        : t('home.activityDetails');

  const detailsSummary = (() => {
    if (showSprayDetails) {
      return [
        resolvedFungicides.join(', '),
        resolvedInsecticides.join(', '),
        resolvedPgrs.join(', '),
        resolvedFertilizerSprays.join(', '),
        resolvedMicronutrients.join(', '),
        resolvedBactericides.join(', '),
        resolvedPhBalancers.join(', '),
        resolvedSpreaderStickers.join(', '),
      ]
        .filter(Boolean)
        .join(' · ');
    }
    if (showIrrigationDetails) {
      return [
        t('home.waterDurationValue', {
          hours: Number(waterHours) || 0,
          minutes: Number(waterMinutes) || 0,
        }),
        resolvedNutrients.join(', '),
        resolvedNematicides.join(', '),
        resolvedBiologicals.join(', '),
        moonPhase ? t(`home.moonPhases.${moonPhase}`) : '',
      ]
        .filter(Boolean)
        .join(' · ');
    }
    if (singleActivity && isFertilizerActivity(singleActivity)) {
      return [productName, quantity && `${quantity}${unit}`].filter(Boolean).join(' · ');
    }
    if (singleActivity && isWorkerSpendActivity(singleActivity)) {
      const parts = [workName.trim()];
      const worker = resolveWorkerName(selectedWorker, customWorker);
      if (worker) parts.push(worker);
      if (workerSpend.trim()) parts.push(`₹${workerSpend}`);
      return parts.filter(Boolean).join(' · ') || t('home.activityTypes.worker_spend');
    }
    if (singleActivity && isCulturalActivity(singleActivity)) {
      return t(`home.activityTypes.${singleActivity}`);
    }
    if (singleActivity) {
      return t(`home.activityTypes.${singleActivity}`);
    }
    return undefined;
  })();

  const canSave =
    Boolean(selectedFarm) &&
    (spraySubTypes.length > 0 || irrigationSubTypes.length > 0 || Boolean(singleActivity));

  const handleSave = async () => {
    if (!selectedFarm) {
      Alert.alert(t('home.saveErrorTitle'), t('home.noPlotSelected'));
      return;
    }
    if (spraySubTypes.length === 0 && irrigationSubTypes.length === 0 && !singleActivity) {
      Alert.alert(t('home.saveErrorTitle'), t('home.selectActivityPrompt'));
      return;
    }
    setSaving(true);
    try {
      const activityType: FarmActivityType = (() => {
        if (spraySubTypes.length > 0) return 'spray';
        if (irrigationSubTypes.length > 0) {
          if (irrigationSubTypes.length === 1 && irrigationSubTypes[0] === 'plain') {
            return 'irrigation_plain';
          }
          if (irrigationSubTypes.length === 1 && irrigationSubTypes[0] === 'nutrient') {
            return 'irrigation_nutrient';
          }
          return 'irrigation';
        }
        return singleActivity!;
      })();

      const payload: Omit<FarmActivityLog, 'id' | 'createdAt'> = {
        userId,
        farmId: selectedFarm.id,
        crop: selectedFarm.crop,
        activityType,
        date: dateKey,
      };

      if (notes.trim()) payload.notes = notes.trim();

      const allProductLines: ProductLineItem[] = [];
      const waterNum = Number(sprayWaterLiters) || 0;
      if (waterNum > 0) payload.sprayWaterLiters = waterNum;

      if (spraySubTypes.length > 0) {
        payload.spraySubTypes = spraySubTypes;
        if (spraySubTypes.includes('fungicide')) {
          const list = resolvedFungicides;
          if (list.length) {
            payload.fungicideProducts = list;
            payload.fungicideProduct = list.join(', ');
          }
          allProductLines.push(...collectProductLines('fungicide', list));
        }
        if (spraySubTypes.includes('insecticide')) {
          const list = resolvedInsecticides;
          if (list.length) {
            payload.insecticideProducts = list;
            payload.insecticideProduct = list.join(', ');
          }
          allProductLines.push(...collectProductLines('insecticide', list));
        }
        if (spraySubTypes.includes('micronutrient_spray')) {
          const list = resolvedMicronutrients;
          if (list.length) {
            payload.micronutrientProducts = list;
            payload.micronutrientProduct = list.join(', ');
          }
          allProductLines.push(...collectProductLines('micronutrient_spray', list));
        }
        if (spraySubTypes.includes('pgr')) {
          const list = resolvedPgrs;
          if (list.length) payload.pgrProducts = list;
          allProductLines.push(...collectProductLines('pgr', list));
        }
        if (spraySubTypes.includes('fertilizer_spray')) {
          const list = resolvedFertilizerSprays;
          if (list.length) payload.fertilizerSprayProducts = list;
          allProductLines.push(...collectProductLines('fertilizer_spray', list));
        }
        if (spraySubTypes.includes('bactericide')) {
          const list = resolvedBactericides;
          if (list.length) payload.bactericideProducts = list;
          allProductLines.push(...collectProductLines('bactericide', list));
        }
        if (spraySubTypes.includes('water_ph_balancer')) {
          const list = resolvedPhBalancers;
          if (list.length) payload.waterPhBalancerProducts = list;
          allProductLines.push(...collectProductLines('water_ph_balancer', list));
        }
        if (spraySubTypes.includes('spreader_sticker')) {
          const list = resolvedSpreaderStickers;
          if (list.length) payload.spreaderStickerProducts = list;
          allProductLines.push(...collectProductLines('spreader_sticker', list));
        }
      } else if (irrigationSubTypes.length > 0) {
        payload.irrigationSubTypes = irrigationSubTypes;
        payload.durationHours = Number(waterHours) || 0;
        payload.durationMinutes = Number(waterMinutes) || 0;

        if (irrigationSubTypes.includes('nutrient')) {
          const list = resolvedNutrients;
          if (list.length) {
            payload.nutrientProducts = list;
            payload.productName = list.join(', ');
          }
          allProductLines.push(...collectProductLines('nutrient', list));
        }
        if (irrigationSubTypes.includes('nematicide_drench')) {
          const list = resolvedNematicides;
          if (list.length) payload.nematicideProducts = list;
          allProductLines.push(...collectProductLines('nematicide_drench', list));
        }
        if (irrigationSubTypes.includes('biological')) {
          const list = resolvedBiologicals;
          if (list.length) payload.biologicalProducts = list;
          allProductLines.push(...collectProductLines('biological', list));
          if (moonPhase) payload.moonPhase = moonPhase;
        }
      } else if (singleActivity && isFertilizerActivity(singleActivity)) {
        payload.productName = productName.trim() || t(`home.activityTypes.${singleActivity}`);
        const qty = Number(quantity);
        if (quantity.trim() && !Number.isNaN(qty)) {
          payload.quantity = qty;
          payload.unit = unit;
        }
      } else if (singleActivity && isWorkerSpendActivity(singleActivity)) {
        if (workName.trim()) payload.workName = workName.trim();
        const worker = resolveWorkerName(selectedWorker, customWorker);
        if (worker) {
          payload.workerName = worker;
          ensureWorker(worker);
        }
        const wAmount = Number(workerSpend);
        if (workerSpend.trim() && !Number.isNaN(wAmount) && wAmount > 0) {
          payload.workerSpend = wAmount;
        }
      }

      if (allProductLines.length) payload.productLines = allProductLines;

      const lineCost = sumProductLineCosts(allProductLines);
      const costNum = Number(cost);
      if (lineCost > 0) {
        payload.cost = lineCost;
      } else if (cost.trim() && !Number.isNaN(costNum) && costNum > 0) {
        payload.cost = costNum;
      }

      await onSave(payload, editLog ? { id: editLog.id, createdAt: editLog.createdAt } : undefined);
      onClose();
    } catch (error) {
      console.error('[AddActivityModal] save failed', error);
      Alert.alert(t('home.saveErrorTitle'), t('home.saveErrorMessage'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('home.activityTitle')}</Text>
              <View style={styles.headerLine} />
            </View>

            <CollapsibleSection
              label={t('home.dateLabel')}
              summary={formatDisplayDate(date)}
              expanded={expanded.date}
              onToggle={() => toggleSection('date')}>
              <Pressable onPress={() => setShowCalendar(true)} style={styles.dateField}>
                <Text style={styles.fieldText}>{formatDisplayDate(date)}</Text>
                <CalendarIcon color={GREEN} size={20} />
              </Pressable>
            </CollapsibleSection>

            <CollapsibleSection
              label={t('home.whichPlot')}
              summary={selectedFarm ? `${selectedFarm.name} · ${t(`crops.${selectedFarm.crop}`)}` : undefined}
              expanded={expanded.plot}
              onToggle={() => toggleSection('plot')}>
              {farms.map((farm) => {
                const selected = farm.id === farmId;
                return (
                  <Pressable
                    key={farm.id}
                    onPress={() => setFarmId(farm.id)}
                    style={[styles.plotRow, selected && styles.plotRowSelected]}>
                    <View style={styles.plotText}>
                      <Text style={[styles.plotName, selected && styles.plotNameSelected]}>
                        {farm.name}
                      </Text>
                      <Text style={styles.plotCrop}>{t(`crops.${farm.crop}`)}</Text>
                    </View>
                    {selected && <CheckCircleIcon />}
                  </Pressable>
                );
              })}
            </CollapsibleSection>

            <CollapsibleSection
              label={t('home.whichActivity')}
              summary={activitySummary}
              expanded={expanded.activity}
              onToggle={() => toggleSection('activity')}>
              <View style={styles.activityGroupsStack}>
                {ACTIVITY_GROUPS.map((group) => (
                  <ActivityGroupSection
                    key={group.id}
                    title={t(group.labelKey)}
                    hint={group.hintKey ? t(group.hintKey) : undefined}
                    accentColor={group.accentColor}>
                    {group.items.map((type) => {
                      if (group.multiSelect && isSpraySubType(type)) {
                        const selected = spraySubTypes.includes(type);
                        return (
                          <Pressable
                            key={type}
                            onPress={() => toggleSpraySubType(type)}
                            style={[styles.activityBtn, selected && styles.activityBtnSelected]}>
                            {selected ? <Text style={styles.checkMark}>✓</Text> : null}
                            <Text
                              style={[
                                styles.activityBtnText,
                                selected && styles.activityBtnTextSelected,
                              ]}
                              numberOfLines={3}>
                              {t(getActivityLabelKey(type))}
                            </Text>
                          </Pressable>
                        );
                      }

                      if (group.multiSelect && isIrrigationSubType(type)) {
                        const selected = irrigationSubTypes.includes(type);
                        return (
                          <Pressable
                            key={type}
                            onPress={() => toggleIrrigationSubType(type)}
                            style={[styles.activityBtn, selected && styles.activityBtnSelected]}>
                            {selected ? <Text style={styles.checkMark}>✓</Text> : null}
                            <Text
                              style={[
                                styles.activityBtnText,
                                selected && styles.activityBtnTextSelected,
                              ]}
                              numberOfLines={3}>
                              {t(getActivityLabelKey(type))}
                            </Text>
                          </Pressable>
                        );
                      }

                      const selected =
                        spraySubTypes.length === 0 &&
                        irrigationSubTypes.length === 0 &&
                        singleActivity === type;
                      return (
                        <Pressable
                          key={type}
                          onPress={() => selectSingleActivity(type as FarmActivityType)}
                          style={[styles.activityBtn, selected && styles.activityBtnSelected]}>
                          <Text
                            style={[
                              styles.activityBtnText,
                              selected && styles.activityBtnTextSelected,
                            ]}
                            numberOfLines={3}>
                            {t(getActivityLabelKey(type))}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ActivityGroupSection>
                ))}
              </View>
            </CollapsibleSection>

            <CollapsibleSection
              label={detailsLabel}
              summary={detailsSummary || undefined}
              expanded={expanded.details}
              onToggle={() => toggleSection('details')}>
              {showSprayDetails && spraySubTypes.length > 0 && (
                <View style={styles.sprayDetailsStack}>
                  <FieldInput
                    value={sprayWaterLiters}
                    onChangeText={setSprayWaterLiters}
                    placeholder={t('home.sprayWaterLiters')}
                    keyboardType="numeric"
                  />

                  {spraySubTypes.includes('fungicide') && (
                    <ProductUsagePicker
                      group="fungicide"
                      label={t('home.selectFungicide')}
                      hint={t('home.productMultiSelectHint')}
                      accentColor={FUNGICIDE_ACCENT}
                      products={fungicideProductList}
                      selected={fungicideProducts}
                      onToggle={toggleFungicide}
                      customValue={customFungicide}
                      onCustomChange={setCustomFungicide}
                      customPlaceholder={t('home.customFungicide')}
                      waterLiters={sprayWaterLiters}
                    />
                  )}

                  {spraySubTypes.includes('insecticide') && (
                    <ProductUsagePicker
                      group="insecticide"
                      label={t('home.selectInsecticide')}
                      hint={t('home.productMultiSelectHint')}
                      accentColor={INSECTICIDE_ACCENT}
                      products={insecticideProductList}
                      selected={insecticideProducts}
                      onToggle={toggleInsecticide}
                      customValue={customInsecticide}
                      onCustomChange={setCustomInsecticide}
                      customPlaceholder={t('home.customInsecticide')}
                      waterLiters={sprayWaterLiters}
                    />
                  )}

                  {spraySubTypes.includes('bactericide') && (
                    <ProductUsagePicker
                      group="bactericide"
                      label={t('home.selectBactericide')}
                      hint={t('home.productMultiSelectHint')}
                      accentColor={BACTERICIDE_ACCENT}
                      products={bactericideProductList}
                      selected={bactericideProducts}
                      onToggle={toggleBactericide}
                      customValue={customBactericide}
                      onCustomChange={setCustomBactericide}
                      customPlaceholder={t('home.customBactericide')}
                      waterLiters={sprayWaterLiters}
                    />
                  )}

                  {spraySubTypes.includes('pgr') && (
                    <ProductUsagePicker
                      group="pgr"
                      label={t('home.selectPgr')}
                      hint={t('home.productMultiSelectHint')}
                      accentColor={PGR_ACCENT}
                      products={pgrProductList}
                      selected={pgrProducts}
                      onToggle={togglePgr}
                      customValue={customPgr}
                      onCustomChange={setCustomPgr}
                      customPlaceholder={t('home.customPgr')}
                      waterLiters={sprayWaterLiters}
                    />
                  )}

                  {spraySubTypes.includes('fertilizer_spray') && (
                    <ProductUsagePicker
                      group="fertilizer_spray"
                      label={t('home.selectFertilizerSpray')}
                      hint={t('home.productMultiSelectHint')}
                      accentColor={FERTILIZER_SPRAY_ACCENT}
                      products={fertilizerSprayProductList}
                      selected={fertilizerSprayProducts}
                      onToggle={toggleFertilizerSpray}
                      customValue={customFertilizerSpray}
                      onCustomChange={setCustomFertilizerSpray}
                      customPlaceholder={t('home.customFertilizerSpray')}
                      waterLiters={sprayWaterLiters}
                    />
                  )}

                  {spraySubTypes.includes('micronutrient_spray') && (
                    <ProductUsagePicker
                      group="micronutrient_spray"
                      label={t('home.selectMicronutrient')}
                      hint={t('home.productMultiSelectHint')}
                      accentColor={MICRONUTRIENT_ACCENT}
                      products={micronutrientProductList}
                      selected={micronutrientProducts}
                      onToggle={toggleMicronutrient}
                      customValue={customMicronutrient}
                      onCustomChange={setCustomMicronutrient}
                      customPlaceholder={t('home.customMicronutrient')}
                      waterLiters={sprayWaterLiters}
                    />
                  )}

                  {spraySubTypes.includes('water_ph_balancer') && (
                    <ProductUsagePicker
                      group="water_ph_balancer"
                      label={t('home.selectWaterPhBalancer')}
                      hint={t('home.waterPhBalancerHint')}
                      accentColor={PH_BALANCER_ACCENT}
                      products={waterPhBalancerProductList}
                      selected={waterPhBalancerProducts}
                      onToggle={toggleWaterPhBalancer}
                      customValue={customWaterPhBalancer}
                      onCustomChange={setCustomWaterPhBalancer}
                      customPlaceholder={t('home.customWaterPhBalancer')}
                      waterLiters={sprayWaterLiters}
                    />
                  )}

                  {spraySubTypes.includes('spreader_sticker') && (
                    <ProductUsagePicker
                      group="spreader_sticker"
                      label={t('home.selectSpreaderSticker')}
                      hint={t('home.productMultiSelectHint')}
                      accentColor={SPREADER_STICKER_ACCENT}
                      products={spreaderStickerProductList}
                      selected={spreaderStickerProducts}
                      onToggle={toggleSpreaderSticker}
                      customValue={customSpreaderSticker}
                      onCustomChange={setCustomSpreaderSticker}
                      customPlaceholder={t('home.customSpreaderSticker')}
                      waterLiters={sprayWaterLiters}
                    />
                  )}
                </View>
              )}

              {showIrrigationDetails && irrigationSubTypes.length > 0 && (
                <View style={styles.sprayDetailsStack}>
                  {(irrigationSubTypes.includes('nutrient') ||
                    irrigationSubTypes.includes('nematicide_drench') ||
                    irrigationSubTypes.includes('biological')) && (
                    <FieldInput
                      value={sprayWaterLiters}
                      onChangeText={setSprayWaterLiters}
                      placeholder={t('home.sprayWaterLiters')}
                      keyboardType="numeric"
                    />
                  )}

                  <View style={styles.durationRow}>
                    <FieldInput
                      value={waterHours}
                      onChangeText={setWaterHours}
                      placeholder={t('home.hours')}
                      keyboardType="numeric"
                      flex
                    />
                    <FieldInput
                      value={waterMinutes}
                      onChangeText={setWaterMinutes}
                      placeholder={t('home.minutes')}
                      keyboardType="numeric"
                      flex
                    />
                  </View>

                  {irrigationSubTypes.includes('nutrient') && (
                    <ProductUsagePicker
                      group="nutrient"
                      label={t('home.selectNutrientIrrigation')}
                      hint={t('home.productMultiSelectHint')}
                      accentColor={NUTRIENT_IRRIGATION_ACCENT}
                      products={nutrientProductList}
                      selected={nutrientProducts}
                      onToggle={toggleNutrient}
                      customValue={customNutrient}
                      onCustomChange={setCustomNutrient}
                      customPlaceholder={t('home.customNutrientIrrigation')}
                      waterLiters={sprayWaterLiters}
                    />
                  )}

                  {irrigationSubTypes.includes('nematicide_drench') && (
                    <ProductUsagePicker
                      group="nematicide_drench"
                      label={t('home.selectNematicide')}
                      hint={t('home.productMultiSelectHint')}
                      accentColor={NEMATICIDE_ACCENT}
                      products={nematicideProductList}
                      selected={nematicideProducts}
                      onToggle={toggleNematicide}
                      customValue={customNematicide}
                      onCustomChange={setCustomNematicide}
                      customPlaceholder={t('home.customNematicide')}
                      waterLiters={sprayWaterLiters}
                    />
                  )}

                  {irrigationSubTypes.includes('biological') && (
                    <>
                      <Text style={styles.productSectionLabel}>{t('home.moonPhase')}</Text>
                      <Text style={styles.productHint}>{t('home.moonPhaseHint')}</Text>
                      <View style={styles.moonPhaseRow}>
                        {(['full_moon', 'half_moon'] as MoonPhase[]).map((phase) => {
                          const selected = moonPhase === phase;
                          return (
                            <Pressable
                              key={phase}
                              onPress={() => setMoonPhase(phase)}
                              style={[
                                styles.moonPhaseBtn,
                                selected && styles.moonPhaseBtnSelected,
                              ]}>
                              <Text
                                style={[
                                  styles.moonPhaseBtnText,
                                  selected && styles.moonPhaseBtnTextSelected,
                                ]}>
                                {t(`home.moonPhases.${phase}`)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      <ProductUsagePicker
                        group="biological"
                        label={t('home.selectBiological')}
                        hint={t('home.biologicalHint')}
                        accentColor={BIOLOGICAL_ACCENT}
                        products={biologicalProductList}
                        selected={biologicalProducts}
                        onToggle={toggleBiological}
                        customValue={customBiological}
                        onCustomChange={setCustomBiological}
                        customPlaceholder={t('home.customBiological')}
                        waterLiters={sprayWaterLiters}
                      />
                    </>
                  )}
                </View>
              )}

              {singleActivity && isFertilizerActivity(singleActivity) && spraySubTypes.length === 0 && irrigationSubTypes.length === 0 && (
                <>
                  <FieldInput
                    value={productName}
                    onChangeText={setProductName}
                    placeholder={t('home.productName')}
                  />
                  <View style={styles.durationRow}>
                    <FieldInput
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder={t('schedule.quantity')}
                      keyboardType="numeric"
                      flex
                    />
                    <FieldInput value={unit} onChangeText={setUnit} placeholder={t('home.unit')} flex />
                  </View>
                </>
              )}

              {singleActivity &&
                isCulturalActivity(singleActivity) &&
                spraySubTypes.length === 0 &&
                irrigationSubTypes.length === 0 && (
                  <Text style={styles.fieldHint}>{t('home.culturalActivityHint')}</Text>
                )}

              {singleActivity &&
                isWorkerSpendActivity(singleActivity) &&
                spraySubTypes.length === 0 &&
                irrigationSubTypes.length === 0 && (
                  <WorkerSpendFields
                    workName={workName}
                    onWorkNameChange={setWorkName}
                    selectedWorker={selectedWorker}
                    onSelectedWorkerChange={setSelectedWorker}
                    customWorker={customWorker}
                    onCustomWorkerChange={setCustomWorker}
                    workerSpend={workerSpend}
                    onWorkerSpendChange={setWorkerSpend}
                  />
                )}
            </CollapsibleSection>

            <CollapsibleSection
              label={t('home.notesOptional')}
              summary={notes.trim() || undefined}
              expanded={expanded.notes}
              onToggle={() => toggleSection('notes')}>
              <FieldInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t('schedule.notes')}
                multiline
              />
            </CollapsibleSection>

            <CollapsibleSection
              label={t('home.activityCostOptional')}
              summary={cost.trim() ? `₹ ${cost}` : undefined}
              expanded={expanded.cost}
              onToggle={() => toggleSection('cost')}>
              <View style={styles.costRow}>
                <View style={styles.currencyBox}>
                  <Text style={styles.fieldTextBold}>INR</Text>
                </View>
                <FieldInput
                  value={cost}
                  onChangeText={setCost}
                  placeholder={t('home.costExample')}
                  keyboardType="numeric"
                  flex
                />
              </View>
            </CollapsibleSection>

            <CollapsibleSection
              label={t('home.attachPhotoOptional')}
              expanded={expanded.photo}
              onToggle={() => toggleSection('photo')}>
              <View style={styles.photoRow}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.photoSlot}>
                    <Text style={styles.photoPlus}>+</Text>
                  </View>
                ))}
              </View>
            </CollapsibleSection>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}>
              <Text style={styles.saveText}>
                {saving ? t('home.saving') : t('schedule.save')}
              </Text>
            </Pressable>

            {!canSave ? (
              <Text style={styles.saveHint}>{t('home.selectActivityPrompt')}</Text>
            ) : null}

            <Pressable onPress={onClose} style={styles.cancelLink}>
              <Text style={styles.cancelText}>{t('schedule.cancel')}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showCalendar} animationType="slide" transparent onRequestClose={() => setShowCalendar(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCalendar(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <MonthCalendar
              month={month}
              selectedDate={date}
              activeDates={activeDates}
              onMonthChange={setMonth}
              onSelectDate={(d) => {
                setDate(d);
                setShowCalendar(false);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  header: { gap: Spacing.one, marginBottom: Spacing.one },
  headerTitle: { fontSize: 28, fontWeight: '700', color: TEXT },
  headerLine: { height: 4, width: 48, borderRadius: 2, backgroundColor: GREEN },
  section: {
    backgroundColor: SECTION_BG,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionHeaderText: { flex: 1, gap: 4 },
  sectionBody: { gap: Spacing.two, paddingTop: Spacing.one },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: TEXT },
  sectionSummary: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '500' },
  chevron: { fontSize: 12, color: GREEN, fontWeight: '700', paddingTop: 2 },
  multiSelectHint: { fontSize: 12, color: TEXT_SECONDARY, fontStyle: 'italic' },
  activityGroupsStack: { gap: Spacing.three },
  activityGroup: {
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  activityGroupTitle: { fontSize: 16, fontWeight: '700' },
  activityGroupHint: { fontSize: 12, color: TEXT_SECONDARY, fontStyle: 'italic' },
  fieldHint: { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 20 },
  fieldText: { fontSize: 15, color: TEXT },
  fieldTextBold: { fontSize: 14, fontWeight: '700', color: TEXT },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: INPUT_BG,
  },
  plotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    padding: Spacing.three,
    backgroundColor: INPUT_BG,
  },
  plotRowSelected: { borderColor: GREEN },
  plotText: { flex: 1, gap: 2 },
  plotName: { fontSize: 14, fontWeight: '700', color: TEXT },
  plotNameSelected: { color: GREEN },
  plotCrop: { fontSize: 13, color: TEXT_SECONDARY },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  activityBtn: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    borderRadius: 12,
    minHeight: 56,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    position: 'relative',
  },
  activityBtnSelected: { borderColor: GREEN, borderWidth: 2 },
  checkMark: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 12,
    color: GREEN,
    fontWeight: '700',
  },
  activityBtnText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: TEXT,
  },
  activityBtnTextSelected: { color: GREEN, fontWeight: '700' },
  sprayDetailsStack: { gap: Spacing.three },
  detailBlock: {
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  detailBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  productSectionLabel: { fontSize: 15, fontWeight: '700', color: TEXT, flex: 1 },
  productHint: { fontSize: 12, color: TEXT_SECONDARY, fontStyle: 'italic' },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  productList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: BORDER,
    maxWidth: '48%',
  },
  productChipSelected: {},
  chipCheck: { fontSize: 11, color: '#FFFFFF', fontWeight: '700' },
  productChipText: { fontSize: 12, color: TEXT, fontWeight: '500', flexShrink: 1 },
  productChipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  moonPhaseRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  moonPhaseBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
  },
  moonPhaseBtnSelected: {
    borderColor: BIOLOGICAL_ACCENT,
    backgroundColor: '#EEF2FF',
  },
  moonPhaseBtnText: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY, textAlign: 'center' },
  moonPhaseBtnTextSelected: { color: BIOLOGICAL_ACCENT, fontWeight: '700' },
  durationRow: { flexDirection: 'row', gap: Spacing.two },
  costRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  currencyBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: INPUT_BG,
  },
  field: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    color: TEXT,
    backgroundColor: INPUT_BG,
  },
  fieldFlex: { flex: 1 },
  fieldMultiline: { minHeight: 72, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', gap: Spacing.two },
  photoSlot: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: INPUT_BG,
  },
  photoPlus: { fontSize: 28, color: '#9CA3AF' },
  saveBtn: {
    borderRadius: 28,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
    backgroundColor: GREEN,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveHint: {
    textAlign: 'center',
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: Spacing.one,
  },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cancelLink: { alignItems: 'center', paddingVertical: Spacing.two },
  cancelText: { color: GREEN, fontSize: 14, fontWeight: '600' },
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
});
