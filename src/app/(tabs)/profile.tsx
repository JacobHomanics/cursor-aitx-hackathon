import { useConvexAuth, useQuery } from 'convex/react';
import { createElement, useRef, useState, type ReactNode } from 'react';
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
  const { isMobileWeb } = useBreakpoint();
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
  const goals = broadGoalsFor(user);
  const weekly = weeklyAchievementFor(record, user);
  const semester = semesterGoalFor(user);
  const weekLabel = weekWindowLabel();
  const weekItems = thisWeekItems(record);

  const openPdf = () => {
    const html = resumeHtml({
      name,
      email,
      phone,
      place: placeLabel(user),
      year: yearLabel(user),
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
          isMobileWeb && { paddingBottom: WebTabBarHeight + Spacing.five },
        ]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="code" themeColor="textSecondary" style={styles.eyebrow}>
              Profile
            </ThemedText>
            <ThemedText type="subtitle" style={{ fontFamily: Fonts.serif }}>
              Your path
            </ThemedText>
          </View>

          <AuthCard />

          {!isAuthenticated || !user ? (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Sign in to fill this with your account</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Until then, the sections below use placeholders so you can see the layout.
              </ThemedText>
            </ThemedView>
          ) : null}

          <Section label="Basics">
            <ThemedView type="backgroundElement" style={styles.identityCard}>
              <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
                <ThemedText type="smallBold" style={{ color: colors.accent }}>
                  {initialsFor(name)}
                </ThemedText>
              </View>
              <View style={styles.identityCopy}>
                <ThemedText type="default" style={styles.name}>
                  {name}
                </ThemedText>
                <FactRow label="School year" value={yearLabel(user)} />
                <FactRow label="Location" value={placeLabel(user)} />
                <FactRow label="Email" value={email} />
                {phone ? <FactRow label="Phone" value={phone} /> : null}
                <FactRow label="Standing" value={standing.label} />
              </View>
            </ThemedView>
          </Section>

          <Section label="Broad goals">
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{goals.title}</ThemedText>
              <ThemedText type="small">{goals.detail}</ThemedText>
              <FactRow label="Role" value={roleLabel(user)} />
              <FactRow label="Industry" value={industryLabel(user)} />
              <FactRow label="Company" value={companyLabel(user)} />
            </ThemedView>
          </Section>

          <Section label={`This week · ${weekLabel}`}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{weekly.title}</ThemedText>
              <ThemedText type="small">{weekly.detail}</ThemedText>
              {weekly.source === 'derived' ? (
                <ThemedText type="code" themeColor="textSecondary">
                  Placeholder until you log a course or event
                </ThemedText>
              ) : (
                weekItems.map((item) => (
                  <ThemedText key={`${item.kind}-${item.itemId}`} type="small" themeColor="textSecondary">
                    {item.kind === 'course' ? 'Course' : 'Event'} · {item.name} ·{' '}
                    {formatLoggedDate(item.completedAt)}
                  </ThemedText>
                ))
              )}
            </ThemedView>
          </Section>

          <Section label="Semester goal">
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{semester.title}</ThemedText>
              <ThemedText type="small">{semester.detail}</ThemedText>
              <ThemedText type="code" themeColor="textSecondary">
                Derived from your onboarding target — we can replace this with a saved goal later
              </ThemedText>
            </ThemedView>
          </Section>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Resume PDF</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Opens a printable resume with your basics, goals, this week, semester target, courses, and
              events.
            </ThemedText>
            <AppButton
              disabled={pdfBusy}
              label={pdfBusy ? 'Opening…' : 'View resume PDF'}
              onPress={openPdf}
            />
            {pdfError ? (
              <ThemedText type="small" themeColor="textSecondary">
                {pdfError}
              </ThemedText>
            ) : null}
          </ThemedView>
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

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="code" themeColor="textSecondary" style={styles.sectionLabel}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

function FactRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.factRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.factValue}>
        {value ?? '—'}
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
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
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
  header: {
    gap: Spacing.one,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  section: {
    gap: Spacing.two,
  },
  identityCard: {
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
  identityCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  name: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: Spacing.one,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  factValue: {
    flexShrink: 1,
    textAlign: 'right',
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
