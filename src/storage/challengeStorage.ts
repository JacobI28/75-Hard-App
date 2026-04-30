import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInCalendarDays, format } from 'date-fns';
import { ChallengeState } from '../types';
import { STORAGE_KEYS } from './keys';
import { loadEntry, isEntryComplete } from './dailyStorage';

const today = () => format(new Date(), 'yyyy-MM-dd');

export async function loadChallengeState(): Promise<ChallengeState | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_STATE);
  if (!raw) return null;
  return JSON.parse(raw) as ChallengeState;
}

export async function saveChallengeState(state: ChallengeState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGE_STATE, JSON.stringify(state));
}

export async function initNewChallenge(): Promise<ChallengeState> {
  const existing = await loadChallengeState();
  const state: ChallengeState = {
    startDate: today(),
    currentDay: 1,
    isActive: true,
    isCompleted: false,
    totalRestarts: existing?.totalRestarts ?? 0,
    restartHistory: existing?.restartHistory ?? [],
    pendingRestart: false,
  };
  await saveChallengeState(state);
  return state;
}

export async function restartChallenge(current: ChallengeState): Promise<ChallengeState> {
  const state: ChallengeState = {
    startDate: today(),
    currentDay: 1,
    isActive: true,
    isCompleted: false,
    totalRestarts: current.totalRestarts + 1,
    restartHistory: [
      ...current.restartHistory,
      { restartedOnDate: today(), reachedDay: current.currentDay },
    ],
    pendingRestart: false,
  };
  await saveChallengeState(state);
  return state;
}

export async function advanceDayIfNeeded(state: ChallengeState): Promise<ChallengeState> {
  if (!state.isActive || state.isCompleted) return state;

  const todayStr = today();
  const start = new Date(state.startDate);
  const todayDate = new Date(todayStr);
  const expectedDay = differenceInCalendarDays(todayDate, start) + 1;

  if (expectedDay <= state.currentDay) return state;

  // Check if yesterday was complete
  const yesterday = format(new Date(todayDate.getTime() - 86400000), 'yyyy-MM-dd');
  const yesterdayEntry = await loadEntry(yesterday);
  const yesterdayComplete = yesterdayEntry ? isEntryComplete(yesterdayEntry) : false;

  if (!yesterdayComplete) {
    const updated: ChallengeState = { ...state, pendingRestart: true };
    await saveChallengeState(updated);
    return updated;
  }

  const newDay = Math.min(expectedDay, 75);
  const isCompleted = newDay > 75 || (newDay === 75 && yesterdayComplete);
  const updated: ChallengeState = {
    ...state,
    currentDay: Math.min(newDay, 75),
    isCompleted,
    pendingRestart: false,
  };
  await saveChallengeState(updated);
  return updated;
}
