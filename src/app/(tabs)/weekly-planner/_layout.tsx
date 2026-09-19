import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlannerCategoryTabs } from '@/components/planner-category-tabs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';

export default function WeeklyPlannerLayout() {
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.chrome}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={{ fontFamily: Fonts.serif }}>
            Weekly planner
          </ThemedText>
        </View>

        <PlannerCategoryTabs />
      </SafeAreaView>

      <Slot />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  chrome: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  header: {
    alignItems: 'center',
  },
});
