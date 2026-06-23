import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { OtpInput } from '@/components/auth/OtpInput';
import { PomegranateLogo, PhoneCallIcon, SmsIcon } from '@/components/icons/AppIcons';
import { Button } from '@/components/ui/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isFirebaseConfigured } from '@/lib/firebase';
import { isTwoFactorConfigured, sendTwoFactorOtp, verifyTwoFactorOtp } from '@/services/phoneAuthService';
import { useAuthStore } from '@/stores/useAuthStore';

function formatPhoneDisplay(digits: string): string {
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const enterDemoMode = useAuthStore((s) => s.enterDemoMode);
  const isLoading = useAuthStore((s) => s.isLoading);
  const sessionId = useAuthStore((s) => s.phoneConfirmationId);
  const phoneInputRef = useRef<TextInput>(null);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [sending, setSending] = useState(false);
  const [otpChannel, setOtpChannel] = useState<'SMS' | 'VOICE'>('SMS');

  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
  const phoneReady = normalizedPhone.length === 10;

  const handleSendOtp = async (channel: 'SMS' | 'VOICE' = 'SMS') => {
    if (!phoneReady) {
      Alert.alert(t('auth.invalidPhone'));
      return;
    }
    setSending(true);
    try {
      const result = await sendTwoFactorOtp(normalizedPhone, channel);
      setOtpChannel(result.channel);
      setOtp('');
      setStep('otp');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(t('common.error'), message);
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (code?: string) => {
    const value = code ?? otp;
    if (!sessionId || value.length < 4) return;
    setSending(true);
    try {
      await verifyTwoFactorOtp(normalizedPhone, sessionId, value);
      router.replace('/(tabs)' as Href);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(t('common.error'), message === 'Invalid OTP' ? 'Invalid OTP' : message);
      setOtp('');
    } finally {
      setSending(false);
    }
  };

  const handleDemo = () => {
    enterDemoMode();
    router.replace('/(tabs)' as Href);
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setOtpChannel('SMS');
    setTimeout(() => phoneInputRef.current?.focus(), 200);
  };

  const isOtpStep = step === 'otp';

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={['#6D0F2C', theme.primary, theme.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, isOtpStep && styles.headerCompact]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={[styles.logoCircle, isOtpStep && styles.logoCircleSmall]}>
              {isOtpStep ? (
                otpChannel === 'VOICE' ? (
                  <PhoneCallIcon size={28} color="#FFFFFF" />
                ) : (
                  <SmsIcon size={28} color="#FFFFFF" />
                )
              ) : (
                <PomegranateLogo size={isOtpStep ? 44 : 52} />
              )}
            </View>
            <ThemedText style={styles.brandTitle}>{t('auth.title')}</ThemedText>
            <ThemedText style={styles.welcomeTitle}>
              {isOtpStep ? t('auth.otpTitle') : t('auth.welcome')}
            </ThemedText>
            <ThemedText style={styles.welcomeSubtitle}>
              {isOtpStep ? t('auth.otpSubtitle') : t('auth.subtitle')}
            </ThemedText>

            {isOtpStep && (
              <View style={styles.phoneBadge}>
                <ThemedText style={styles.phoneBadgeLabel}>+91</ThemedText>
                <ThemedText style={styles.phoneBadgeNumber}>{formatPhoneDisplay(normalizedPhone)}</ThemedText>
                <Pressable onPress={handleBack} hitSlop={8} style={styles.editPhone}>
                  <ThemedText style={styles.editPhoneText}>✎</ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {step === 'phone' ? (
              <>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {t('auth.phoneLabel')}
                </ThemedText>
                <View style={[styles.phoneRow, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  <View
                    style={[
                      styles.prefix,
                      { borderRightColor: theme.border, backgroundColor: theme.backgroundElement },
                    ]}>
                    <ThemedText type="smallBold">+91</ThemedText>
                  </View>
                  <TextInput
                    ref={phoneInputRef}
                    style={[styles.phoneInput, { color: theme.text }]}
                    placeholder={t('auth.phonePlaceholder')}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    autoFocus
                  />
                </View>

                <Button
                  title={sending ? '…' : t('auth.sendOtp')}
                  onPress={() => handleSendOtp('SMS')}
                  disabled={sending || !phoneReady}
                />
                {sending && <ActivityIndicator color={theme.primary} style={styles.loader} />}
              </>
            ) : (
              <View style={styles.otpSection}>
                <View style={[styles.channelPill, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>
                    {otpChannel === 'VOICE' ? `📞 ${t('auth.voiceOtp')}` : `📱 ${t('auth.otpSent')}`}
                  </ThemedText>
                </View>

                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={(code) => handleVerify(code)}
                  autoFocus
                />

                {otpChannel === 'VOICE' && (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                    {t('auth.voiceHint')}
                  </ThemedText>
                )}

                <Button
                  title={sending ? '…' : t('auth.verifyOtp')}
                  onPress={() => handleVerify()}
                  disabled={sending || isLoading || otp.length < 4}
                />

                <View style={[styles.resendCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.resendLabel}>
                    {t('auth.sentTo', { phone: normalizedPhone })}
                  </ThemedText>
                  <View style={styles.resendRow}>
                    <Pressable
                      onPress={() => handleSendOtp('SMS')}
                      disabled={sending}
                      style={({ pressed }) => [
                        styles.resendBtn,
                        { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="smallBold" style={{ color: theme.primary }}>
                        {t('auth.resendOtp')}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => handleSendOtp('VOICE')}
                      disabled={sending}
                      style={({ pressed }) => [
                        styles.resendBtn,
                        { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="smallBold" style={{ color: theme.primary }}>
                        {t('auth.voiceOtp')}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>

          {!isTwoFactorConfigured && !isFirebaseConfigured && (
            <View style={styles.demoBlock}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.demoNote}>
                {t('common.demoNotice')}
              </ThemedText>
              <Button title={t('auth.demoMode')} onPress={handleDemo} variant="secondary" />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingBottom: Spacing.five,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerCompact: {
    paddingBottom: Spacing.four,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    paddingTop: 4,
  },
  logoCircleSmall: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: Spacing.one,
    paddingTop: 2,
  },
  brandTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  phoneBadgeLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneBadgeNumber: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
  },
  editPhone: {
    paddingLeft: Spacing.one,
  },
  editPhoneText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRightWidth: 1,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    letterSpacing: 1,
  },
  otpSection: {
    gap: Spacing.three,
  },
  channelPill: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  hint: { textAlign: 'center' },
  resendCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  resendLabel: { textAlign: 'center' },
  resendRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  resendBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  pressed: { opacity: 0.65 },
  loader: { marginTop: -Spacing.two },
  demoBlock: { gap: Spacing.two, alignItems: 'center' },
  demoNote: { textAlign: 'center' },
});
