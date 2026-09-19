import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { AuthCard } from '@/components/auth-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_NAME } from '@/constants/app';
import { Fonts, Spacing } from '@/constants/theme';

export default function SignInScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.column}>
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <View style={styles.iconScale}>
                <AnimatedIcon />
              </View>
            </View>
            <ThemedText type="title" style={styles.brand}>
              {APP_NAME}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
              Sign in to start your career path
            </ThemedText>
          </View>
          <AuthCard />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    width: '100%',
    maxWidth: 420,
    gap: Spacing.three,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  iconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconScale: {
    transform: [{ scale: 0.5 }],
  },
  brand: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 36,
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
  },
});
