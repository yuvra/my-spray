import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { getFirebaseDb, getFirebaseStorage, isFirebaseConfigured } from '@/lib/firebase';
import type { ChatMessage, CropType } from '@/types';

export type ChatGroupId = CropType | 'general';

export const CHAT_GROUPS: { id: ChatGroupId; crop: ChatGroupId }[] = [
  { id: 'pomegranate', crop: 'pomegranate' },
  { id: 'grapes', crop: 'grapes' },
  { id: 'sugarcane', crop: 'sugarcane' },
  { id: 'ginger', crop: 'ginger' },
  { id: 'general', crop: 'general' },
];

export async function joinChatGroup(groupId: ChatGroupId, userId: string) {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(getFirebaseDb(), 'chatGroups', groupId, 'members', userId), {
    joinedAt: new Date().toISOString(),
    role: 'member',
  });
}

export async function leaveChatGroup(groupId: ChatGroupId, userId: string) {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(getFirebaseDb(), 'chatGroups', groupId, 'members', userId), {
    joinedAt: null,
  });
}

export function subscribeMessages(
  groupId: ChatGroupId,
  callback: (messages: ChatMessage[]) => void,
) {
  if (!isFirebaseConfigured) return () => {};
  const q = query(
    collection(getFirebaseDb(), 'chatGroups', groupId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage));
  });
}

export async function sendTextMessage(
  groupId: ChatGroupId,
  userId: string,
  userName: string,
  text: string,
) {
  if (!isFirebaseConfigured) return;
  await addDoc(collection(getFirebaseDb(), 'chatGroups', groupId, 'messages'), {
    userId,
    userName,
    type: 'text',
    text,
    createdAt: new Date().toISOString(),
  });
  await updateDoc(doc(getFirebaseDb(), 'chatGroups', groupId), {
    lastMessageAt: new Date().toISOString(),
  });
}

export async function sendMediaMessage(
  groupId: ChatGroupId,
  userId: string,
  userName: string,
  uri: string,
  type: 'image' | 'video',
  text = '',
) {
  if (!isFirebaseConfigured) return;
  const msgRef = doc(collection(getFirebaseDb(), 'chatGroups', groupId, 'messages'));
  const storageRef = ref(getFirebaseStorage(), `chat/${groupId}/${msgRef.id}`);
  const response = await fetch(uri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
  const mediaUrl = await getDownloadURL(storageRef);
  await setDoc(msgRef, {
    userId,
    userName,
    type,
    text,
    mediaUrl,
    createdAt: new Date().toISOString(),
  });
  await updateDoc(doc(getFirebaseDb(), 'chatGroups', groupId), {
    lastMessageAt: new Date().toISOString(),
  });
}
