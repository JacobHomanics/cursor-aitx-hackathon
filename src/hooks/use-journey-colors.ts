import { JourneyColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useJourneyColors() {
  const scheme = useColorScheme();

  return JourneyColors[scheme === 'dark' ? 'dark' : 'light'];
}
