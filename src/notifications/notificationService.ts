import * as Notifications from 'expo-notifications';
import { AppSettings, TaskId, TASK_DEFINITIONS } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTaskNotification(
  taskId: TaskId,
  hour: number,
  minute: number,
  label: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `75hard-${taskId}`,
    content: {
      title: '75 Hard',
      body: `Time for: ${label}`,
      data: { taskId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelTaskNotification(taskId: TaskId): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`75hard-${taskId}`);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleAllNotifications(settings: AppSettings): Promise<void> {
  for (const def of TASK_DEFINITIONS) {
    const time = settings.notificationTimes[def.id];
    const override = settings.taskOverrides[def.id];
    const label = override?.label ?? def.label;
    if (time.enabled) {
      await scheduleTaskNotification(def.id, time.hour, time.minute, label);
    } else {
      await cancelTaskNotification(def.id);
    }
  }
}
