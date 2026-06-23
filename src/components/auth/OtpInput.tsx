import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const OTP_LENGTH = 6;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
};

export function OtpInput({ value, onChange, onComplete, autoFocus }: Props) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  const handleChange = (text: string) => {
    const next = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(next);
    if (next.length === OTP_LENGTH) {
      onComplete?.(next);
    }
  };

  return (
    <Pressable style={styles.wrapper} onPress={() => inputRef.current?.focus()}>
      <View style={styles.row}>
        {digits.map((digit, index) => {
          const filled = digit.trim().length > 0;
          const active = index === activeIndex && value.length < OTP_LENGTH;
          return (
            <View
              key={index}
              style={[
                styles.cell,
                {
                  borderColor: active ? theme.primary : filled ? theme.primaryLight : theme.border,
                  backgroundColor: filled ? theme.backgroundSelected : theme.backgroundElement,
                },
                active && styles.cellActive,
              ]}>
              <ThemedText style={[styles.digit, filled && { color: theme.primary }]}>
                {filled ? digit : '·'}
              </ThemedText>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hiddenInput}
        accessibilityLabel="OTP input"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cell: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 52,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    transform: [{ scale: 1.04 }],
  },
  digit: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
