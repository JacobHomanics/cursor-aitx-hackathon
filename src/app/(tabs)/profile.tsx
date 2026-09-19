import { useConvexAuth, useQuery } from 'convex/react';
import { createElement, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthCard } from '@/components/auth-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import {
  BottomTabInset,
  Fonts,
  MaxContentWidth,
  Spacing,
  WebTabBarHeight,
} from '@/constants/theme';
import { useAppAuth } from '@/hooks/use-app-auth';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useJourneyColors } from '@/hooks/use-journey-colors';
import {
  broadGoalsFor,
  companyLabel,
  displayNameFor,
  formatLoggedDate,
  industryLabel,
  initialsFor,
  placeLabel,
  resumeHtml,
  roleLabel,
  semesterGoalFor,
  standingFor,
  thisWeekItems,
  weekWindowLabel,
  weeklyAchievementFor,
  yearLabel,
  type ResumeItem,
} from '@/lib/profile-resume';
import { canPrintInPlace, printResumePdf } from '@/lib/view-resume-pdf';
import { api } from '@convex/_generated/api';

export default function ProfileScreen() {
  const colors = useJourneyColors();
  const { isMobileWeb, width } = useBreakpoint();
  const { isAuthenticated } = useConvexAuth();
  const auth = useAppAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const history = useQuery(api.activity.list, isAuthenticated ? {} : 'skip');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const courses: ResumeItem[] = (history?.courses ?? []).map((course) => ({ ...course }));
  const events: ResumeItem[] = (history?.events ?? []).map((event) => ({ ...event }));
  const record = [...courses, ...events];
  const name = displayNameFor(user, auth.displayName);
  const standing = standingFor(courses.length, events.length);
  const email = user?.email ?? auth.email;
  const phone = user?.phone ?? auth.phone;
  const year = yearLabel(user);
  const place = placeLabel(user);
  const role = roleLabel(user);
  const industry = industryLabel(user);
  const company = companyLabel(user);
  const goals = broadGoalsFor(user);
  const weekly = weeklyAchievementFor(record, user);
  const semester = semesterGoalFor(user);
  const weekLabel = weekWindowLabel();
  const weekItems = thisWeekItems(record);
  const signedIn = auth.isAuthenticated || isAuthenticated;
  const meta = [year, place, email, phone].filter(Boolean).join(' · ');

  const openPdf = () => {
    const html = resumeHtml({
      name,
      email,
      phone,
      place,
      year,
      standing,
      goals,
      weekly,
      semester,
      weekLabel,
      courses,
      events,
    });
    setPdfError(null);
    if (!canPrintInPlace()) {
      setPreviewHtml(html);
      return;
    }
    setPdfBusy(true);
    void printResumePdf(html)
      .catch((error: unknown) => {
        setPdfError(error instanceof Error ? error.message : 'Could not open resume PDF');
      })
      .finally(() => {
        setPdfBusy(false);
      });
  };

  return (
    <ThemedView style={styles.container}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTop, { backgroundColor: colors.accentGlow }]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobSide, { backgroundColor: colors.goldGlow }]} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isMobileWeb && { paddingBottom: WebTabBarHeight + Spacing.two },
        ]}>
        <SafeAreaView style={[styles.safeArea, !isMobileWeb && { paddingBottom: BottomTabInset + Spacing.two }]}>
          <ThemedView type="backgroundElement" style={styles.hero}>
            <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
              <ThemedText type="smallBold" style={{ color: colors.accent, fontFamily: Fonts.serif }}>
                {initialsFor(name)}
              </ThemedText>
            </View>
            <View style={styles.heroCopy}>
              <View style={styles.nameRow}>
                <ThemedText type="default" style={styles.name} numberOfLines={1}>
                  {name}
                </ThemedText>
                <View style={[styles.standing, { backgroundColor: colors.goldSoft }]}>
                  <ThemedText type="code" style={{ color: colors.gold }}>
                    {standing.label}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {meta || 'Add year, location, and contact in onboarding'}
              </ThemedText>
              <View style={styles.chipRow}>
                <Chip label="Role" value={role} tint={colors.accentSoft} />
                <Chip label="Industry" value={industry} tint={colors.accentSoft} />
                <Chip label="Company" value={company} tint={colors.goldSoft} />
              </View>
            </View>
          </ThemedView>

          {!signedIn ? <AuthCard /> : null}

          {signedIn ? (
            <>
              <View style={[styles.split, width < 560 && styles.splitStack]}>
                <ThemedView type="backgroundElement" style={styles.panel}>
                  <ThemedText type="code" themeColor="textSecondary" style={styles.sectionLabel}>
                    This week · {weekLabel}
                  </ThemedText>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {weekly.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                    {weekly.source === 'logged' && weekItems.length > 0
                      ? weekItems
                          .map((item) => `${item.name} · ${formatLoggedDate(item.completedAt)}`)
                          .join(' · ')
                      : weekly.detail}
                  </ThemedText>
                </ThemedView>
                <ThemedView type="backgroundElement" style={styles.panel}>
                  <ThemedText type="code" themeColor="textSecondary" style={styles.sectionLabel}>
                    Semester
                  </ThemedText>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {semester.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                    {semester.detail}
                  </ThemedText>
                </ThemedView>
              </View>

              <View style={styles.actions}>
                <View style={styles.actionGrow}>
                  <AppButton
                    disabled={pdfBusy}
                    label={pdfBusy ? 'Opening…' : 'View resume PDF'}
                    onPress={openPdf}
                  />
                </View>
                <View style={styles.actionGrow}>
                  <AppButton label="Sign out" variant="secondary" onPress={() => void auth.logout()} />
                </View>
              </View>
              {pdfError ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {pdfError}
                </ThemedText>
              ) : null}
            </>
          ) : null}
        </SafeAreaView>
      </ScrollView>
      {previewHtml ? <ResumePreview html={previewHtml} onClose={() => setPreviewHtml(null)} /> : null}
    </ThemedView>
  );
}

function ResumePreview({ html, onClose }: { html: string; onClose: () => void }) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  return (
    <View style={styles.previewShell}>
      <ThemedView type="background" style={styles.previewBar}>
        <ThemedText type="smallBold">Resume</ThemedText>
        <View style={styles.previewActions}>
          <AppButton
            label="Print / Save as PDF"
            onPress={() => frameRef.current?.contentWindow?.print()}
          />
          <AppButton label="Close" variant="secondary" onPress={onClose} />
        </View>
      </ThemedView>
      {createElement('iframe', {
        ref: frameRef,
        srcDoc: html,
        title: 'Resume preview',
        style: {
          flex: 1,
          width: '100%',
          border: 'none',
          backgroundColor: '#ffffff',
        },
      })}
    </View>
  );
}

function Chip({ label, value, tint }: { label: string; value?: string; tint: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: tint }]}>
      <ThemedText type="code" themeColor="textSecondary">
        {label} · {value?.trim() || '—'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 0,
  },
  safeArea: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    top: -140,
    right: -120,
    width: 340,
    height: 340,
  },
  blobSide: {
    top: 380,
    left: -160,
    width: 320,
    height: 320,
  },
  hero: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  name: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    lineHeight: 26,
    flexShrink: 1,
  },
  standing: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 999,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
  },
  split: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  splitStack: {
    flexDirection: 'column',
  },
  panel: {
    flex: 1,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    minWidth: 0,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionGrow: {
    flex: 1,
  },
  previewShell: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    backgroundColor: '#ffffff',
  },
  previewBar: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  previewActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
