import { useEffect, useState } from 'react';
import { subscribeNotifications } from '@/services/firestore';

export function useNotifications(uid?: string) {
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeNotifications(
      uid,
      (items) => {
        setNotifications(items);
        setLoading(false);
      },
      (err) => {
        setError(String(err?.message || err));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  return { notifications, loading, error };
}
