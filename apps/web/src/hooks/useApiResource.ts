'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  AuthenticationRequiredError,
  apiRequest,
  currentLoginHref,
} from '@/lib/api';

export function useApiResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((current) => current + 1), []);
  useEffect(() => {
    void version;
    const controller = new AbortController();
    queueMicrotask(async () => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest<T>(path, { signal: controller.signal });
        if (!controller.signal.aborted) setData(result);
      } catch (cause) {
        if (
          !controller.signal.aborted &&
          cause instanceof AuthenticationRequiredError
        ) {
          window.location.assign(currentLoginHref());
          return;
        }
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : '取得に失敗しました。',
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [path, version]);
  return { data, loading, error, reload };
}
