import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ChatBubble } from '@/components/ChatBubble';
import { Input } from '@/components/ui/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  joinChatGroup,
  sendMediaMessage,
  sendTextMessage,
  subscribeMessages,
  type ChatGroupId,
} from '@/services/chatService';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ChatMessage } from '@/types';

const DEMO_KEY = 'demo_chat_messages';

export default function ChatRoomScreen() {
  const { cropId } = useLocalSearchParams<{ cropId: ChatGroupId }>();
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const isDemo = useAuthStore((s) => s.isDemo);
  const userId = user?.uid ?? (isDemo ? 'demo-user' : '');
  const userName = profile?.name ?? 'Farmer';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const groupId = (cropId ?? 'general') as ChatGroupId;
  const title = groupId === 'general' ? t('community.general') : t(`crops.${groupId}`);

  useEffect(() => {
    if (!userId) return;

    if (isFirebaseConfigured && !isDemo) {
      joinChatGroup(groupId, userId);
      return subscribeMessages(groupId, setMessages);
    }

    (async () => {
      const raw = await AsyncStorage.getItem(`${DEMO_KEY}_${groupId}`);
      setMessages(raw ? JSON.parse(raw) : []);
    })();

    return () => {};
  }, [groupId, userId, isDemo]);

  const persistDemo = async (msgs: ChatMessage[]) => {
    await AsyncStorage.setItem(`${DEMO_KEY}_${groupId}`, JSON.stringify(msgs));
    setMessages(msgs);
  };

  const handleSend = async () => {
    if (!text.trim() || !userId) return;
    const trimmed = text.trim();
    setText('');

    if (isFirebaseConfigured && !isDemo) {
      await sendTextMessage(groupId, userId, userName, trimmed);
      return;
    }

    const msg: ChatMessage = {
      id: Date.now().toString(),
      userId,
      userName,
      type: 'text',
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    await persistDemo([...messages, msg]);
  };

  const handleMedia = async (mediaType: 'image' | 'video') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'image' ? ['images'] : ['videos'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;

    if (isFirebaseConfigured && !isDemo) {
      await sendMediaMessage(groupId, userId, userName, uri, mediaType);
      return;
    }

    const msg: ChatMessage = {
      id: Date.now().toString(),
      userId,
      userName,
      type: mediaType,
      text: mediaType === 'video' ? 'Video shared' : '',
      mediaUrl: uri,
      createdAt: new Date().toISOString(),
    };
    await persistDemo([...messages, msg]);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title, headerShown: true }} />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => <ChatBubble message={item} isOwn={item.userId === userId} />}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <Pressable onPress={() => handleMedia('image')} style={styles.attach}>
            <ThemedText type="small">📷</ThemedText>
          </Pressable>
          <Pressable onPress={() => handleMedia('video')} style={styles.attach}>
            <ThemedText type="small">🎬</ThemedText>
          </Pressable>
          <Input
            placeholder={t('community.typeMessage')}
            value={text}
            onChangeText={setText}
            style={styles.input}
          />
          <Pressable onPress={handleSend} style={styles.send}>
            <ThemedText style={styles.sendText}>{t('community.send')}</ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.three, gap: Spacing.one, flexGrow: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    gap: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: '#DDE5D8',
  },
  input: { flex: 1 },
  attach: { padding: Spacing.two },
  send: {
    backgroundColor: '#9B1B30',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  sendText: { color: '#FFF', fontWeight: '700' },
});
