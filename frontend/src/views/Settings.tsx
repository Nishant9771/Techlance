import React, { useState } from 'react';
import { useNavigate } from '@/lib/router';
import { ArrowLeft, Settings as SettingsIcon, Bell, Lock, Palette, Globe } from 'lucide-react';
import { TechBackground } from '../components/TechBackground';
import { logoutCurrentUser } from '@/lib/firebaseAuth';

export default function Settings() {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const sections = [
    { icon: Bell, title: 'Notifications', desc: 'Manage email and push alerts' },
    { icon: Lock, title: 'Privacy & Security', desc: 'Password, 2FA, and sessions' },
    { icon: Palette, title: 'Appearance', desc: 'Theme and display preferences' },
    { icon: Globe, title: 'Language & Region', desc: 'Timezone and localization' },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white font-sans relative overflow-y-auto">
      <div className="fixed inset-0 z-0">
        <TechBackground />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Return Home</span>
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-400" />
            Settings
          </h1>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="space-y-4">
            {sections.map((section, i) => (
              <button key={i} className="w-full p-4 rounded-2xl bg-slate-950/50 border border-white/5 hover:bg-white/5 transition-colors flex items-center gap-4 text-left group">
                <div className="p-3 rounded-xl bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                  <section.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-200 group-hover:text-white transition-colors">{section.title}</h3>
                  <p className="text-sm text-slate-500">{section.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-white/10">
            <button 
              onClick={async () => {
                setIsSigningOut(true);

                try {
                  await logoutCurrentUser();
                  localStorage.removeItem('role');
                  navigate('/');
                } finally {
                  setIsSigningOut(false);
                }
              }}
              disabled={isSigningOut}
              className="px-6 py-3 rounded-xl bg-red-500/10 disabled:opacity-70 disabled:cursor-not-allowed text-red-400 hover:bg-red-500/20 hover:text-red-300 font-medium transition-colors text-sm"
            >
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
