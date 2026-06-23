import type { ColorValue } from 'react-native';

import { TabBarIcon, type TabIconName } from '@/components/icons/AppIcons';

type TabBarIconRenderProps = {
  color: ColorValue;
  size: number;
  focused: boolean;
};

export function makeTabIcon(name: TabIconName) {
  return ({ color, size, focused }: TabBarIconRenderProps) => (
    <TabBarIcon name={name} color={String(color)} size={size ?? 24} focused={focused} />
  );
}
