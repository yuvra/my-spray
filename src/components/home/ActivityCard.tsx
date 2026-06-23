import type { ReactNode } from 'react';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  FertActivityIcon,
  BactericideDetailIcon,
  FertilizerSprayDetailIcon,
  FungicideDetailIcon,
  InfoIcon,
  EditIcon,
  DeleteIcon,
  InsecticideDetailIcon,
  MicronutrientDetailIcon,
  NotesDetailIcon,
  PhBalancerDetailIcon,
  PgrDetailIcon,
  SpreaderStickerDetailIcon,
  SprayActivityIcon,
  WaterActivityIcon,
} from '@/components/icons/AppIcons';
import { Spacing } from '@/constants/theme';
import type { MoonPhase } from '@/types';
import type { ActivityDetail, ActivityDetailKey, ActivityVariant } from '@/utils/activity-display';
import { getAnimatedCardIcon } from '@/components/icons/AnimatedActivityCardIcons';

export type { ActivityVariant };

const TEXT = '#1F2937';
const TEXT_SECONDARY = '#4B5563';

const VARIANT_THEME: Record<
  ActivityVariant,
  { accent: string; tint: string; labelKey: string; chipBg: string; chipText: string }
> = {
  spray: {
    accent: '#2E7D32',
    tint: '#E8F5E9',
    labelKey: 'home.activityGroups.spray',
    chipBg: '#FFFFFF',
    chipText: '#1B5E20',
  },
  irrigation: {
    accent: '#0284C7',
    tint: '#E0F2FE',
    labelKey: 'home.activityGroups.irrigation',
    chipBg: '#FFFFFF',
    chipText: '#0369A1',
  },
  fertilizer: {
    accent: '#B45309',
    tint: '#FFEDD5',
    labelKey: 'home.activityGroups.soilFertilizer',
    chipBg: '#FFFFFF',
    chipText: '#92400E',
  },
  cultural: {
    accent: '#6B7280',
    tint: '#F3F4F6',
    labelKey: 'home.activityGroups.other',
    chipBg: '#FFFFFF',
    chipText: '#374151',
  },
  labour: {
    accent: '#7C3AED',
    tint: '#EDE9FE',
    labelKey: 'home.activityGroups.labour',
    chipBg: '#FFFFFF',
    chipText: '#5B21B6',
  },
};

const DETAIL_ICON: Record<ActivityDetailKey, (size: number) => ReactNode> = {
  fungicide: (size) => <FungicideDetailIcon size={size} />,
  insecticide: (size) => <InsecticideDetailIcon size={size} />,
  bactericide: (size) => <BactericideDetailIcon size={size} />,
  pgr: (size) => <PgrDetailIcon size={size} />,
  fertilizer_spray: (size) => <FertilizerSprayDetailIcon size={size} />,
  micronutrient_spray: (size) => <MicronutrientDetailIcon size={size} />,
  water_ph_balancer: (size) => <PhBalancerDetailIcon size={size} />,
  spreader_sticker: (size) => <SpreaderStickerDetailIcon size={size} />,
  plain: (size) => <WaterActivityIcon size={size} color="#0284C7" />,
  nutrient: (size) => <FertActivityIcon size={size} color="#0284C7" />,
  nematicide_drench: (size) => <InsecticideDetailIcon size={size} />,
  biological: (size) => <BactericideDetailIcon size={size} />,
  moon_phase: (size) => <WaterActivityIcon size={size} color="#F59E0B" />,
  duration: (size) => <WaterActivityIcon size={size} color="#0284C7" />,
  product: (size) => <FertActivityIcon size={size} color="#B45309" />,
  notes: (size) => <NotesDetailIcon size={size} />,
  other: (size) => <SprayActivityIcon size={size} color="#6B7280" />,
};

export function getCardIconForDetail(key: ActivityDetailKey, size = 28): ReactNode {
  return DETAIL_ICON[key](size);
}

export function getCardBadgeIcon(
  variant: ActivityVariant,
  size = 48,
  moonPhase?: MoonPhase,
): ReactNode {
  const animated = getAnimatedCardIcon(variant, size, moonPhase);
  if (animated) return animated;
  if (variant === 'fertilizer') return <FertActivityIcon size={size * 0.65} color="#B45309" />;
  return <SprayActivityIcon size={size * 0.65} color="#6B7280" />;
}

type Props = {
  icon?: ReactNode;
  title: string;
  details: ActivityDetail[];
  cost?: number;
  variant?: ActivityVariant;
  moonPhase?: MoonPhase;
  onEdit?: () => void;
  onDelete?: () => void;
};

