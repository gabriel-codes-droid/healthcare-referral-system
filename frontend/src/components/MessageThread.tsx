import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Message } from '../Types';

const POLL_INTERVAL_MS = 4000;

type Props = {
  referralId: string;
  active: boolean;
};

export default function MessageThread({ referralId, active }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const load = () => {
      api
        .getMessages(referralId)
        .then((msgs) => {
          if (!cancelled) setMessages(msgs);
        })
        .catch(() => {
          /* keep last known messages on a transient poll failure */
        });
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [referralId, active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      const message = await api.sendMessage(referralId, text.trim());
      setMessages((prev) => [...prev, message]);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-thread">
      <div className="message-list">
        {messages.length === 0 ? (
          <p className="empty-text">No messages yet — start the conversation</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-bubble ${msg.senderOrg === user?.organization ? 'own' : ''}`}
            >
              <strong>{msg.senderName}</strong>
              <p>{msg.text}</p>
              <small>{new Date(msg.createdAt).toLocaleString()}</small>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      {error && <p className="form-error">{error}</p>}
      <form className="message-input-row" onSubmit={handleSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" className="btn-primary btn-sm" disabled={sending || !text.trim()}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
