import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, TASK_COLORS } from '../theme';
import { TaskDefinition } from '../types';

interface TaskRowProps {
  definition: TaskDefinition;
  label: string;
  description: string;
  completed: boolean;
  onToggle: () => void;
  onPhotoPress?: () => void;
  isLast?: boolean;
}

export function TaskRow({
  definition,
  label,
  description,
  completed,
  onToggle,
  onPhotoPress,
  isLast,
}: TaskRowProps) {
  const taskColor = TASK_COLORS[definition.id] ?? Colors.accentBlue;
  const isPhoto = definition.id === 'photo';

  return (
    <Pressable
      style={[styles.row, !isLast && styles.border]}
      onPress={isPhoto && !completed ? onPhotoPress : onToggle}
      android_ripple={{ color: Colors.surfaceElevated }}
    >
      <View style={[styles.checkbox, completed && { backgroundColor: Colors.taskComplete, borderColor: Colors.taskComplete }]}>
        {completed && (
          <Ionicons name="checkmark" size={14} color="#fff" />
        )}
      </View>
      <View style={styles.iconWrap}>
        <Ionicons
          name={definition.icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={completed ? Colors.taskComplete : taskColor}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, completed && styles.labelDone]}>{label}</Text>
        <Text style={styles.desc} numberOfLines={1}>{description}</Text>
      </View>
      {isPhoto && completed && (
        <Pressable onPress={onPhotoPress} hitSlop={8}>
          <Ionicons name="refresh-outline" size={18} color={Colors.textSecondary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  labelDone: {
    color: Colors.textSecondary,
  },
  desc: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
