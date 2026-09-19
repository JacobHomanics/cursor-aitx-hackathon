import { Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { AuthCard } from '@/components/auth-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing, WebTabBarHeight } from '@/constants/theme';
import { useBreakpoint, useSurfaceLabel } from '@/hooks/use-breakpoint';

export default function HomeScreen() {
  const surface = useSurfaceLabel();
  const { isMobileWeb } = useBreakpoint();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isMobileWeb && { paddingBottom: WebTabBarHeight + Spacing.five },
        ]}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.heroSection}>
            <AnimatedIcon />
            <ThemedText type="title" style={styles.title}>
              Welcome to&nbsp;AITX
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.surfaceBadge}>
              <ThemedText type="small" themeColor="textSecondary">
                Running on {surface}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedText type="code" style={styles.code}>
            account
          </ThemedText>

          <AuthCard />

          {Platform.OS === 'web' && <WebBadge />}
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  surfaceBadge: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  code: {
    textTransform: 'uppercase',
  },
});
