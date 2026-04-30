export type TaskId =
  | 'diet'
  | 'workout1'
  | 'workout2Outdoor'
  | 'water'
  | 'reading'
  | 'photo';

export interface TaskDefinition {
  id: TaskId;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export interface RestartRecord {
  restartedOnDate: string;
  reachedDay: number;
}

export interface ChallengeState {
  startDate: string;
  currentDay: number;
  isActive: boolean;
  isCompleted: boolean;
  totalRestarts: number;
  restartHistory: RestartRecord[];
  pendingRestart: boolean;
}

export type TaskCompletionMap = Record<TaskId, boolean>;

export interface DailyEntry {
  date: string;
  day: number;
  tasks: TaskCompletionMap;
  photoUri: string | null;
  notes: string;
  completedAt: string | null;
}

export interface NotificationTime {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface AppSettings {
  dietName: string;
  dietNotes: string;
  biometricLock: boolean;
  notificationTimes: Record<TaskId, NotificationTime>;
  darkMode: boolean;
  taskOverrides: Partial<Record<TaskId, { label: string; description: string }>>;
}

export interface ChallengeStats {
  currentDay: number;
  daysCompleted: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  taskCompletionRates: Record<TaskId, number>;
  totalRestarts: number;
  daysActive: number;
}

export const TASK_DEFINITIONS: TaskDefinition[] = [
  {
    id: 'diet',
    label: 'Follow Your Diet',
    shortLabel: 'Diet',
    description: 'Zero deviations. Zero alcohol.',
    icon: 'nutrition-outline',
  },
  {
    id: 'workout1',
    label: 'Workout #1 (45 min)',
    shortLabel: 'Workout 1',
    description: 'Any workout, 45 minutes minimum.',
    icon: 'barbell-outline',
  },
  {
    id: 'workout2Outdoor',
    label: 'Workout #2 Outdoors (45 min)',
    shortLabel: 'Outdoor Workout',
    description: 'Must be outside, regardless of weather.',
    icon: 'sunny-outline',
  },
  {
    id: 'water',
    label: 'Drink 1 Gallon of Water',
    shortLabel: 'Water (1 gal)',
    description: '3.785 liters. No substitutions.',
    icon: 'water-outline',
  },
  {
    id: 'reading',
    label: 'Read 10 Pages Non-Fiction',
    shortLabel: 'Reading',
    description: 'Physical book only. No audiobooks.',
    icon: 'book-outline',
  },
  {
    id: 'photo',
    label: 'Daily Progress Photo',
    shortLabel: 'Progress Photo',
    description: 'One photo per day. Stored locally.',
    icon: 'camera-outline',
  },
];

export const EMPTY_TASK_MAP: TaskCompletionMap = {
  diet: false,
  workout1: false,
  workout2Outdoor: false,
  water: false,
  reading: false,
  photo: false,
};

export const TASK_IDS: TaskId[] = [
  'diet',
  'workout1',
  'workout2Outdoor',
  'water',
  'reading',
  'photo',
];

export function resolveTask(
  taskId: TaskId,
  settings: AppSettings,
): { label: string; description: string } {
  const override = settings.taskOverrides[taskId];
  const def = TASK_DEFINITIONS.find((d) => d.id === taskId)!;
  return {
    label: override?.label ?? def.label,
    description: override?.description ?? def.description,
  };
}
