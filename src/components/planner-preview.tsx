import { useConvexAuth, useQuery } from 'convex/react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { PLANNER_TABS } from '@/components/planner-category-tabs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useJourneyColors } from '@/hooks/use-journey-colors';
import { api } from '@convex/_generated/api';

export function PlannerPreview() {
  const colors = useJourneyColors();
  const { isAuthenticated } = useConvexAuth();
  const events = useQuery(api.analyzer.latest, isAuthenticated ? {} : 'skip');
  const courses = useQuery(api.courses.latest, isAuthenticated ? {} : 'skip');
  const internships = useQuery(api.internships.latest, isAuthenticated ? {} : 'skip');
  const loading =
    isAuthenticated && (events === undefined || courses === undefined || internships === undefined);

  const sections = [
    {
      href: PLANNER_TABS[0].href,
      label: 'Events',
      name: events?.events[0]?.name,
      count: events?.events.length ?? 0,
    },
    {
      href: PLANNER_TABS[1].href,
      label: 'Courses',
      name: courses?.courses[0]?.name,
      count: courses?.courses.length ?? 0,
    },
    {
      href: PLANNER_TABS[2].href,
      label: 'Internships',
      name: internships?.listings[0]?.name,
      count: internships?.listings.length ?? 0,
    },
  ] as const;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <ThemedText type="code" style={[styles.eyebrow, { color: colors.accent }]}>
            You are here
          </ThemedText>
          <ThemedText type="smallBold">This week’s planner</ThemedText>
        </View>
        <Link href="/weekly-planner" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open weekly planner"
            style={({ pressed }) => [styles.open, { backgroundColor: colors.accentSoft }, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: colors.accent }}>
              Open
            </ThemedText>
          </Pressable>
        </Link>
      </View>

      {loading ? (
        <ThemedText themeColor="textSecondary">Loading this week…</ThemedText>
      ) : (
        <View style={styles.sections}>
          {sections.map((section) => (
            <Link key={section.href} href={section.href} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${section.label}. ${section.name ?? 'Nothing picked yet'}`}
                style={({ pressed }) => [styles.section, pressed && styles.pressed]}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="code" themeColor="textSecondary" style={styles.kind}>
                    {section.label}
                  </ThemedText>
                  {section.count > 0 ? (
                    <ThemedText type="code" themeColor="textSecondary" style={styles.kind}>
                      {section.count}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText type="smallBold">
                  {section.name ?? 'Nothing picked yet'}
                </ThemedText>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  open: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  sections: {
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  kind: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 10,
  },
  pressed: {
    opacity: 0.7,
  },
});
