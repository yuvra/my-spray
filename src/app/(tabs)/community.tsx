import { ScrollView, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CropGroupCard } from '@/components/ChatBubble';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CHAT_GROUPS, type ChatGroupId } from '@/services/chatService';
import { BottomTabInset, Spacing } from '@/constants/theme';

export default function CommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const openGroup = (id: ChatGroupId) => {
    router.push(`/community/${id}` as Href);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="smallBold">{t('community.groups')}</ThemedText>
        {CHAT_GROUPS.map((group) => (
          <CropGroupCard
            key={group.id}
            title={group.id === 'general' ? t('community.general') : t(`crops.${group.crop}`)}
            onPress={() => openGroup(group.id)}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.three, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.four },
});
