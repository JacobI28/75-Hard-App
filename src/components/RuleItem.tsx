import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography, Radii } from '../theme';

interface RuleItemProps {
  number: number;
  title: string;
  description: string;
}

export function RuleItem({ number, title, description }: RuleItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.numWrap}>
        <Text style={styles.num}>{number}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  numWrap: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  num: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.accentBlue,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  desc: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
