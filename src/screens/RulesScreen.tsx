import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout, Spacing, Typography } from '../theme';
import { RuleItem } from '../components/RuleItem';

const RULES = [
  {
    title: 'Follow Your Diet',
    description:
      'Pick any diet and follow it with zero deviations. Zero alcohol. No cheat meals. If you drink a glass of wine or eat a slice of pizza, restart.',
  },
  {
    title: 'Two 45-Minute Workouts',
    description:
      'Complete two separate workouts each day, each at least 45 minutes long. They must be separated by time — back to back does not count as two workouts.',
  },
  {
    title: 'One Workout Must Be Outdoors',
    description:
      'One of your two daily workouts must be performed outside. Rain, snow, heat — no exceptions. The weather is not an excuse.',
  },
  {
    title: 'Drink 1 Gallon of Water',
    description:
      'Drink one full gallon (128 oz / 3.785 L) of water every day. No substitutions. Coffee, tea, and other beverages do not count.',
  },
  {
    title: 'Read 10 Pages of Non-Fiction',
    description:
      'Read 10 pages of a non-fiction, self-development book every day. Audiobooks do not count. E-books are debated — physical books are the standard.',
  },
  {
    title: 'Take a Daily Progress Photo',
    description:
      'Take one progress photo every single day. It does not need to be shared publicly, but it must be taken. This is your visual record of the journey.',
  },
];

export function RulesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>THE 75 HARD RULES</Text>
        <Text style={styles.subtitle}>Andy Frisella's Mental Toughness Program</Text>

        <View style={styles.ruleList}>
          {RULES.map((rule, idx) => (
            <RuleItem
              key={idx}
              number={idx + 1}
              title={rule.title}
              description={rule.description}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Missing ANY single task on ANY day = restart to Day 1.
          </Text>
          <Text style={styles.footerSub}>No exceptions. No partial credit.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  title: {
    fontSize: Typography.xs,
    fontWeight: Typography.heavy,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.sm,
  },
  ruleList: {
    gap: 0,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.lg,
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.danger,
    textAlign: 'center',
  },
  footerSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
