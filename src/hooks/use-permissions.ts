import { useState, useCallback } from 'react';
import type { ProjectPermission } from '@/lib/db';

export function usePermissions(projectId: string | undefined) {
  const [permissions, setPermissions] = useState<ProjectPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/permissions`);
      if (!res.ok) throw new Error('Failed to load permissions');
      const data = await res.json();
      setPermissions(data.permissions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const updatePermissions = useCallback(async (newPermissions: Omit<ProjectPermission, 'projectId'>[]) => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: newPermissions })
      });
      if (!res.ok) throw new Error('Failed to save permissions');
      
      setPermissions(newPermissions as ProjectPermission[]);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  return {
    permissions,
    isLoading,
    error,
    fetchPermissions,
    updatePermissions
  };
}
