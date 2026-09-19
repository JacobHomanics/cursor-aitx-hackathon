import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { CompletionButton } from '@/components/completion-button';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Fit = 'high' | 'medium' | 'low';

export function EventCard({
  event,
  attended,
  onAttendedChange,
}: {
  event: {
    id: string;
    name: string;
    url: string;
    startAt?: string;
    timezone?: string;
    location?: string;
    reason?: string;
    fit?: Fit;
    coverUrl?: string;
  };
  attended: boolean;
  onAttendedChange: (attended: boolean) => Promise<unknown>;
}) {
  return (
    <ThemedView type="backgroundElement" style={[styles.card, attended && styles.doneCard]}>
      {event.coverUrl ? (
        <Image source={{ uri: event.coverUrl }} style={styles.cover} contentFit="cover" />
      ) : null}
      <View style={styles.body}>
        <TitleRow name={event.name} fit={event.fit} />
        {formatWhen(event.startAt, event.timezone) ? (
          <ThemedText type="small" themeColor="textSecondary">
            {formatWhen(event.startAt, event.timezone)}
          </ThemedText>
        ) : null}
        {event.location ? (
          <ThemedText type="small" themeColor="textSecondary">
            {event.location}
          </ThemedText>
        ) : null}
        {event.reason ? <ThemedText type="small">{event.reason}</ThemedText> : null}
        <ExternalLink href={event.url as `${string}:${string}`}>
          <ThemedText type="linkPrimary">Open on Luma</ThemedText>
        </ExternalLink>
        <CompletionButton
          done={attended}
          todoLabel="I went to this event"
          doneLabel="Attended"
          onChange={onAttendedChange}
        />
      </View>
    </ThemedView>
  );
}

export function CourseCard({
  course,
  completed,
  onCompletedChange,
}: {
  course: {
    id: string;
    name: string;
    url: string;
    channel?: string;
    kind?: 'playlist' | 'video';
    videoCount?: string;
    duration?: string;
    reason?: string;
    fit?: Fit;
    coverUrl?: string;
  };
  completed: boolean;
  onCompletedChange: (completed: boolean) => Promise<unknown>;
}) {
  const meta = [
    course.kind === 'playlist' ? 'Playlist' : course.kind === 'video' ? 'Video' : null,
    course.channel,
    course.videoCount ?? course.duration,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ThemedView type="backgroundElement" style={[styles.card, completed && styles.doneCard]}>
      {course.coverUrl ? (
        <Image source={{ uri: course.coverUrl }} style={styles.cover} contentFit="cover" />
      ) : null}
      <View style={styles.body}>
        <TitleRow name={course.name} fit={course.fit} />
        {meta ? (
          <ThemedText type="small" themeColor="textSecondary">
            {meta}
          </ThemedText>
        ) : null}
        {course.reason ? <ThemedText type="small">{course.reason}</ThemedText> : null}
        <ExternalLink href={course.url as `${string}:${string}`}>
          <ThemedText type="linkPrimary">Open on YouTube</ThemedText>
        </ExternalLink>
        <CompletionButton
          done={completed}
          todoLabel="I completed this course"
          doneLabel="Completed"
          onChange={onCompletedChange}
        />
      </View>
    </ThemedView>
  );
}

export function ListingCard({
  listing,
}: {
  listing: {
    id: string;
    name: string;
    url: string;
    company?: string;
    location?: string;
    category?: string;
    publishedAt?: string;
    reason?: string;
    fit?: Fit;
  };
}) {
  const meta = [listing.company, listing.location, listing.category, formatPosted(listing.publishedAt)]
    .filter(Boolean)
    .join(' · ');

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.body}>
        <TitleRow name={listing.name} fit={listing.fit} />
        {meta ? (
          <ThemedText type="small" themeColor="textSecondary">
            {meta}
          </ThemedText>
        ) : null}
        {listing.reason ? <ThemedText type="small">{listing.reason}</ThemedText> : null}
        <ExternalLink href={listing.url as `${string}:${string}`}>
          <ThemedText type="linkPrimary">Open listing</ThemedText>
        </ExternalLink>
      </View>
    </ThemedView>
  );
}

function TitleRow({ name, fit }: { name: string; fit?: Fit }) {
  return (
    <View style={styles.titleRow}>
      <ThemedText type="smallBold" style={styles.name}>
        {name}
      </ThemedText>
      {fit ? (
        <ThemedView type="backgroundSelected" style={styles.fitBadge}>
          <ThemedText type="code" themeColor="textSecondary">
            {fit}
          </ThemedText>
        </ThemedView>
      ) : null}
    </View>
  );
}

function formatWhen(iso?: string, timeZone?: string) {
  if (!iso) {
    return undefined;
  }

  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    });
  } catch {
    return iso;
  }
}

function formatPosted(iso?: string) {
  if (!iso) {
    return undefined;
  }
  try {
    return `Posted ${new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  } catch {
    return undefined;
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  doneCard: {
    opacity: 0.75,
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  body: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
  fitBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
});
