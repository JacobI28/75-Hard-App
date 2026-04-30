import { useEffect, useMemo, useState } from 'react';
import { ChallengeStats, DailyEntry, TASK_IDS } from '../types';
import { loadAllEntries } from '../storage';
import { useAppContext } from '../context/AppContext';

export function useStats(): { stats: ChallengeStats | null; loading: boolean } {
  const { challenge } = useAppContext();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllEntries().then((all) => {
      setEntries(all);
      setLoading(false);
    });
  }, []);

  const stats = useMemo<ChallengeStats | null>(() => {
    if (!challenge || loading) return null;

    const daysCompleted = entries.filter((e) =>
      Object.values(e.tasks).every(Boolean),
    ).length;

    const daysActive = entries.length;
    const completionRate = daysActive > 0 ? daysCompleted / daysActive : 0;

    // Current streak: consecutive complete days backwards from yesterday
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    let currentStreak = 0;
    for (const entry of sorted) {
      if (Object.values(entry.tasks).every(Boolean)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Longest streak
    let longestStreak = 0;
    let streak = 0;
    for (const entry of [...entries].sort((a, b) => a.date.localeCompare(b.date))) {
      if (Object.values(entry.tasks).every(Boolean)) {
        streak++;
        if (streak > longestStreak) longestStreak = streak;
      } else {
        streak = 0;
      }
    }

    const taskCompletionRates = {} as Record<string, number>;
    for (const taskId of TASK_IDS) {
      const count = entries.filter((e) => e.tasks[taskId]).length;
      taskCompletionRates[taskId] = daysActive > 0 ? count / daysActive : 0;
    }

    return {
      currentDay: challenge.currentDay,
      daysCompleted,
      completionRate,
      currentStreak,
      longestStreak,
      taskCompletionRates: taskCompletionRates as ChallengeStats['taskCompletionRates'],
      totalRestarts: challenge.totalRestarts,
      daysActive,
    };
  }, [entries, challenge, loading]);

  return { stats, loading };
}
