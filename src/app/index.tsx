import { Redirect, type Href } from 'expo-router';

import { useAuthStore } from '@/stores/useAuthStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.user || s.isDemo));
  if (isAuthenticated) {
    return <Redirect href={'/(tabs)' as Href} />;
  }
  return <Redirect href={'/(auth)/login' as Href} />;
}
