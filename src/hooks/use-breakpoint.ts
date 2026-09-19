import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { DesktopBreakpoint } from '@/constants/theme';

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const [hasHydrated, setHasHydrated] = useState(Platform.OS !== 'web');

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const isWide = hasHydrated && width >= DesktopBreakpoint;
  const isDesktopWeb = Platform.OS === 'web' && isWide;
  const isMobileWeb = Platform.OS === 'web' && !isWide;

  return { width, isWide, isDesktopWeb, isMobileWeb };
}

export function useSurfaceLabel() {
  const { isDesktopWeb } = useBreakpoint();

  if (Platform.OS === 'ios') {
    return 'iOS';
  }

  if (Platform.OS === 'android') {
    return 'Android';
  }

  return isDesktopWeb ? 'Desktop web' : 'Mobile web';
}
