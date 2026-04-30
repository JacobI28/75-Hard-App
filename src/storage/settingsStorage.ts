import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, NotificationTime, TASK_IDS } from '../types';
import { STORAGE_KEYS } from './keys';

function defaultNotificationTime(hour: number, minute: number = 0): NotificationTime {
  return { enabled: true, hour, minute };
}

export function defaultSettings(): AppSettings {
  return {
    dietName: 'My Diet',
    dietNotes: '',
    biometricLock: false,
    darkMode: true,
    taskOverrides: {},
    notificationTimes: {
      diet: defaultNotificationTime(7),
      workout1: defaultNotificationTime(8),
      workout2Outdoor: defaultNotificationTime(17),
      water: defaultNotificationTime(20),
      reading: defaultNotificationTime(21),
      photo: defaultNotificationTime(22),
    },
  };
}

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!raw) return defaultSettings();
  const stored = JSON.parse(raw) as Partial<AppSettings>;
  const defaults = defaultSettings();
  // Merge to handle new fields added in updates
  return {
    ...defaults,
    ...stored,
    notificationTimes: {
      ...defaults.notificationTimes,
      ...(stored.notificationTimes ?? {}),
    },
    taskOverrides: stored.taskOverrides ?? {},
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}
