import { requireOptionalNativeModule, Platform } from 'expo-modules-core';

export type VerificationSupportInfo = {
  simSlot: number;
  isSupported: boolean;
  carrierId: string;
  reason: string;
};

export type VerifiedPhoneResult = {
  phoneNumber: string;
  token: string;
};

type ExpoFirebasePnvNative = {
  enableTestSession(token: string): Promise<void>;
  getVerificationSupportInfo(): Promise<VerificationSupportInfo[]>;
  getVerifiedPhoneNumber(): Promise<VerifiedPhoneResult>;
};

const NativeModule =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<ExpoFirebasePnvNative>('ExpoFirebasePnv')
    : null;

export function isPnvAvailable(): boolean {
  return Platform.OS === 'android' && NativeModule != null;
}

export async function enableTestSession(token: string): Promise<void> {
  if (!NativeModule) throw new Error('PNV_NOT_AVAILABLE');
  await NativeModule.enableTestSession(token);
}

export async function getVerificationSupportInfo(): Promise<VerificationSupportInfo[]> {
  if (!NativeModule) return [];
  return NativeModule.getVerificationSupportInfo();
}

export async function getVerifiedPhoneNumber(): Promise<VerifiedPhoneResult> {
  if (!NativeModule) throw new Error('PNV_NOT_AVAILABLE');
  return NativeModule.getVerifiedPhoneNumber();
}
