import { useState, useEffect, useCallback } from 'react';
import type { ProjectMeta } from '@/lib/db';

// Re-export under the canonical name for consumers
export type DiscoveryEntry = ProjectMeta;

interface UpdateDiscoveryOptions {
  isDiscoverable: boolean;
  domainRestriction?: string | null;
}

interface UseDiscoveryReturn {
  /** All discoverable projects visible to the current user. */
  discoverableFiles: DiscoveryEntry[];
  isLoading: boolean;
  error: string | null;
  /**
   * Updates the discovery settings for a project the caller owns.
   * `fileId` maps to the project's UUID (projectId).
   */
  updateDiscovery(fileId: string, opts: UpdateDiscoveryOptions): Promise<void>;
  /** Re-fetches the list of discoverable projects from the server. */
  refresh(): Promise<void>;
}

/**
 * Manages the VectorFlow project discovery registry backed by Cloudflare D1.
 *
 * Fetches discoverable projects on mount and exposes an update helper that
 * calls `/api/discovery` (PUT). Domain filtering and authentication are
 * enforced server-side.
 */
export function useDiscovery(): UseDiscoveryReturn {
  const [discoverableFiles, setDiscoverableFiles] = useState<DiscoveryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/discovery');
      if (res.status === 401) {
        // Not signed in — silently return empty list
        setDiscoverableFiles([]);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).error ?? `Request failed: ${res.status}`);
      }
      const data = (await res.json()) as { projects: DiscoveryEntry[] };
      setDiscoverableFiles(data.projects ?? []);
    } catch (err: any) {
      console.error('[useDiscovery] fetch error:', err);
      setError(err.message ?? 'Failed to load discoverable projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const updateDiscovery = useCallback(
    async (fileId: string, opts: UpdateDiscoveryOptions) => {
      const res = await fetch('/api/discovery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: fileId,
          isDiscoverable: opts.isDiscoverable,
          domainRestriction: opts.domainRestriction ?? null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).error ?? `Update failed: ${res.status}`);
      }

      const data = (await res.json()) as { project: DiscoveryEntry };

      // Optimistically update local state
      setDiscoverableFiles((prev) => {
        const idx = prev.findIndex((e) => e.id === fileId);
        if (idx === -1) {
          if (data.project.isDiscoverable) return [...prev, data.project];
          return prev;
        }
        if (!data.project.isDiscoverable) {
          return prev.filter((e) => e.id !== fileId);
        }
        const next = [...prev];
        next[idx] = data.project;
        return next;
      });
    },
    [],
  );

  return {
    discoverableFiles,
    isLoading,
    error,
    updateDiscovery,
    refresh: fetchEntries,
  };
}
