import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subMonths,
} from 'date-fns';
import { DailyEntry } from '../types';
import { Colors, Spacing, Typography } from '../theme';

interface CalendarHeatmapProps {
  entries: DailyEntry[];
  months?: number;
}

const CELL = 34;
const GAP = 3;
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function heatmapColor(count: number): string {
  if (count === 0) return Colors.heatmap0;
  if (count <= 2) return Colors.heatmap1;
  if (count <= 4) return Colors.heatmap2;
  if (count === 5) return Colors.heatmap3;
  return Colors.heatmap4;
}

export function CalendarHeatmap({ entries, months = 2 }: CalendarHeatmapProps) {
  const completionMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) {
      map[e.date] = Object.values(e.tasks).filter(Boolean).length;
    }
    return map;
  }, [entries]);

  const now = new Date();
  const monthList = useMemo(
    () =>
      Array.from({ length: months }, (_, i) => subMonths(now, months - 1 - i)),
    [months],
  );

  return (
    <View style={styles.container}>
      {monthList.map((monthDate) => {
        const monthLabel = format(monthDate, 'MMMM yyyy');
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        const days = eachDayOfInterval({ start, end });
        const startDow = getDay(start);
        const cols = Math.ceil((days.length + startDow) / 7);
        const svgWidth = cols * (CELL + GAP) - GAP;
        const svgHeight = 7 * (CELL + GAP) - GAP;

        return (
          <View key={monthLabel} style={styles.month}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <View style={styles.row}>
              <View style={styles.dowCol}>
                {DAYS.map((d, i) => (
                  <Text key={i} style={styles.dow}>{d}</Text>
                ))}
              </View>
              <Svg width={svgWidth} height={svgHeight}>
                {days.map((day, idx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const count = completionMap[dateStr] ?? 0;
                  const col = Math.floor((idx + startDow) / 7);
                  const row = (idx + startDow) % 7;
                  const x = col * (CELL + GAP);
                  const y = row * (CELL + GAP);
                  return (
                    <Rect
                      key={dateStr}
                      x={x}
                      y={y}
                      width={CELL}
                      height={CELL}
                      rx={4}
                      fill={heatmapColor(count)}
                    />
                  );
                })}
              </Svg>
            </View>
          </View>
        );
      })}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>None</Text>
        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[styles.legendCell, { backgroundColor: heatmapColor(level === 0 ? 0 : level * 1.5) }]}
          />
        ))}
        <Text style={styles.legendLabel}>All 6</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  month: {
    gap: Spacing.sm,
  },
  monthLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  dowCol: {
    paddingTop: 0,
    gap: GAP,
  },
  dow: {
    height: CELL,
    lineHeight: CELL,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    width: 12,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  legendLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  legendCell: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
});
