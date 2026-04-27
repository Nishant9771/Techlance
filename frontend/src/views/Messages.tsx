import React, { useMemo, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { ArrowLeft, MessageSquare, Search } from 'lucide-react';
import { TechBackground } from '../components/TechBackground';
import { useAuth } from '@/context/AuthContext';
import { useChatRoom } from '@/hooks/useChatRoom';

export default function Messages() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const roomId = useMemo(() => (user?.uid ? `inbox_${user.uid}` : ''), [user?.uid]);
  const { messages, sendMessage } = useChatRoom(roomId);
  const [draft, setDraft] = useState('');

  async function handleSend() {
    if (!user || !draft.trim()) {
      return;
    }

    await sendMessage({
      senderId: user.uid,
      senderRole: profile?.role || 'user',
      text: draft.trim(),
      participants: [user.uid],
      projectId: undefined,
    });

    setDraft('');
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white font-sans relative overflow-y-auto">
      <div className="fixed inset-0 z-0">
        <TechBackground />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Return Home</span>
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            Messages
          </h1>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl h-[600px] flex overflow-hidden shadow-xl">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-white/10 flex flex-col hidden md:flex">
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search messages..." 
                  className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500/50 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {[1].map((i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 cursor-pointer transition-colors flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                    <img src={`https://picsum.photos/seed/chat${i}/100/100`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-medium text-white truncate">My Inbox</p>
                      <span className="text-[10px] text-slate-500">{messages.length} msgs</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">Realtime Firestore chat room</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Your Messages</h3>
                  <p className="text-slate-400 text-sm max-w-sm">Start chatting to create your live Firestore thread.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={String(message.id)} className="rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm">
                    <p className="text-xs text-slate-500">{String(message.senderRole || 'user')}</p>
                    <p className="text-slate-100">{String(message.text || '')}</p>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-white/10 p-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 bg-slate-950/60 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => void handleSend()}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
