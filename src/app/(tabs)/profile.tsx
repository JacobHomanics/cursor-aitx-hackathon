import { useConvexAuth, useQuery } from 'convex/react';
import { createElement, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton } from '@/components/ui/app-button';
import { buildJourney, yearlyGoals } from '@/constants/journey';
import type { CollegeYear } from '@/constants/onboarding';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing, WebTabBarHeight } from '@/constants/theme';
import { useAppAuth } from '@/hooks/use-app-auth';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useJourneyColors } from '@/hooks/use-journey-colors';
import {
  briefProfileFor,
  companyLabel,
  displayNameFor,
  industryLabel,
  initialsFor,
  placeLabel,
  resumeHtml,
  roleLabel,
  standingFor,
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
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const journeyProfile = user
    ? {
        collegeYear: user.collegeYear as CollegeYear | undefined,
        city: user.city,
        state: user.state,
        country: user.country,
        roleInterest: user.roleInterest,
        preferredCompany: user.preferredCompany,
      }
    : null;
  const { goal: graduation } = buildJourney(journeyProfile);
  const years = yearlyGoals(journeyProfile);
  const thisYear = years.find((goal) => goal.status === 'current') ?? years[0];

  const internships: ResumeItem[] = (history?.internships ?? []).map((item) => ({ ...item }));
  const courses: ResumeItem[] = (history?.courses ?? []).map((item) => ({ ...item }));
  const events: ResumeItem[] = (history?.events ?? []).map((item) => ({ ...item }));
  const record = [...internships, ...courses, ...events];
  const name = displayNameFor(user, auth.displayName);
  const standing = standingFor(courses.length, events.length, internships.length);
  const weekly = weeklyAchievementFor(record, user);
  const email = user?.email ?? auth.email;
  const phone = user?.phone ?? auth.phone;
  const brief = briefProfileFor(user, standing, graduation.title, thisYear?.title ?? '—', {
    internships: internships.length,
    courses: courses.length,
    events: events.length,
  });

  const openPdf = () => {
    const html = resumeHtml({
      name,
      email,
      phone,
      place: placeLabel(user),
      year: yearLabel(user),
      school: user?.highSchool,
      gpa: user?.gpa != null ? `GPA ${user.gpa}` : undefined,
      skills: user?.hardSkills?.length
        ? user.hardSkills.map((skill) => `${skill.name} (${skill.level}/5)`).join(', ')
        : undefined,
      standing,
      graduation,
      yearly: years,
      weekly,
      weekLabel: weekWindowLabel(),
      internships,
      courses,
      events,
    });
    if (!canPrintInPlace()) {
      setPreviewHtml(html);
      return;
    }
    setPdfBusy(true);
    void printResumePdf(html).finally(() => setPdfBusy(false));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView
        style={[
          styles.safeArea,
          { paddingBottom: isMobileWeb ? WebTabBarHeight + Spacing.three : BottomTabInset + Spacing.three },
        ]}>
        <View style={styles.stack}>
          <ThemedText type="code" themeColor="textSecondary" style={styles.eyebrow}>
            Profile
          </ThemedText>

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
              <FactRow label="High school" value={user?.highSchool} />
              <FactRow label="GPA" value={user?.gpa != null ? String(user.gpa) : undefined} />
              <FactRow label="School year" value={yearLabel(user)} />
              <FactRow label="Location" value={placeLabel(user)} />
              <FactRow label="Role" value={roleLabel(user)} />
              <FactRow label="Industry" value={industryLabel(user)} />
              <FactRow label="Company" value={companyLabel(user)} />
              <FactRow label="Email" value={email} />
              {phone ? <FactRow label="Phone" value={phone} /> : null}
            </View>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.overview}>
            <ThemedText type="code" themeColor="textSecondary">
              Brief
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {brief}
            </ThemedText>
            <Row label="Graduation" value={graduation.title} accent={colors.gold} />
            <Row label="This year" value={thisYear?.title ?? '—'} accent={colors.accent} />
            <Row label="This week" value={standing.label} />
            <View style={styles.counts}>
              <Count label="Internships" value={internships.length} />
              <Count label="Courses" value={courses.length} />
              <Count label="Events" value={events.length} />
            </View>
          </ThemedView>
        </View>

        <View style={styles.actions}>
          <View style={styles.action}>
            <AppButton disabled={pdfBusy} label={pdfBusy ? 'Opening…' : 'Resume'} onPress={openPdf} />
          </View>
          {isAuthenticated ? (
            <View style={styles.action}>
              <AppButton label="Log out" variant="secondary" onPress={() => void auth.logout()} />
            </View>
          ) : null}
        </View>
      </SafeAreaView>

      {previewHtml ? <ResumePreview html={previewHtml} onClose={() => setPreviewHtml(null)} /> : null}
    </ThemedView>
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

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="code" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={[styles.rowValue, accent ? { color: accent } : null]}>
        {value}
      </ThemedText>
    </View>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.count}>
      <ThemedText type="smallBold">{value}</ThemedText>
      <ThemedText type="code" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function ResumePreview({ html, onClose }: { html: string; onClose: () => void }) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  return (
    <View style={styles.previewShell}>
      <ThemedView type="background" style={styles.previewBar}>
        <ThemedText type="smallBold">Resume</ThemedText>
        <View style={styles.previewActions}>
          <AppButton label="Print / Save as PDF" onPress={() => frameRef.current?.contentWindow?.print()} />
          <AppButton label="Close" variant="secondary" onPress={onClose} />
        </View>
      </ThemedView>
      {createElement('iframe', {
        ref: frameRef,
        srcDoc: html,
        title: 'Resume preview',
        style: { flex: 1, width: '100%', border: 'none', backgroundColor: '#ffffff' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  stack: {
    gap: Spacing.three,
    flexShrink: 1,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  identityCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  name: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: Spacing.one,
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
  overview: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  row: {
    gap: Spacing.half,
  },
  rowValue: {
    flexShrink: 1,
  },
  counts: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingTop: Spacing.one,
  },
  count: {
    flex: 1,
    gap: Spacing.half,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  action: {
    flexGrow: 0,
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
