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
  duration: (size) => <WaterActivityIcon size={size} color="#0284C7" />,
  product: (size) => <FertActivityIcon size={size} color="#B45309" />,
  notes: (size) => <NotesDetailIcon size={size} />,
  other: (size) => <SprayActivityIcon size={size} color="#6B7280" />,
};

export function getCardIconForDetail(key: ActivityDetailKey, size = 28): ReactNode {
  return DETAIL_ICON[key](size);
}

export function getCardBadgeIcon(variant: ActivityVariant, size = 48): ReactNode {
  const animated = getAnimatedCardIcon(variant, size);
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
};

function DetailRow({
  detail,
  theme,
  onInfoPress,
}: {
  detail: ActivityDetail;
  theme: (typeof VARIANT_THEME)[ActivityVariant];
  onInfoPress: (label: string, value: string) => void;
}) {
  const chips = detail.value.includes(',')
    ? detail.value.split(',').map((s) => s.trim()).filter(Boolean)
    : [detail.value];
  const isLong = detail.value.length > 36 || chips.length > 2;

  return (
    <View style={styles.detailBlock}>
      <View style={styles.detailHeader}>
        <View style={[styles.detailIconWrap, { backgroundColor: theme.chipBg }]}>
          {DETAIL_ICON[detail.key](18)}
        </View>
        <Text style={styles.detailLabel}>{detail.label}</Text>
        {isLong ? (
          <Pressable
            onPress={() => onInfoPress(detail.label, detail.value)}
            hitSlop={8}
            style={styles.rowInfoBtn}
            accessibilityRole="button"
            accessibilityLabel="View full text">
            <InfoIcon size={16} color={theme.accent} strokeWidth={1.8} />
          </Pressable>
        ) : null}
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
}: Props) {
  const { t } = useTranslation();
  const theme = VARIANT_THEME[variant];
  const badgeIcon = icon ?? getCardBadgeIcon(variant);
  const [showFullText, setShowFullText] = useState(false);
  const [expandedSection, setExpandedSection] = useState<{ label: string; value: string } | null>(
    null,
  );

  const openFullCard = () => {
    setExpandedSection(null);
    setShowFullText(true);
  };

  const openSection = (label: string, value: string) => {
    setExpandedSection({ label, value });
    setShowFullText(true);
  };

  const modalTitle = expandedSection?.label ?? t('home.viewFullActivity');
  const modalBody = expandedSection?.value ?? buildFullBody(title, details, cost, t);

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
              <View style={[styles.typePill, { backgroundColor: theme.tint }]}>
                <Text style={[styles.typePillText, { color: theme.accent }]}>
                  {t(theme.labelKey)}
                </Text>
              </View>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={2}>
                  {title}
                </Text>
                <Pressable
                  onPress={openFullCard}
                  hitSlop={8}
                  style={styles.titleInfoBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.viewFullActivity')}>
                  <InfoIcon size={18} color={theme.accent} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          </View>

          {details.length > 0 ? (
            <View style={[styles.details, { backgroundColor: theme.tint }]}>
              {details.map((detail, index) => (
                <DetailRow
                  key={`${detail.key}-${index}`}
                  detail={detail}
                  theme={theme}
                  onInfoPress={openSection}
                />
              ))}
            </View>
          ) : null}

          {cost != null && cost > 0 ? (
            <View style={styles.footer}>
              <View style={[styles.costPill, { backgroundColor: theme.accent }]}>
                <Text style={styles.costLabel}>{t('home.costLabel')}</Text>
                <Text style={styles.costValue}>₹ {cost}</Text>
              </View>
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
              <Text style={styles.modalTitle}>{modalTitle}</Text>
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
    lines.push('', `${t('home.costLabel')}: ₹ ${cost}`);
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typePillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: TEXT, lineHeight: 22 },
  titleInfoBtn: { paddingTop: 2 },
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
  rowInfoBtn: { padding: 2 },
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Spacing.one,
  },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  costLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  costValue: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
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
