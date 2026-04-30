import { useAppContext } from '../context/AppContext';

export function useTodayEntry() {
  const { todayEntry, toggleTask, setPhoto, completionCount, allComplete } =
    useAppContext();
  return { todayEntry, toggleTask, setPhoto, completionCount, allComplete };
}
