import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, Typography } from '../theme';
import { NotificationTime } from '../types';

interface NotificationTimePickerProps {
  label: string;
  time: NotificationTime;
  onChange: (time: NotificationTime) => void;
}

function padTwo(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTime(hour: number, minute: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:${padTwo(minute)} ${ampm}`;
}

export function NotificationTimePicker({ label, time, onChange }: NotificationTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const date = new Date();
  date.setHours(time.hour, time.minute, 0, 0);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Switch
          value={time.enabled}
          onValueChange={(enabled) => onChange({ ...time, enabled })}
          trackColor={{ true: Colors.accent, false: Colors.border }}
          thumbColor={Colors.textPrimary}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Pressable
        onPress={() => time.enabled && setShowPicker(true)}
        style={[styles.timeBtn, !time.enabled && styles.timeBtnDisabled]}
      >
        <Text style={[styles.timeText, !time.enabled && styles.timeTextDisabled]}>
          {formatTime(time.hour, time.minute)}
        </Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            setShowPicker(Platform.OS === 'ios');
            if (selected) {
              onChange({
                ...time,
                hour: selected.getHours(),
                minute: selected.getMinutes(),
              });
            }
            if (Platform.OS !== 'ios') setShowPicker(false);
          }}
          themeVariant="dark"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  label: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  timeBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeBtnDisabled: {
    opacity: 0.4,
  },
  timeText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.accentBlue,
  },
  timeTextDisabled: {
    color: Colors.textMuted,
  },
});
