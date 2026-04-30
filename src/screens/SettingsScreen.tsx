import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors, Layout, Radii, Spacing, Typography } from '../theme';
import { TASK_DEFINITIONS, TaskId, resolveTask } from '../types';
import { useAppContext } from '../context/AppContext';
import { NotificationTimePicker } from '../components/NotificationTimePicker';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<NavProp>();
  const { settings, updateSettings } = useAppContext();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskId | null>(null);
  const [taskLabel, setTaskLabel] = useState('');
  const [taskDesc, setTaskDesc] = useState('');

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(setBiometricAvailable);
  }, []);

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all challenge history and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Done', 'All data has been cleared. Restart the app.');
          },
        },
      ],
    );
  };

  const startEditTask = (taskId: TaskId) => {
    const resolved = resolveTask(taskId, settings);
    setEditingTask(taskId);
    setTaskLabel(resolved.label);
    setTaskDesc(resolved.description);
  };

  const saveTaskEdit = () => {
    if (!editingTask) return;
    const overrides = { ...settings.taskOverrides };
    const def = TASK_DEFINITIONS.find((d) => d.id === editingTask)!;
    if (taskLabel === def.label && taskDesc === def.description) {
      delete overrides[editingTask];
    } else {
      overrides[editingTask] = { label: taskLabel, description: taskDesc };
    }
    updateSettings({ taskOverrides: overrides });
    setEditingTask(null);
  };

  const resetTaskToDefault = (taskId: TaskId) => {
    const overrides = { ...settings.taskOverrides };
    delete overrides[taskId];
    updateSettings({ taskOverrides: overrides });
    setEditingTask(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>SETTINGS</Text>

        {/* Challenge section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHALLENGE</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Diet Name</Text>
            <TextInput
              style={styles.input}
              value={settings.dietName}
              onChangeText={(dietName) => updateSettings({ dietName })}
              placeholder="e.g. Keto, Carnivore, Paleo"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="done"
            />
            <View style={styles.divider} />
            <Text style={styles.fieldLabel}>Diet Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={settings.dietNotes}
              onChangeText={(dietNotes) => updateSettings({ dietNotes })}
              placeholder="Rules, restrictions, reminders..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
            />
            <View style={styles.divider} />
            <Pressable
              style={styles.dangerRow}
              onPress={() =>
                navigation.navigate('RestartConfirm', { autoTriggered: false })
              }
            >
              <Text style={styles.dangerText}>Restart Challenge</Text>
            </Pressable>
          </View>
        </View>

        {/* Tasks section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TASKS</Text>
          <View style={styles.card}>
            {TASK_DEFINITIONS.map((def, idx) => {
              const resolved = resolveTask(def.id, settings);
              const isEditing = editingTask === def.id;
              const isLast = idx === TASK_DEFINITIONS.length - 1;
              return (
                <View key={def.id}>
                  {isEditing ? (
                    <View style={styles.taskEditForm}>
                      <TextInput
                        style={styles.input}
                        value={taskLabel}
                        onChangeText={setTaskLabel}
                        placeholder="Task label"
                        placeholderTextColor={Colors.textMuted}
                        returnKeyType="next"
                      />
                      <TextInput
                        style={[styles.input, { marginTop: Spacing.sm }]}
                        value={taskDesc}
                        onChangeText={setTaskDesc}
                        placeholder="Description"
                        placeholderTextColor={Colors.textMuted}
                        returnKeyType="done"
                      />
                      <View style={styles.taskEditButtons}>
                        <Pressable
                          style={styles.saveBtn}
                          onPress={saveTaskEdit}
                        >
                          <Text style={styles.saveBtnText}>Save</Text>
                        </Pressable>
                        <Pressable
                          style={styles.resetBtn}
                          onPress={() => resetTaskToDefault(def.id)}
                        >
                          <Text style={styles.resetBtnText}>Reset to default</Text>
                        </Pressable>
                        <Pressable onPress={() => setEditingTask(null)}>
                          <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={[styles.taskRow, !isLast && styles.taskRowBorder]}
                      onPress={() => startEditTask(def.id)}
                    >
                      <View style={styles.taskRowText}>
                        <Text style={styles.taskRowLabel}>{resolved.label}</Text>
                        <Text style={styles.taskRowDesc} numberOfLines={1}>
                          {resolved.description}
                        </Text>
                      </View>
                      <Text style={styles.editHint}>Edit</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Notifications section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            {TASK_DEFINITIONS.map((def) => {
              const resolved = resolveTask(def.id, settings);
              return (
                <NotificationTimePicker
                  key={def.id}
                  label={resolved.label}
                  time={settings.notificationTimes[def.id]}
                  onChange={(time) =>
                    updateSettings({
                      notificationTimes: {
                        ...settings.notificationTimes,
                        [def.id]: time,
                      },
                    })
                  }
                />
              );
            })}
          </View>
        </View>

        {/* Security */}
        {biometricAvailable && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SECURITY</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Face ID / Biometric Lock</Text>
                <Switch
                  value={settings.biometricLock}
                  onValueChange={(biometricLock) => updateSettings({ biometricLock })}
                  trackColor={{ true: Colors.accent, false: Colors.border }}
                  thumbColor={Colors.textPrimary}
                />
              </View>
            </View>
          </View>
        )}

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <View style={styles.card}>
            <Pressable style={styles.dangerRow} onPress={handleClearData}>
              <Text style={styles.dangerText}>Clear All Data</Text>
            </Pressable>
          </View>
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
    gap: Spacing.lg,
  },
  pageTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.heavy,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  fieldLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  input: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inputMulti: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  dangerRow: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  dangerText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.danger,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  taskRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  taskRowText: { flex: 1 },
  taskRowLabel: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  taskRowDesc: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  editHint: {
    fontSize: Typography.sm,
    color: Colors.accentBlue,
  },
  taskEditForm: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  taskEditButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  saveBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: '#fff',
  },
  resetBtn: {
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  resetBtnText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  cancelText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  switchLabel: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
});
