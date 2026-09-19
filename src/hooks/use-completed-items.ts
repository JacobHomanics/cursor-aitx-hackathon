import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useCallback, useMemo } from 'react';

import { api } from '@convex/_generated/api';

/** Which events were attended or courses completed, and a way to change that. */
export function useCompletedItems(kind: 'event' | 'course' | 'internship') {
  const { isAuthenticated } = useConvexAuth();
  const history = useQuery(api.activity.list, isAuthenticated ? {} : 'skip');
  const setCompleted = useMutation(api.activity.setCompleted);

  const entries =
    kind === 'event' ? history?.events : kind === 'course' ? history?.courses : history?.internships;
  const completedIds = useMemo(() => new Set(entries?.map((entry) => entry.itemId)), [entries]);

  const setItemCompleted = useCallback(
    (itemId: string, completed: boolean) => setCompleted({ kind, itemId, completed }),
    [kind, setCompleted],
  );

  return { completedIds, setItemCompleted };
}
