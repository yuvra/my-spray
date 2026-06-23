import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CROPS } from '@/data/crop-schedules';
import { Spacing } from '@/constants/theme';
import type { CropType } from '@/types';

const ONBOARDING_KEY = 'onboarding_complete';

export async function isOnboardingComplete(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ONBOARDING_KEY);
  return v === 'true';
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ThemedText type="subtitle">{t('appName')}</ThemedText>
        <ThemedText themeColor="textSecondary">
          Track spray & fertilizer schedules, estimate costs, check weather, and connect with fellow farmers.
        </ThemedText>
        {CROPS.map((crop) => (
          <Pressable key={crop} style={styles.crop}>
            <ThemedText type="smallBold">{t(`crops.${crop}`)}</ThemedText>
          </Pressable>
        ))}
        <Button title={t('common.ok')} onPress={finish} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  crop: {
    padding: Spacing.two,
    backgroundColor: '#FCE4E0',
    borderRadius: Spacing.two,
  },
});
