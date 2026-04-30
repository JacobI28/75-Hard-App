import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout, Spacing, Typography } from '../theme';
import { DailyEntry, TASK_DEFINITIONS, TaskId, resolveTask } from '../types';
import { useStats } from '../hooks/useStats';
import { loadAllEntries } from '../storage';
import { StatsGrid } from '../components/StatsGrid';
import { CalendarHeatmap } from '../components/CalendarHeatmap';
import { useAppContext } from '../context/AppContext';

export function ProgressScreen() {
  const { stats, loading } = useStats();
  const { settings } = useAppContext();
  const [entries, setEntries] = useState<DailyEntry[]>([]);

  useEffect(() => {
    loadAllEntries().then(setEntries);
  }, []);

  const taskLabels = Object.fromEntries(
    TASK_DEFINITIONS.map((def) => [def.id, resolveTask(def.id, settings).label]),
  ) as Record<TaskId, string>;

  if (loading || !stats) {
    return (
      <SafeAreaView style={styles.loading} edges={['top']}>
        <ActivityIndicator color={Colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>PROGRESS</Text>
        <StatsGrid stats={stats} taskLabels={taskLabels} />
        <Text style={styles.sectionTitle}>ACTIVITY</Text>
        <CalendarHeatmap entries={entries} months={2} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  title: {
    fontSize: Typography.xs,
    fontWeight: Typography.heavy,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
});
