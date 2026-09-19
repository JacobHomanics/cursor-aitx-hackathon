import { useAction, useConvexAuth, useQuery } from 'convex/react';

import { EventCard } from '@/components/planner-cards';
import { PlannerFrame } from '@/components/planner-frame';
import { ThemedText } from '@/components/themed-text';
import { useCompletedItems } from '@/hooks/use-completed-items';
import { usePlannerLoad } from '@/hooks/use-planner-load';
import { api } from '@convex/_generated/api';

export default function WeeklyEventsScreen() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const latest = useQuery(api.analyzer.latest, isAuthenticated ? {} : 'skip');
  const analyzeEvents = useAction(api.analyzer.analyzeEvents);
  const { completedIds, setItemCompleted } = useCompletedItems('event');
  const { busy, error } = usePlannerLoad({
    ready: Boolean(isAuthenticated && user),
    hasLatest: latest === undefined ? undefined : latest !== null,
    load: () => analyzeEvents({}),
    fallbackError: 'Could not update events',
  });

  return (
    <PlannerFrame>
      {!user ? (
        <ThemedText type="small" themeColor="textSecondary">
          Loading this week's plan…
        </ThemedText>
      ) : (
        <>
          {error ? (
            <ThemedText type="small" themeColor="textSecondary">
              {error}
            </ThemedText>
          ) : busy || latest === undefined ? (
            <ThemedText type="small" themeColor="textSecondary">
              Finding events…
            </ThemedText>
          ) : latest === null || latest.events.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No nearby events this week.
            </ThemedText>
          ) : (
            latest.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                attended={completedIds.has(event.id)}
                onAttendedChange={(attended) => setItemCompleted(event.id, attended)}
              />
            ))
          )}
        </>
      )}
    </PlannerFrame>
  );
}
