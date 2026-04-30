import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography } from '../theme';

interface CompletionRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function CompletionRing({
  completed,
  total,
  size = 88,
  strokeWidth = 6,
}: CompletionRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const dash = circumference * progress;
  const gap = circumference - dash;
  const center = size / 2;

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {progress > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.accent}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        )}
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={styles.fraction}>
          {completed}/{total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fraction: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
});
