import { useAction, useConvexAuth, useQuery } from 'convex/react';

import { ListingCard } from '@/components/planner-cards';
import { PlannerFrame } from '@/components/planner-frame';
import { ThemedText } from '@/components/themed-text';
import { useCompletedItems } from '@/hooks/use-completed-items';
import { usePlannerLoad } from '@/hooks/use-planner-load';
import { api } from '@convex/_generated/api';

export default function WeeklyInternshipsScreen() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const latest = useQuery(api.internships.latest, isAuthenticated ? {} : 'skip');
  const recommendInternship = useAction(api.internships.recommendInternship);
  const { completedIds, setItemCompleted } = useCompletedItems('internship');
  const { busy, error } = usePlannerLoad({
    ready: Boolean(isAuthenticated && user),
    hasLatest: latest === undefined ? undefined : latest !== null,
    load: () => recommendInternship({}),
    fallbackError: 'Could not update internships',
  });
  const listings = latest?.listings ?? [];

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
          ) : null}

          {busy || latest === undefined ? (
            <ThemedText type="small" themeColor="textSecondary">
              Finding internships…
            </ThemedText>
          ) : listings.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No internship listings this week.
            </ThemedText>
          ) : (
            listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                completed={completedIds.has(listing.id)}
                onCompletedChange={(completed) => setItemCompleted(listing.id, completed)}
              />
            ))
          )}
        </>
      )}
    </PlannerFrame>
  );
}
