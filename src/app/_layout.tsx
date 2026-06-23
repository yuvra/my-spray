import '@/i18n';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from 'expo-router/react-navigation';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useResolvedColorScheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/useAuthStore';

const LightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => Boolean(s.user || s.isDemo || s.isPhoneVerified));

  useEffect(() => {
    if (!isInitialized) return;
    const inAuth = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login' as Href);
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)' as Href);
    }
  }, [isAuthenticated, isInitialized, segments, router]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const scheme = useResolvedColorScheme();
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    return initialize();
  }, [initialize]);

  return (
    <SafeAreaProvider>
      <NavThemeProvider value={scheme === 'dark' ? DarkNavTheme : LightNavTheme}>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="community/[cropId]" options={{ headerShown: true, presentation: 'modal' }} />
            <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
          </Stack>
        </AuthGate>
      </NavThemeProvider>
    </SafeAreaProvider>
  );
}
