import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, TASK_COLORS } from '../theme';
import { ChallengeStats, TASK_DEFINITIONS, TaskId } from '../types';
import { StatCard } from './StatCard';

interface StatsGridProps {
  stats: ChallengeStats;
  taskLabels: Record<TaskId, string>;
}

export function StatsGrid({ stats, taskLabels }: StatsGridProps) {
  return (
    <View style={styles.container}>
      <View style={styles.cardRow}>
        <StatCard
          label="Current Day"
          value={`${stats.currentDay}`}
          subValue="of 75"
          accentColor={Colors.accentBlue}
        />
        <StatCard
          label="Completion Rate"
          value={`${Math.round(stats.completionRate * 100)}%`}
          accentColor={Colors.accent}
        />
        <StatCard
          label="Best Streak"
          value={`${stats.longestStreak}`}
          subValue="days"
          accentColor={Colors.accentWarning}
        />
      </View>
      <View style={styles.cardRow}>
        <StatCard
          label="Days Complete"
          value={`${stats.daysCompleted}`}
        />
        <StatCard
          label="Current Streak"
          value={`${stats.currentStreak}`}
          subValue="days"
        />
        <StatCard
          label="Restarts"
          value={`${stats.totalRestarts}`}
          accentColor={stats.totalRestarts > 0 ? Colors.danger : Colors.textSecondary}
        />
      </View>

      <Text style={styles.sectionTitle}>TASK BREAKDOWN</Text>
      <View style={styles.taskList}>
        {TASK_DEFINITIONS.map((def) => {
          const rate = stats.taskCompletionRates[def.id] ?? 0;
          const pct = Math.round(rate * 100);
          const color = TASK_COLORS[def.id] ?? Colors.accentBlue;
          return (
            <View key={def.id} style={styles.taskRow}>
              <Ionicons
                name={def.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={color}
                style={styles.taskIcon}
              />
              <Text style={styles.taskLabel}>{taskLabels[def.id]}</Text>
              <View style={styles.barWrap}>
                <View style={[styles.bar, { width: `${pct}%` as any, backgroundColor: color }]} />
              </View>
              <Text style={[styles.pct, { color }]}>{pct}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: Spacing.sm,
  },
  taskList: {
    gap: Spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  taskIcon: {
    width: 20,
  },
  taskLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    width: 110,
  },
  barWrap: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  pct: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    width: 36,
    textAlign: 'right',
  },
});
