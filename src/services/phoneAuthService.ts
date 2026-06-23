import { signInAnonymously } from 'firebase/auth';

import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import { getUserProfile, saveUserProfile } from '@/services/firestoreService';
import { useAuthStore } from '@/stores/useAuthStore';
import type { UserProfile } from '@/types';

const DEMO_SESSION = 'demo-session';
const TEST_PHONE = '9011262635';
const TEST_OTP = '1234';
const TEST_SESSION = 'test-session-9011262635';
const TWO_FACTOR_BASE = 'https://2factor.in/API/V1';

export type OtpChannel = 'SMS' | 'VOICE';

function isPlaceholder(value: string): boolean {
  return !value || value.includes('your_') || value === 'undefined';
}

export const isTwoFactorConfigured = Boolean(
  process.env.EXPO_PUBLIC_TWOFACTOR_API_KEY &&
    !isPlaceholder(process.env.EXPO_PUBLIC_TWOFACTOR_API_KEY),
);

function getTwoFactorApiKey(): string {
  const key = process.env.EXPO_PUBLIC_TWOFACTOR_API_KEY ?? '';
  if (!key || isPlaceholder(key)) {
    throw new Error('Add EXPO_PUBLIC_TWOFACTOR_API_KEY to .env and restart Expo');
  }
  return key;
}

function getTemplateSuffix(): string {
  const template = process.env.EXPO_PUBLIC_TWOFACTOR_TEMPLATE?.trim();
  if (template && !isPlaceholder(template)) {
    return `/${encodeURIComponent(template)}`;
  }
  return '';
}

type TwoFactorResponse = { Status: string; Details: string };

async function twoFactorRequest(path: string): Promise<TwoFactorResponse> {
  const apiKey = getTwoFactorApiKey();
  let response: Response;
  try {
    response = await fetch(`${TWO_FACTOR_BASE}/${apiKey}/${path}`);
  } catch {
    throw new Error('Network error — check phone internet/Wi‑Fi');
  }

  const text = await response.text();
  let data: TwoFactorResponse;
  try {
    data = JSON.parse(text) as TwoFactorResponse;
  } catch {
    throw new Error(`2Factor error: ${text.slice(0, 120)}`);
  }

  if (__DEV__) {
    console.log('[2Factor]', path, data);
  }

  return data;
}

function autogenPath(digits: string, channel: OtpChannel): string {
  return `${channel}/91${digits}/AUTOGEN${getTemplateSuffix()}`;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

function isTestPhone(digits: string): boolean {
  return digits === TEST_PHONE;
}

export function formatPhoneE164(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length !== 10) throw new Error('INVALID_PHONE');
  return `+91${digits}`;
}

function mapTwoFactorError(details: string): string {
  const lower = details.toLowerCase();
  if (lower.includes('balance')) return '2Factor SMS balance too low — top up at 2factor.in';
  if (lower.includes('template') || lower.includes('sender')) {
    return `${details}. Add EXPO_PUBLIC_TWOFACTOR_TEMPLATE in .env (approved template from 2Factor dashboard).`;
  }
  if (lower.includes('invalid api key')) return 'Invalid 2Factor API key in .env';
  return details || 'Failed to send OTP';
}

/** Send OTP from the app via 2Factor.in (no Firebase Functions / CLI needed). */
export async function sendTwoFactorOtp(
  phone: string,
  channel: OtpChannel = 'SMS',
): Promise<{ sessionId: string; phone: string; channel: OtpChannel }> {
  const digits = normalizePhone(phone);
  if (digits.length !== 10) throw new Error('INVALID_PHONE');

  if (isTestPhone(digits)) {
    useAuthStore.getState().setPhoneConfirmationId(TEST_SESSION);
    return { sessionId: TEST_SESSION, phone: digits, channel };
  }

  if (!isTwoFactorConfigured) {
    if (!isFirebaseConfigured) {
      useAuthStore.getState().setPhoneConfirmationId(DEMO_SESSION);
      return { sessionId: DEMO_SESSION, phone: digits, channel };
    }
    throw new Error('Add EXPO_PUBLIC_TWOFACTOR_API_KEY to .env and restart Expo');
  }

  const result = await twoFactorRequest(autogenPath(digits, channel));
  if (result.Status !== 'Success') {
    throw new Error(mapTwoFactorError(result.Details));
  }

  useAuthStore.getState().setPhoneConfirmationId(result.Details);
  return { sessionId: result.Details, phone: digits, channel };
}

function isFirebaseAuthUnavailable(error: unknown): boolean {
  const code = (error as { code?: string })?.code ?? '';
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === 'auth/configuration-not-found' ||
    code === 'auth/operation-not-allowed' ||
    code === 'auth/admin-restricted-operation' ||
    message.includes('configuration-not-found') ||
    message.includes('CONFIGURATION_NOT_FOUND')
  );
}

function buildProfile(uid: string, digits: string, existing?: UserProfile | null): UserProfile {
  return {
    uid,
    phone: digits,
    name: existing?.name || 'Farmer',
    village: existing?.village ?? '',
    preferredCrops: existing?.preferredCrops ?? ['pomegranate'],
    language: existing?.language ?? 'en',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}

async function completePhoneLogin(digits: string): Promise<void> {
  const localUid = `phone_${digits}`;

  if (!isFirebaseConfigured) {
    useAuthStore.getState().enterPhoneVerifiedMode(buildProfile(localUid, digits));
    return;
  }

  try {
    const auth = getFirebaseAuth();
    const { user } = auth.currentUser ? { user: auth.currentUser } : await signInAnonymously(auth);
    const existing = await getUserProfile(user.uid).catch(() => null);
    const profile = buildProfile(user.uid, digits, existing);

    try {
      await saveUserProfile(profile);
    } catch {
      // Firestore may reject writes — still allow app access
    }

    useAuthStore.getState().setProfile(profile);
  } catch (error) {
    if (isFirebaseAuthUnavailable(error)) {
      useAuthStore.getState().enterPhoneVerifiedMode(buildProfile(localUid, digits));
      return;
    }
    throw error;
  }
}

/** Verify OTP via 2Factor.in, then sign in (Firebase Anonymous + Firestore profile). */
export async function verifyTwoFactorOtp(
  phone: string,
  sessionId: string,
  otp: string,
): Promise<void> {
  if (!otp || otp.length < 4) throw new Error('INVALID_OTP');

  const digits = normalizePhone(phone);

  if (sessionId === TEST_SESSION || isTestPhone(digits)) {
    if (otp === TEST_OTP) {
      await completePhoneLogin(digits);
      useAuthStore.getState().setPhoneConfirmationId(null);
      return;
    }
    throw new Error('INVALID_OTP');
  }

  if (sessionId === DEMO_SESSION) {
    if (otp.length >= 4) {
      useAuthStore.getState().enterDemoMode();
      useAuthStore.getState().setPhoneConfirmationId(null);
      return;
    }
    throw new Error('INVALID_OTP');
  }

  const result = await twoFactorRequest(`SMS/VERIFY/${sessionId}/${otp}`);
  if (result.Status !== 'Success') {
    throw new Error(result.Details || 'Invalid OTP');
  }

  try {
    await completePhoneLogin(digits);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isFirebaseAuthUnavailable(error)) {
      useAuthStore.getState().enterPhoneVerifiedMode(buildProfile(`phone_${digits}`, digits));
      useAuthStore.getState().setPhoneConfirmationId(null);
      return;
    }
    throw new Error(message);
  }

  useAuthStore.getState().setPhoneConfirmationId(null);
}
