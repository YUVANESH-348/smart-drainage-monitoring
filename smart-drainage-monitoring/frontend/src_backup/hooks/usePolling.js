// frontend/src/hooks/usePolling.js
//
// Generic polling hook. Calls `fetchFn` immediately, then again every
// `intervalMs`, keeping loading/error/data state. Used instead of
// WebSockets, per the project's "polling every 5-10s" requirement.

import { useEffect, useRef, useState, useCallback } from 'react';

export function usePolling(fetchFn, intervalMs = 7000, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const savedFetchFn = useRef(fetchFn);
  savedFetchFn.current = fetchFn;

  const run = useCallback(async () => {
    try {
      const result = await savedFetchFn.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
    const id = setInterval(run, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);

  return { data, error, loading, refetch: run };
}
