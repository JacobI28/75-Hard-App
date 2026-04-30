import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { format } from 'date-fns';
import { AppSettings, ChallengeState, DailyEntry, TaskId } from '../types';
import {
  advanceDayIfNeeded,
  buildEmptyEntry,
  initNewChallenge,
  isEntryComplete,
  loadChallengeState,
  loadEntry,
  loadSettings,
  restartChallenge,
  saveEntry,
  saveChallengeState,
  saveSettings,
} from '../storage';
import { scheduleAllNotifications } from '../notifications/notificationService';

interface AppContextValue {
  challenge: ChallengeState | null;
  todayEntry: DailyEntry | null;
  settings: AppSettings;
  isLoading: boolean;
  toggleTask: (taskId: TaskId) => Promise<void>;
  setPhoto: (uri: string) => Promise<void>;
  triggerRestart: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  loadAllData: () => Promise<void>;
  completionCount: number;
  allComplete: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    dietName: 'My Diet',
    dietNotes: '',
    biometricLock: false,
    darkMode: true,
    taskOverrides: {},
    notificationTimes: {
      diet: { enabled: true, hour: 7, minute: 0 },
      workout1: { enabled: true, hour: 8, minute: 0 },
      workout2Outdoor: { enabled: true, hour: 17, minute: 0 },
      water: { enabled: true, hour: 20, minute: 0 },
      reading: { enabled: true, hour: 21, minute: 0 },
      photo: { enabled: true, hour: 22, minute: 0 },
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const loadAllData = useCallback(async () => {
    const [storedSettings, storedChallenge] = await Promise.all([
      loadSettings(),
      loadChallengeState(),
    ]);

    setSettings(storedSettings);

    let state = storedChallenge;
    if (!state) {
      state = await initNewChallenge();
    } else {
      state = await advanceDayIfNeeded(state);
    }
    setChallenge(state);

    const date = todayStr();
    let entry = await loadEntry(date);
    if (!entry) {
      entry = buildEmptyEntry(date, state.currentDay);
      await saveEntry(entry);
    }
    setTodayEntry(entry);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        loadAllData();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [loadAllData]);

  const toggleTask = useCallback(
    async (taskId: TaskId) => {
      if (!todayEntry) return;
      const updated: DailyEntry = {
        ...todayEntry,
        tasks: { ...todayEntry.tasks, [taskId]: !todayEntry.tasks[taskId] },
      };
      const allDone = isEntryComplete(updated);
      updated.completedAt = allDone ? new Date().toISOString() : null;
      setTodayEntry(updated);
      await saveEntry(updated);
    },
    [todayEntry],
  );

  const setPhoto = useCallback(
    async (tempUri: string) => {
      if (!todayEntry) return;
      const dir = FileSystem.documentDirectory + 'photos/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const dest = dir + todayEntry.date + '.jpg';
      await FileSystem.copyAsync({ from: tempUri, to: dest });
      const updated: DailyEntry = { ...todayEntry, photoUri: dest };
      const allDone = isEntryComplete({ ...updated, tasks: { ...updated.tasks, photo: true } });
      updated.tasks = { ...updated.tasks, photo: true };
      updated.completedAt = allDone ? new Date().toISOString() : null;
      setTodayEntry(updated);
      await saveEntry(updated);
    },
    [todayEntry],
  );

  const triggerRestart = useCallback(async () => {
    if (!challenge) return;
    const newState = await restartChallenge(challenge);
    setChallenge(newState);
    const date = todayStr();
    const entry = buildEmptyEntry(date, 1);
    await saveEntry(entry);
    setTodayEntry(entry);
  }, [challenge]);

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial };
      setSettings(updated);
      await saveSettings(updated);
      await scheduleAllNotifications(updated);
    },
    [settings],
  );

  const completionCount = todayEntry
    ? Object.values(todayEntry.tasks).filter(Boolean).length
    : 0;
  const allComplete = completionCount === 6;

  return (
    <AppContext.Provider
      value={{
        challenge,
        todayEntry,
        settings,
        isLoading,
        toggleTask,
        setPhoto,
        triggerRestart,
        updateSettings,
        loadAllData,
        completionCount,
        allComplete,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
