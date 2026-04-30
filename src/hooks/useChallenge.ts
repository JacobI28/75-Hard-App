import { useAppContext } from '../context/AppContext';

export function useChallenge() {
  const { challenge, triggerRestart, isLoading } = useAppContext();
  return { challenge, triggerRestart, isLoading };
}
