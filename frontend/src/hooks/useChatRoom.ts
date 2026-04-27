import { useEffect, useState } from 'react';
import { sendChatMessage, subscribeChatMessages } from '@/services/firestore';

type SendPayload = {
  senderId: string;
  senderRole?: 'user' | 'actor' | 'supplier';
  text: string;
  participants?: string[];
  projectId?: string;
  attachmentUrl?: string;
};

export function useChatRoom(roomId?: string) {
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(Boolean(roomId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeChatMessages(
      roomId,
      (rows) => {
        setMessages(rows);
        setLoading(false);
      },
      (err) => {
        setError(String(err?.message || err));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [roomId]);

  async function sendMessage(payload: SendPayload) {
    if (!roomId) {
      throw new Error('roomId is required');
    }

    return sendChatMessage(roomId, payload);
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
}
