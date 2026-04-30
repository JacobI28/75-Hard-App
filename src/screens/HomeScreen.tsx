import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Layout, Spacing, Typography } from '../theme';
import { TASK_DEFINITIONS, resolveTask } from '../types';
import { useAppContext } from '../context/AppContext';
import { DayCounter } from '../components/DayCounter';
import { CompletionRing } from '../components/CompletionRing';
import { TaskRow } from '../components/TaskRow';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const {
    challenge,
    todayEntry,
    settings,
    isLoading,
    toggleTask,
    setPhoto,
    completionCount,
    allComplete,
  } = useAppContext();

  useEffect(() => {
    if (challenge?.pendingRestart) {
      navigation.navigate('RestartConfirm', { autoTriggered: true });
    }
  }, [challenge?.pendingRestart]);

  const handlePhotoPress = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      await setPhoto(result.assets[0].uri);
    }
  };

  if (isLoading || !challenge || !todayEntry) {
    return (
      <SafeAreaView style={styles.loading} edges={['top']}>
        <ActivityIndicator color={Colors.accent} />
      </SafeAreaView>
    );
  }

  const dateLabel = format(new Date(), 'EEEE, MMM d');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>75 HARD</Text>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>

        {/* Day counter + ring */}
        <View style={styles.hero}>
          <DayCounter day={challenge.currentDay} />
          <CompletionRing completed={completionCount} total={6} size={88} />
        </View>

        {/* Task checklist */}
        <View style={styles.card}>
          {TASK_DEFINITIONS.map((def, idx) => {
            const { label, description } = resolveTask(def.id, settings);
            return (
              <TaskRow
                key={def.id}
                definition={def}
                label={label}
                description={description}
                completed={todayEntry.tasks[def.id]}
                onToggle={() => toggleTask(def.id)}
                onPhotoPress={def.id === 'photo' ? handlePhotoPress : undefined}
                isLast={idx === TASK_DEFINITIONS.length - 1}
              />
            );
          })}
        </View>

        {/* Completion banner */}
        {allComplete && (
          <View style={styles.completeBanner}>
            <Text style={styles.completeText}>DAY {challenge.currentDay} COMPLETE</Text>
          </View>
        )}
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  appTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.heavy,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  dateLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  completeBanner: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    padding: Spacing.md,
    alignItems: 'center',
  },
  completeText: {
    fontSize: Typography.md,
    fontWeight: Typography.heavy,
    color: '#fff',
    letterSpacing: 1.5,
  },
});
