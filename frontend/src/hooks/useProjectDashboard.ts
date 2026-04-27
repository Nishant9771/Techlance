import { useEffect, useState } from 'react';
import { subscribeProjectDashboard } from '@/services/firestore';

type DashboardState = {
  project: Record<string, unknown> | null;
  milestones: Record<string, unknown>[];
  applications: Record<string, unknown>[];
  aiAnalysis: Record<string, unknown> | null;
};

const initialState: DashboardState = {
  project: null,
  milestones: [],
  applications: [],
  aiAnalysis: null,
};

export function useProjectDashboard(projectId?: string) {
  const [data, setData] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) {
      setData(initialState);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeProjectDashboard(
      projectId,
      (payload) => {
        setData(payload);
        setLoading(false);
      },
      (err) => {
        setError(String(err?.message || err));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [projectId]);

  return { data, loading, error };
}
