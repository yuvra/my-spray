import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  formatWeatherDescription,
  getWeatherGradient,
  HumidityIcon,
  RainIcon,
  WindIcon,
} from '@/components/icons/WeatherIcons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getSprayAdvisory } from '@/services/weatherService';
import type { WeatherData } from '@/types';

type Props = {
  weather: WeatherData | null;
  isLoading?: boolean;
};

function StatChip({
  icon,
  value,
}: {
  icon: ReactNode;
  value: string;
}) {
  return (
    <View style={styles.chip}>
      {icon}
      <ThemedText style={styles.chipValue} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

export function WeatherWidget({ weather, isLoading }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top + Spacing.one }]}>
        <ActivityIndicator size="small" color="#FFFFFF" />
        <ThemedText style={styles.loadingText}>{t('home.loadingWeather')}</ThemedText>
      </View>
    );
  }

  if (!weather) return null;

  const gradient = getWeatherGradient(weather.conditionType, weather.isDaytime);
  const advisory = getSprayAdvisory(weather);
  const advisoryColor = advisory === 'avoid' ? '#FCD34D' : '#86EFAC';

  return (
    <LinearGradient
      colors={[...gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + Spacing.one }]}>
      <View style={styles.topRow}>
        <View style={styles.locationWrap}>
          <ThemedText style={styles.locationName} numberOfLines={1}>
            {weather.locationName}
          </ThemedText>
          <View style={styles.advisoryRow}>
            <View style={[styles.advisoryDot, { backgroundColor: advisoryColor }]} />
            <ThemedText style={styles.advisoryHint} numberOfLines={1}>
              {formatWeatherDescription(weather.description)} ·{' '}
              {t('home.feelsLike', { temp: weather.feelsLike })}
            </ThemedText>
          </View>
        </View>

        <View style={styles.tempBlock}>
          <ThemedText style={styles.temp}>{weather.temp}°</ThemedText>
          <Image
            source={{ uri: weather.icon }}
            style={styles.weatherIcon}
            contentFit="contain"
            accessibilityLabel={weather.description}
          />
        </View>
      </View>

      <View style={styles.chipsRow}>
        <StatChip
          icon={<RainIcon size={13} color="#FFFFFF" />}
          value={`${weather.rainProbability}%`}
        />
        <StatChip
          icon={<HumidityIcon size={13} color="#FFFFFF" />}
          value={`${weather.humidity}%`}
        />
        <StatChip
          icon={<WindIcon size={13} color="#FFFFFF" />}
          value={`${weather.windSpeed} km/h`}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: Spacing.two,
  },
  loadingWrap: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#4A8FC7',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  loadingText: { color: '#FFFFFF', fontSize: 12 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  locationWrap: { flex: 1, minWidth: 0 },
  locationName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  advisoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  advisoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  advisoryHint: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    flex: 1,
    lineHeight: 14,
  },
  tempBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  temp: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  weatherIcon: {
    width: 40,
    height: 40,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    minWidth: 0,
  },
  chipValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
});
