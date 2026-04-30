import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../theme';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  accentColor?: string;
}

export function StatCard({ label, value, subValue, accentColor }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, accentColor ? { color: accentColor } : null]}>
        {value}
      </Text>
      {subValue ? <Text style={styles.subValue}>{subValue}</Text> : null}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  value: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  subValue: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  label: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
