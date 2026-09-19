import { useAction, useQuery } from 'convex/react';
import { useEffect, useRef } from 'react';

import { journeyProfileKey, type JourneyProfile } from '@/constants/journey';
import { api } from '@convex/_generated/api';

/** Loads ChatGPT internship titles for the path, and refreshes them if the profile changes. */
export function useJourneyTitles(profile: JourneyProfile | null, enabled: boolean) {
  const plan = useQuery(api.journey.latest, enabled ? {} : 'skip');
  const generateTitles = useAction(api.journey.generateTitles);
  const profileKey = journeyProfileKey(profile);
  const started = useRef(false);
  const trackedKey = useRef(profileKey);
  const ready = enabled && Boolean(profile?.roleInterest);

  if (trackedKey.current !== profileKey) {
    trackedKey.current = profileKey;
    started.current = false;
  }

  useEffect(() => {
    if (!ready || plan === undefined || started.current) {
      return;
    }
    if (plan?.profileKey === profileKey) {
      return;
    }

    started.current = true;
    void generateTitles({}).catch(() => {
      started.current = false;
    });
  }, [generateTitles, plan, profileKey, ready]);

  return plan?.profileKey === profileKey ? plan.titles : undefined;
}
