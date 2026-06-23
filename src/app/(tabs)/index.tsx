import { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';

import { WeatherWidget } from '@/components/WeatherWidget';
import { FarmActivitySection } from '@/components/home/FarmActivitySection';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { fetchWeather } from '@/services/weatherService';
import { useWeatherStore } from '@/stores/useWeatherStore';
import type { Language } from '@/types';

export default function HomeScreen() {
  const { i18n } = useTranslation();
  const weather = useWeatherStore((s) => s.weather);
  const setWeather = useWeatherStore((s) => s.setWeather);
  const setLoading = useWeatherStore((s) => s.setLoading);
  const isLoading = useWeatherStore((s) => s.isLoading);

  const lang = (i18n.language as Language) ?? 'en';

  useEffect(() => {
    (async () => {
      setLoading(true);
      const langCode = lang === 'hi' ? 'hi' : lang === 'mr' ? 'mr' : 'en';
      const fallback = async () => {
        const data = await fetchWeather(18.5204, 73.8567, langCode);
        setWeather(data);
      };
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const servicesOn = await Location.hasServicesEnabledAsync();
        if (status === 'granted' && servicesOn) {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const data = await fetchWeather(
              loc.coords.latitude,
              loc.coords.longitude,
              langCode,
            );
            setWeather(data);
            return;
          } catch {
            // GPS off or timeout — use default city
          }
        }
        await fallback();
      } catch {
        try {
          await fallback();
        } catch {
          setWeather(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [lang, setLoading, setWeather]);

  return (
    <ThemedView style={styles.container}>
      <WeatherWidget weather={weather} isLoading={isLoading} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FarmActivitySection />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
});