function DetailRow({
  detail,
  theme,
}: {
  detail: ActivityDetail;
  theme: (typeof VARIANT_THEME)[ActivityVariant];
}) {
  const displayValue = detail.cardValue ?? detail.value;
  const chips = displayValue.includes('\n')
    ? displayValue.split('\n').map((s) => s.trim()).filter(Boolean)
    : displayValue.includes(',')
      ? displayValue.split(',').map((s) => s.trim()).filter(Boolean)
      : [displayValue];

  return (
    <View style={styles.detailBlock}>
      <View style={styles.detailHeader}>
        <View style={[styles.detailIconWrap, { backgroundColor: theme.chipBg }]}>
          {DETAIL_ICON[detail.key](18)}
        </View>
        <Text style={styles.detailLabel}>{detail.label}</Text>
      </View>
      <View style={styles.chipsRow}>
        {chips.map((chip) => (
          <View key={`${detail.key}-${chip}`} style={[styles.chip, { backgroundColor: theme.chipBg }]}>
            <Text style={[styles.chipText, { color: theme.chipText }]} numberOfLines={2}>
              {chip}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ActivityCard({
  icon,
  title,
  details,
  cost,
  variant = 'cultural',
  moonPhase,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const theme = VARIANT_THEME[variant];
  const badgeIcon = icon ?? getCardBadgeIcon(variant, 48, moonPhase);
  const [showFullText, setShowFullText] = useState(false);

  const modalBody = buildFullBody(title, details, cost, t);

  return (
    <>
      <View style={styles.cardOuter}>
        <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={[styles.iconBadge, { backgroundColor: theme.tint }]}>
              <View style={styles.iconInner}>{badgeIcon}</View>
            </View>
            <View style={styles.headerText}>
              <View style={styles.headerTop}>
                <View style={[styles.typePill, { backgroundColor: theme.tint }]}>
                  <Text style={[styles.typePillText, { color: theme.accent }]}>
                    {t(theme.labelKey)}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  {onEdit ? (
                    <Pressable
                      onPress={onEdit}
                      hitSlop={8}
                      style={[styles.iconActionBtn, { backgroundColor: theme.tint }]}
                      accessibilityRole="button"
                      accessibilityLabel={t('schedule.edit')}>
                      <EditIcon size={18} color={theme.accent} strokeWidth={2} />
                    </Pressable>
                  ) : null}
                  {onDelete ? (
                    <Pressable
                      onPress={onDelete}
                      hitSlop={8}
                      style={styles.iconActionBtnDanger}
                      accessibilityRole="button"
                      accessibilityLabel={t('schedule.delete')}>
                      <DeleteIcon size={18} color="#DC2626" strokeWidth={2} />
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => setShowFullText(true)}
                    hitSlop={8}
                    style={[styles.iconActionBtn, { backgroundColor: theme.tint }]}
                    accessibilityRole="button"
                    accessibilityLabel={t('home.viewFullActivity')}>
                    <InfoIcon size={18} color={theme.accent} strokeWidth={2} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            </View>
          </View>

          {details.length > 0 ? (
            <View style={[styles.details, { backgroundColor: theme.tint }]}>
              {details.map((detail, index) => (
                <DetailRow key={`${detail.key}-${index}`} detail={detail} theme={theme} />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <Modal
        visible={showFullText}
        animationType="fade"
        transparent
        onRequestClose={() => setShowFullText(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFullText(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalAccent, { backgroundColor: theme.accent }]} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('home.viewFullActivity')}</Text>
              <Pressable onPress={() => setShowFullText(false)} hitSlop={8}>
                <Text style={[styles.modalClose, { color: theme.accent }]}>{t('home.close')}</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalBody}>{modalBody}</Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function buildFullBody(
  title: string,
  details: ActivityDetail[],
  cost: number | undefined,
  t: (key: string) => string,
): string {
  const lines = [title];
  for (const detail of details) {
    lines.push('', `${detail.label}:`, detail.value);
  }
  if (cost != null && cost > 0) {
    lines.push('', `${t('schedule.cost')}: ₹${cost.toLocaleString('en-IN')}`);
  }
  return lines.join('\n');
}

const styles = StyleSheet.create({
  cardOuter: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  accentBar: { width: 5 },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 6 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typePillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionBtnDanger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  title: { fontSize: 16, fontWeight: '700', color: TEXT, lineHeight: 22 },
  details: {
    borderRadius: 12,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  detailBlock: { gap: 8 },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT,
    flex: 1,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 36 },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '75%',
  },
  modalAccent: { height: 4 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    paddingRight: Spacing.two,
  },
  modalClose: { fontSize: 14, fontWeight: '700' },
  modalScroll: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  modalBody: { fontSize: 15, lineHeight: 24, color: TEXT, fontWeight: '500' },
});
