import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, Input } from '@/components/ui/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { saveUserProfile } from '@/services/firestoreService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Language, ThemeMode } from '@/types';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isDemo = useAuthStore((s) => s.isDemo);

  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const [name, setName] = useState(profile?.name ?? '');
  const [village, setVillage] = useState(profile?.village ?? '');

  const handleSaveProfile = async () => {
    if (!profile) return;
    const updated = { ...profile, name, village, language };
    setProfile(updated);
    if (user && !isDemo) {
      await saveUserProfile(updated);
    }
    Alert.alert(t('settings.saveProfile'));
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login' as Href);
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: t('settings.english') },
    { code: 'hi', label: t('settings.hindi') },
    { code: 'mr', label: t('settings.marathi') },
  ];

  const themes: { code: ThemeMode; label: string }[] = [
    { code: 'system', label: t('settings.themeSystem') },
    { code: 'light', label: t('settings.themeLight') },
    { code: 'dark', label: t('settings.themeDark') },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <ThemedText type="smallBold">{t('settings.profile')}</ThemedText>
          <Input label={t('settings.name')} value={name} onChangeText={setName} />
          <Input label={t('settings.village')} value={village} onChangeText={setVillage} />
          <ThemedText type="small" themeColor="textSecondary">
            {t('settings.phone')}: {profile?.phone}
          </ThemedText>
          <Button title={t('settings.saveProfile')} onPress={handleSaveProfile} />
        </Card>

        <Card>
          <ThemedText type="smallBold">{t('settings.language')}</ThemedText>
          <View style={styles.row}>
            {languages.map((l) => (
              <Pressable
                key={l.code}
                onPress={() => setLanguage(l.code)}
                style={[styles.option, language === l.code && styles.optionActive]}>
                <ThemedText type="small">{l.label}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <ThemedText type="smallBold">{t('settings.theme')}</ThemedText>
          <View style={styles.row}>
            {themes.map((th) => (
              <Pressable
                key={th.code}
                onPress={() => setMode(th.code)}
                style={[styles.option, mode === th.code && styles.optionActive]}>
                <ThemedText type="small">{th.label}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Button title={t('settings.logout')} onPress={handleLogout} variant="danger" />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.three, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  option: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: '#FCE4E0',
  },
  optionActive: { backgroundColor: '#9B1B3033' },
});
