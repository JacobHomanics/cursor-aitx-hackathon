import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export const PLANNER_TABS = [
  { href: '/weekly-planner/events', label: 'Events' },
  { href: '/weekly-planner/courses', label: 'Courses' },
  { href: '/weekly-planner/internships', label: 'Internships' },
] as const;

export function PlannerCategoryTabs() {
  const pathname = usePathname();

  return (
    <ThemedView type="backgroundElement" style={styles.list}>
      {PLANNER_TABS.map((tab) => {
        const isFocused = pathname === tab.href;

        return (
          <Link key={tab.href} href={tab.href} asChild>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView
                type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.tab}>
                <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
                  {tab.label}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </Link>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: Spacing.five,
    padding: Spacing.one,
    gap: Spacing.one,
  },
  tab: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
