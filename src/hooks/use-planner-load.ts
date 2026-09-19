import { useEffect, useRef, useState } from 'react';

/** Runs a planner fetch once when the tab is ready and there is no saved result yet. */
export function usePlannerLoad({
  ready,
  hasLatest,
  load,
  fallbackError,
}: {
  ready: boolean;
  hasLatest: boolean | undefined;
  load: () => Promise<unknown>;
  fallbackError: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ready || hasLatest === undefined || hasLatest || started.current) {
      return;
    }

    started.current = true;
    setError(null);
    setBusy(true);
    void load()
      .catch((loadError: unknown) => {
        started.current = false;
        setError(loadError instanceof Error ? loadError.message : fallbackError);
      })
      .finally(() => {
        setBusy(false);
      });
  }, [fallbackError, hasLatest, load, ready]);

  return { busy, error };
}
