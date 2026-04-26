import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@/lib/router';
import { motion } from 'motion/react';
import { useRole } from '../context/RoleContext';
import { 
  ArrowLeft, 
  FileSignature, 
  ShieldCheck, 
  Clock, 
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import { TechBackground } from '../components/TechBackground';

export default function Contract() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate contract generation delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="absolute inset-0 z-0">
          <TechBackground />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <FileSignature className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Generating Contract...</h2>
            <p className="text-slate-400 text-sm">Drafting terms for Offer #{id}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white font-sans selection:bg-emerald-500/30 relative overflow-y-auto">
      <div className="fixed inset-0 z-0">
        <TechBackground />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-12">
        <button 
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.1)] relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
          
          <div className="p-8 md:p-12 text-center border-b border-white/5 relative z-10">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Contract Established</h1>
            <p className="text-slate-400">Offer #{id} has been accepted and the contract is now active.</p>
          </div>

          <div className="p-8 md:p-12 bg-slate-950/30 relative z-10">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-emerald-400" />
              Contract Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Agreed Price</p>
                <p className="text-xl font-semibold text-white flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  6,500
                </p>
              </div>
              <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Timeline</p>
                <p className="text-xl font-semibold text-white flex items-center gap-1">
                  <Clock className="w-5 h-5 text-blue-400" />
                  6 Weeks
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-200">Funds in Escrow</p>
                  <p className="text-xs text-emerald-400/70 mt-1">The agreed amount has been securely held in escrow.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-200">Workspace Created</p>
                  <p className="text-xs text-blue-400/70 mt-1">A dedicated project workspace and chat have been initialized.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate(`/workspace/${id}`)}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                Go to Workspace
              </button>
              <button 
                onClick={() => navigate('/messages')}
                className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-white/10 transition-colors"
              >
                {role === 'actor' ? 'Message User' : 'Message Actor'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
