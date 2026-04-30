import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyEntry, EMPTY_TASK_MAP, TaskCompletionMap } from '../types';
import { STORAGE_KEYS } from './keys';

function dateKey(date: string): string {
  return STORAGE_KEYS.DAILY_PREFIX + date;
}

export function buildEmptyEntry(date: string, day: number): DailyEntry {
  return {
    date,
    day,
    tasks: { ...EMPTY_TASK_MAP },
    photoUri: null,
    notes: '',
    completedAt: null,
  };
}

export function isEntryComplete(entry: DailyEntry): boolean {
  return Object.values(entry.tasks).every(Boolean);
}

export async function loadEntry(date: string): Promise<DailyEntry | null> {
  const raw = await AsyncStorage.getItem(dateKey(date));
  if (!raw) return null;
  return JSON.parse(raw) as DailyEntry;
}

export async function saveEntry(entry: DailyEntry): Promise<void> {
  const key = dateKey(entry.date);
  const rawDates = await AsyncStorage.getItem(STORAGE_KEYS.ALL_DATES_INDEX);
  const dates: string[] = rawDates ? JSON.parse(rawDates) : [];
  if (!dates.includes(entry.date)) {
    dates.push(entry.date);
  }
  await AsyncStorage.multiSet([
    [key, JSON.stringify(entry)],
    [STORAGE_KEYS.ALL_DATES_INDEX, JSON.stringify(dates)],
  ]);
}

export async function loadAllEntries(): Promise<DailyEntry[]> {
  const rawDates = await AsyncStorage.getItem(STORAGE_KEYS.ALL_DATES_INDEX);
  if (!rawDates) return [];
  const dates: string[] = JSON.parse(rawDates);
  if (dates.length === 0) return [];
  const keys = dates.map(dateKey);
  const pairs = await AsyncStorage.multiGet(keys);
  return pairs
    .map(([, raw]) => (raw ? (JSON.parse(raw) as DailyEntry) : null))
    .filter((e): e is DailyEntry => e !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function loadEntryRange(
  startDate: string,
  endDate: string,
): Promise<DailyEntry[]> {
  const all = await loadAllEntries();
  return all.filter((e) => e.date >= startDate && e.date <= endDate);
}
