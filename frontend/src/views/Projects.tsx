import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from '@/lib/router';
import { getSmartImage } from '@/utils/assetManager';
import { useRole } from '../context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { subscribeMyProjects, updateProjectProgress, type LiveProjectPost } from '@/lib/liveData';
import { 
  ArrowLeft, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  Activity,
  ChevronRight,
  FileSignature,
  LayoutDashboard
} from 'lucide-react';
import { TechBackground } from '../components/TechBackground';

// Mock Data
const mockProjects = [
  { 
    id: 101, 
    title: 'Smart Home Hub Prototype', 
    status: 'Active', 
    progress: 45, 
    actor: 'Elena Rodriguez', 
    category: 'IoT / Hardware',
    lastUpdated: '2 hours ago'
  },
  { 
    id: 102, 
    title: 'AI Drone Navigation System', 
    status: 'Active', 
    progress: 15, 
    actor: 'Marcus Chen', 
    category: 'AI / ML',
    lastUpdated: '1 day ago'
  },
  { 
    id: 103, 
    title: 'Automated Hydroponics Controller', 
    status: 'Completed', 
    progress: 100, 
    actor: 'IoT Solutions Ltd.', 
    category: 'Hardware',
    lastUpdated: '2 weeks ago'
  },
];

function formatLiveProject(project: LiveProjectPost) {
  return {
    id: project.id,
    title: project.title,
    status: project.status === 'Completed' ? 'Completed' : 'Active',
    progress: project.progress ?? 0,
    actor: project.whoNeeded || 'Open request',
    category: project.category,
    lastUpdated: 'Live now',
  };
}

export default function Projects() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed'>('Active');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setProjects(mockProjects);
      return;
    }

    const unsubscribe = subscribeMyProjects(
      user.uid,
      (liveProjects) => {
        setProjects([...liveProjects.map(formatLiveProject), ...mockProjects]);
        setLoading(false);
      },
      (error) => {
        console.warn('Unable to load live projects.', error);
        setProjects(mockProjects);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  const filteredProjects = projects.filter(p => p.status === activeTab);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white font-sans selection:bg-blue-500/30 relative overflow-y-auto">
      <div className="fixed inset-0 z-0">
        <TechBackground />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/home')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <FolderKanban className="w-8 h-8 text-blue-400" />
                My Projects
              </h1>
              <p className="text-sm text-slate-400 mt-1">Manage and track your active contracts</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('Active')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'Active' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('Completed')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'Completed' 
                  ? 'bg-emerald-500 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-medium animate-pulse">Loading projects...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProjects.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="col-span-full py-20 text-center bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl"
                >
                  <FolderKanban className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-slate-300">No {activeTab.toLowerCase()} projects</h3>
                  <p className="text-slate-500 mt-2">
                    {activeTab === 'Active' 
                      ? "You don't have any ongoing projects right now." 
                      : "You haven't completed any projects yet."}
                  </p>
                </motion.div>
              ) : (
                filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="relative z-10">
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="inline-block px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-300 mb-3">
                            {project.category}
                          </span>
                          <h3 className="text-xl font-bold text-white leading-tight group-hover:text-blue-200 transition-colors">
                            {project.title}
                          </h3>
                        </div>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          project.status === 'Active' 
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {project.status === 'Active' ? <Activity className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {project.status}
                        </span>
                      </div>

                      {/* Actor Info */}
                      <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden inline-block">
                          <img src={getSmartImage("projects")} alt={project.actor} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </span>
                        Contractor: <span className="text-slate-200 font-medium">{project.actor}</span>
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-8">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Progress</span>
                          <span className="text-sm font-bold text-white">{project.progress}%</span>
                        </div>
                        {role === 'actor' && project.status === 'Active' ? (
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={project.progress} 
                            onChange={(e) => {
                              const newProgress = parseInt(e.target.value);
                              setProjects(projects.map(p => p.id === project.id ? { ...p, progress: newProgress } : p));
                              if (typeof project.id === 'string') {
                                void updateProjectProgress(project.id, newProgress);
                              }
                            }}
                            className="w-full h-2 bg-slate-950 rounded-full appearance-none cursor-pointer accent-blue-500"
                          />
                        ) : (
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${project.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                              className={`h-full rounded-full relative ${
                                project.status === 'Active' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-emerald-500'
                              }`}
                            >
                              {project.status === 'Active' && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                            </motion.div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button 
                          onClick={() => navigate(`/contract/${project.id}`)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <FileSignature className="w-4 h-4" />
                          Open Contract
                        </button>
                        <button 
                          onClick={() => navigate(`/workspace/${project.id}`)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-blue-200 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {role === 'actor' ? 'Update Progress' : 'Track Progress'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
