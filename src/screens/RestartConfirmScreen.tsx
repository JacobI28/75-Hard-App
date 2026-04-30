import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Radii, Spacing, Typography } from '../theme';
import { useAppContext } from '../context/AppContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type RouteT = RouteProp<RootStackParamList, 'RestartConfirm'>;

export function RestartConfirmScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteT>();
  const { challenge, triggerRestart } = useAppContext();
  const autoTriggered = route.params?.autoTriggered ?? false;

  const handleConfirm = async () => {
    await triggerRestart();
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Ionicons name="warning-outline" size={48} color={Colors.danger} />

        <Text style={styles.title}>RESTART TO DAY 1</Text>

        <View style={styles.body}>
          <Text style={styles.bodyText}>
            You are about to restart the 75 Hard challenge.
          </Text>
          {challenge && (
            <View style={styles.stats}>
              <Text style={styles.stat}>
                Current progress:{' '}
                <Text style={styles.statValue}>Day {challenge.currentDay} of 75</Text>
              </Text>
              <Text style={styles.stat}>
                This will be restart #{' '}
                <Text style={styles.statValue}>{challenge.totalRestarts + 1}</Text>
              </Text>
            </View>
          )}
          <Text style={styles.note}>
            All historical data is preserved for reference. Your day counter resets to Day 1.
          </Text>
          {autoTriggered && (
            <Text style={styles.reason}>
              Why: You did not complete all 6 tasks yesterday.
            </Text>
          )}
        </View>

        <View style={styles.buttons}>
          <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>CONFIRM RESTART</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.heavy,
    color: Colors.danger,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  body: {
    gap: Spacing.md,
    alignItems: 'center',
  },
  bodyText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  stats: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  stat: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  statValue: {
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  note: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  reason: {
    fontSize: Typography.sm,
    color: Colors.accentWarning,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttons: {
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  confirmBtn: {
    backgroundColor: Colors.danger,
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: Typography.base,
    fontWeight: Typography.heavy,
    color: '#fff',
    letterSpacing: 1,
  },
  cancelBtn: {
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
  },
});
