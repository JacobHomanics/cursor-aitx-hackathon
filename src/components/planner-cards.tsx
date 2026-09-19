import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const OPEN_ICON = { ios: 'arrow.up.right.square', android: 'open_in_new', web: 'open_in_new' } as const;
const DONE_ICON = { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' } as const;
const TODO_ICON = {
  ios: 'checkmark.circle',
  android: 'radio_button_unchecked',
  web: 'radio_button_unchecked',
} as const;

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
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.name}>
            {event.name}
          </ThemedText>
          <CardActions
            url={event.url}
            openLabel="Open on Luma"
            done={attended}
            todoLabel="I went to this event"
            doneLabel="Attended, tap to undo"
            onDoneChange={onAttendedChange}
          />
        </View>
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
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.name}>
            {course.name}
          </ThemedText>
          <CardActions
            url={course.url}
            openLabel="Open on YouTube"
            done={completed}
            todoLabel="I completed this course"
            doneLabel="Completed, tap to undo"
            onDoneChange={onCompletedChange}
          />
        </View>
        {meta ? (
          <ThemedText type="small" themeColor="textSecondary">
            {meta}
          </ThemedText>
        ) : null}
      </View>
    </ThemedView>
  );
}

export function ListingCard({
  listing,
  completed,
  onCompletedChange,
}: {
  listing: {
    id: string;
    name: string;
    url: string;
    company?: string;
    location?: string;
    category?: string;
    publishedAt?: string;
  };
  completed?: boolean;
  onCompletedChange?: (completed: boolean) => Promise<unknown>;
}) {
  const meta = [listing.company, listing.location, listing.category, formatPosted(listing.publishedAt)]
    .filter(Boolean)
    .join(' · ');

  return (
    <ThemedView type="backgroundElement" style={[styles.card, completed && styles.doneCard]}>
      <View style={styles.body}>
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.name}>
            {listing.name}
          </ThemedText>
          <CardActions
            url={listing.url}
            openLabel="Open listing"
            done={completed}
            todoLabel={onCompletedChange ? 'I completed this internship' : undefined}
            doneLabel={onCompletedChange ? 'Completed, tap to undo' : undefined}
            onDoneChange={onCompletedChange}
          />
        </View>
        {meta ? (
          <ThemedText type="small" themeColor="textSecondary">
            {meta}
          </ThemedText>
        ) : null}
      </View>
    </ThemedView>
  );
}

function CardActions({
  url,
  openLabel,
  done,
  todoLabel,
  doneLabel,
  onDoneChange,
}: {
  url: string;
  openLabel: string;
  done?: boolean;
  todoLabel?: string;
  doneLabel?: string;
  onDoneChange?: (done: boolean) => Promise<unknown>;
}) {
  const theme = useTheme();
  const [pending, setPending] = useState(false);

  return (
    <View style={styles.actions}>
      <ExternalLink href={url as `${string}:${string}`} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={openLabel}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <SymbolView name={OPEN_ICON} size={18} tintColor={theme.text} />
        </Pressable>
      </ExternalLink>
      {onDoneChange && todoLabel && doneLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={done ? doneLabel : todoLabel}
          disabled={pending}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, pending && styles.disabled]}
          onPress={() => {
            setPending(true);
            void onDoneChange(!done).finally(() => {
              setPending(false);
            });
          }}>
          <SymbolView name={done ? DONE_ICON : TODO_ICON} size={18} tintColor={theme.text} />
        </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  iconButton: {
    width: Spacing.four,
    height: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
