import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

interface DayCounterProps {
  day: number;
  total?: number;
}

export function DayCounter({ day, total = 75 }: DayCounterProps) {
  const remaining = total - day + 1;
  const nearEnd = remaining <= 15 && remaining > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>DAY</Text>
      <Text style={styles.number}>{day}</Text>
      <Text style={styles.of}>of {total}</Text>
      {nearEnd && (
        <Text style={styles.warning}>{remaining} days remaining</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    letterSpacing: 3,
  },
  number: {
    fontSize: Typography.hero,
    fontWeight: Typography.heavy,
    color: Colors.textPrimary,
    lineHeight: Typography.hero * 1.1,
  },
  of: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  warning: {
    marginTop: Spacing.xs,
    fontSize: Typography.sm,
    color: Colors.accentWarning,
    fontWeight: Typography.semibold,
  },
});
