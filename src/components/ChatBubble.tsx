import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChatMessage } from '@/types';

type Props = {
  message: ChatMessage;
  isOwn: boolean;
};

export function ChatBubble({ message, isOwn }: Props) {
  const theme = useTheme();
  const bg = isOwn ? theme.primary : theme.backgroundElement;
  const textColor = isOwn ? '#FFFFFF' : theme.text;

  return (
    <View style={[styles.row, isOwn && styles.ownRow]}>
      <View style={[styles.bubble, { backgroundColor: bg }]}>
        {!isOwn && (
          <ThemedText type="smallBold" style={{ color: theme.primaryLight }}>
            {message.userName}
          </ThemedText>
        )}
        {message.type === 'text' && (
          <ThemedText style={{ color: textColor }}>{message.text}</ThemedText>
        )}
        {message.type === 'image' && message.mediaUrl && (
          <Image source={{ uri: message.mediaUrl }} style={styles.media} resizeMode="cover" />
        )}
        {message.type === 'video' && message.mediaUrl && (
          <ThemedText style={{ color: textColor }}>🎬 {message.text || 'Video'}</ThemedText>
        )}
        <ThemedText type="small" style={[styles.time, { color: isOwn ? '#FFFFFFAA' : theme.textSecondary }]}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </View>
    </View>
  );
}

export function CropGroupCard({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress} style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <ThemedText type="smallBold">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {t('community.joinGroup')} →
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: Spacing.one },
  ownRow: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    padding: Spacing.two,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  time: { fontSize: 10, alignSelf: 'flex-end' },
  media: { width: 200, height: 150, borderRadius: Spacing.two },
  groupCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.one,
  },
});
