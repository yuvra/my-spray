import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { makeTabIcon } from '@/components/icons/tab-icon';
import { useTheme } from '@/hooks/use-theme';
import { useTabBarMetrics } from '@/hooks/use-tab-bar-metrics';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const tabBar = useTabBarMetrics();
  useFirestoreSync();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: tabBar.height,
          paddingBottom: tabBar.paddingBottom,
          paddingTop: tabBar.paddingTop,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarLabel: t('tabs.home'),
          tabBarIcon: makeTabIcon('home'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: t('tabs.schedule'),
          tabBarLabel: t('tabs.schedule'),
          tabBarIcon: makeTabIcon('schedule'),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: t('tabs.expenses'),
          tabBarLabel: t('tabs.expenses'),
          tabBarIcon: makeTabIcon('expenses'),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs.community'),
          tabBarLabel: t('tabs.community'),
          tabBarIcon: makeTabIcon('community'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: makeTabIcon('settings'),
        }}
      />
    </Tabs>
  );
}
