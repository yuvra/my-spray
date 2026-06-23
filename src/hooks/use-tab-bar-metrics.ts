import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_CONTENT_HEIGHT = 56;

/** Tab bar height including Android/iOS system bottom inset (nav buttons, home indicator). */
export function useTabBarMetrics() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);

  return {
    height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
    paddingBottom: bottomInset,
    paddingTop: 6,
    /** Use for ScrollView contentContainerStyle paddingBottom */
    contentInset: TAB_BAR_CONTENT_HEIGHT + bottomInset + 16,
  };
}
