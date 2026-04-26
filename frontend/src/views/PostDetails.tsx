import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@/lib/router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  User, 
  Bookmark,
  Share2,
  MapPin,
  Calendar,
  CheckCircle2,
  Lock,
  ShieldCheck,
  EyeOff,
  FileText
} from 'lucide-react';
import { InteractionModal } from '../components/InteractionModal';
import { initialPosts } from '../data/dummyData';
import { getProjectPost, type LiveProjectPost } from '@/lib/liveData';
import { getNovelty, matchActors, predictProjectSuccess } from '@/lib/vertexClient';

const fetchPostDetails = async (id: string) => {
  let liveMatch: LiveProjectPost | null = null;

  try {
    liveMatch = await getProjectPost(id);
  } catch (error) {
    console.warn('Unable to load live post details.', error);
  }

  if (liveMatch) {
    return {
      id: liveMatch.id,
      type: liveMatch.type,
      title: liveMatch.title,
      description: liveMatch.description,
      fullDetails: liveMatch.fullDetails,
      requireNda: liveMatch.requireNda,
      budget: liveMatch.budget,
      timeline: `${liveMatch.timeline} Days`,
      category: liveMatch.category,
      author: liveMatch.authorName,
      authorRole: 'Client',
      location: 'Global',
      postedDate: 'Live now',
      skills: liveMatch.skills,
      status: liveMatch.status,
      createdBy: liveMatch.createdBy,
    };
  }

  const seedMatch = initialPosts.find((post) => String(post.id) === id);

  if (seedMatch) {
    return {
      id: seedMatch.id,
      type: seedMatch.type,
      title: seedMatch.title,
      description: seedMatch.description,
      fullDetails: seedMatch.description,
      requireNda: true,
      budget: seedMatch.meta1Value,
      timeline: seedMatch.meta2Value,
      category: seedMatch.category,
      author: seedMatch.author,
      authorRole: seedMatch.type === 'Supplier Product' ? 'Supplier' : 'Client',
      location: 'Global',
      postedDate: seedMatch.time,
      skills: [seedMatch.category],
      status: 'Open',
    };
  }

  return {
    id: parseInt(id),
    type: 'Need Post',
    title: 'Looking for Senior IoT Engineer',
    description: 'We are looking for an experienced Senior IoT Engineer to lead the development of our next-generation smart home hub prototype.',
    fullDetails: 'The ideal candidate will have deep expertise in embedded systems, specifically with ESP32 microcontrollers, and a strong understanding of MQTT protocols for secure, low-latency communication. You will be responsible for both the firmware architecture and collaborating with our hardware team on custom PCB design.\n\nKey Responsibilities:\n- Architect and develop firmware for ESP32-based devices.\n- Implement secure MQTT communication with our cloud backend.\n- Optimize power consumption for battery-operated sensors.\n- Collaborate on PCB layout and component selection.',
    requireNda: true,
    budget: '$5,000 - $8,000',
    timeline: '2 Months',
    category: 'IoT / Hardware',
    author: 'TechCorp Inc.',
    authorRole: 'Enterprise Company',
    location: 'San Francisco, CA (Remote OK)',
    postedDate: 'Oct 24, 2023',
    skills: ['ESP32', 'C++', 'MQTT', 'PCB Design', 'FreeRTOS'],
    status: 'Open'
  };
};

type ProjectSuccessReason = {
  impact: 'positive' | 'negative' | 'neutral';
  label: string;
  detail: string;
};

type ProjectSuccessInsight = {
  probability: number;
  band: string;
  source: string;
  reasons: ProjectSuccessReason[];
};

export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [hasSignedNda, setHasSignedNda] = useState(false);
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [novelty, setNovelty] = useState<number | null>(null);
  const [topSimilarIdeas, setTopSimilarIdeas] = useState<Array<{ id: string; score: number }>>([]);
  const [matchingActors, setMatchingActors] = useState<Array<{ actorId: string; finalScore: number; sim?: number }>>([]);
  const [projectSuccess, setProjectSuccess] = useState<ProjectSuccessInsight | null>(null);
  const [mlLoading, setMlLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPostDetails(id).then(data => {
        setPost(data);
        setLoading(false);
      });
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setMlLoading(true);

    Promise.allSettled([
      getNovelty(String(id)),
      matchActors({ postId: String(id), topK: 5 }),
      predictProjectSuccess({ postId: String(id) }),
    ])
      .then(([noveltyRes, matchRes, projectSuccessRes]) => {
        if (noveltyRes.status === 'fulfilled' && typeof noveltyRes.value?.novelty === 'number') {
          setNovelty(noveltyRes.value.novelty);
          if (Array.isArray(noveltyRes.value?.topSimilar)) {
            setTopSimilarIdeas(noveltyRes.value.topSimilar.slice(0, 3));
          }
        }

        if (matchRes.status === 'fulfilled' && Array.isArray(matchRes.value?.results)) {
          setMatchingActors(matchRes.value.results);
        }

        if (projectSuccessRes.status === 'fulfilled' && typeof projectSuccessRes.value?.probability === 'number') {
          const reasons = Array.isArray(projectSuccessRes.value?.reasons)
            ? projectSuccessRes.value.reasons.slice(0, 3).map((reason: any) => ({
                impact: reason?.impact === 'positive' || reason?.impact === 'negative' ? reason.impact : 'neutral',
                label: String(reason?.label || 'Project signal'),
                detail: String(reason?.detail || ''),
              }))
            : [];

          setProjectSuccess({
            probability: projectSuccessRes.value.probability,
            band: String(projectSuccessRes.value?.band || 'Low'),
            source: String(projectSuccessRes.value?.source || 'heuristic'),
            reasons,
          });
        }
      })
      .catch((error) => {
        console.warn('Unable to load ML insights for post.', error);
      })
      .finally(() => setMlLoading(false));
  }, [id]);

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const signNda = () => {
    setHasSignedNda(true);
    setShowNdaModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] text-white">
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF6A00]/30 border-t-[#FF6A00] rounded-full animate-spin" />
          <p className="text-slate-400 font-medium tracking-wide animate-pulse">Loading securely...</p>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const projectSuccessBandClass = projectSuccess?.band === 'High'
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    : projectSuccess?.band === 'Medium'
      ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
      : 'border-rose-500/20 bg-rose-500/10 text-rose-200';

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-orange-500/30 relative overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-black z-0 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
        <button 
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Return</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header Section */}
          <div className="p-6 md:p-10 border-b border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6A00]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/20 text-[#FF6A00] text-xs font-bold tracking-wide uppercase">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2.5 py-1 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {post.status}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">{post.title}</h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Posted {post.postedDate}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {post.location}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSave}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-[#FF6A00] transition-all shadow-sm"
                  title="Save Post"
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-[#FF6A00] text-[#FF6A00]' : ''}`} />
                </button>
                <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all shadow-sm">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Body Section */}
          <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Main Content (Left) */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FF6A00]" /> Public Pitch
                </h3>
                <div className="text-slate-300 leading-relaxed font-medium text-sm md:text-base border border-white/5 bg-[#030303] p-5 rounded-2xl">
                  {post.description}
                </div>
              </section>

              {/* NDA Gate Section */}
              {post.requireNda && (
                <section>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" /> Deep Dive (Full Details)
                  </h3>

                  {!hasSignedNda ? (
                     <div className="bg-orange-500/5 border border-[#FF6A00]/20 rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden group">
                        <EyeOff className="w-12 h-12 text-[#FF6A00] mb-4 opacity-80" />
                        <h4 className="text-xl font-bold text-white mb-2">Details Locked</h4>
                        <p className="text-sm text-slate-400 font-medium mb-6 max-w-sm">This project is protected by Idea Security. You must accept the NDA to view architectural details, specs, and requirements.</p>
                        <button onClick={() => setShowNdaModal(true)} className="px-6 py-3 bg-[#FF6A00] hover:bg-orange-500 text-black font-black uppercase tracking-wide rounded-xl shadow-[0_0_20px_rgba(255,106,0,0.3)] transition-all flex items-center gap-2">
                           <Lock className="w-4 h-4" /> Sign NDA to Unlock
                        </button>
                     </div>
                  ) : (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base border border-emerald-500/30 bg-emerald-500/5 p-5 rounded-2xl relative">
                        <div className="absolute top-3 right-4">
                           <span className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1 border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> NDA Signed</span>
                        </div>
                        <div className="pt-2">
                          {post.fullDetails || "No further details available."}
                        </div>
                     </motion.div>
                  )}
                </section>
              )}

              {(!post.requireNda && post.fullDetails) && (
                <section>
                  <h3 className="text-lg font-bold text-white mb-4">Deep Dive</h3>
                  <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base border border-white/5 bg-[#030303] p-5 rounded-2xl">
                    {post.fullDetails}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-lg font-bold text-white mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {post.skills.map((skill: string, i: number) => (
                    <span key={i} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar (Right) */}
            <div className="space-y-6">
              {/* Key Details Card */}
              <div className="bg-[#030303] border border-white/10 rounded-2xl p-6 space-y-6 shadow-inner">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Budget Setup</p>
                  <p className="text-xl font-black text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#FF6A00]" />
                    {post.budget}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Timeline</p>
                  <p className="text-xl font-black text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#FF6A00]" />
                    {post.timeline}
                  </p>
                </div>
                
                <button 
                  onClick={() => setOfferModalOpen(true)}
                  className="w-full py-4 rounded-xl bg-[#FF6A00] hover:bg-orange-500 text-black font-black uppercase tracking-wide shadow-[0_0_20px_rgba(255,106,0,0.3)] transition-all active:scale-[0.98]"
                >
                  Send Offer
                </button>
              </div>

              <div className="bg-[#030303] border border-white/10 rounded-2xl p-6 shadow-inner">
                <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">Project Success Prediction</h3>
                {mlLoading ? (
                  <p className="text-sm text-slate-400">Estimating delivery success...</p>
                ) : projectSuccess === null ? (
                  <p className="text-sm text-slate-400">No project-success prediction yet. It appears once the ML service can evaluate this post.</p>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-2xl font-black text-white">{(projectSuccess.probability * 100).toFixed(1)}%</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">Predicted chance this project reaches a strong completion outcome.</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${projectSuccessBandClass}`}>
                        {projectSuccess.band}
                      </span>
                    </div>

                    {projectSuccess.reasons.length > 0 && (
                      <div className="space-y-2">
                        {projectSuccess.reasons.map((reason, index) => (
                          <div key={`${reason.label}-${index}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <p className={`text-xs font-bold ${
                              reason.impact === 'positive'
                                ? 'text-emerald-300'
                                : reason.impact === 'negative'
                                  ? 'text-rose-300'
                                  : 'text-slate-300'
                            }`}>
                              {reason.label}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{reason.detail}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold mt-4">
                      Model Source: {projectSuccess.source === 'vertex' ? 'Vertex Endpoint' : 'Heuristic Fallback'}
                    </p>
                  </>
                )}
              </div>

              <div className="bg-[#030303] border border-white/10 rounded-2xl p-6 shadow-inner">
                <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">Idea Similarity + Novelty</h3>
                {mlLoading ? (
                  <p className="text-sm text-slate-400">Computing ML score...</p>
                ) : novelty === null ? (
                  <p className="text-sm text-slate-400">No novelty score yet. It appears after embedding sync.</p>
                ) : (
                  <>
                    <p className="text-2xl font-black text-white mb-2">Novelty: {(novelty * 100).toFixed(1)}%</p>
                    <p className="text-xs text-slate-400 font-medium">Higher means your idea is more distinct from existing projects.</p>
                    {topSimilarIdeas.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">Most Similar Existing Ideas</p>
                        {topSimilarIdeas.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                            <p className="text-xs text-slate-300 font-semibold">{item.id}</p>
                            <p className="text-xs text-orange-300 font-bold">{(Number(item.score) * 100).toFixed(1)}%</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-[#030303] border border-white/10 rounded-2xl p-6 shadow-inner">
                <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">Smart Actor Matching</h3>
                {mlLoading ? (
                  <p className="text-sm text-slate-400">Ranking actors...</p>
                ) : matchingActors.length === 0 ? (
                  <p className="text-sm text-slate-400">No actor rankings yet. Ask actors to complete profile for better matches.</p>
                ) : (
                  <div className="space-y-2">
                    {matchingActors.map((actor, idx) => (
                      <div key={actor.actorId} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                        <div>
                          <p className="text-sm text-white font-semibold">#{idx + 1} {actor.actorId}</p>
                          <p className="text-[11px] text-slate-400">Similarity {(Number(actor.sim || 0) * 100).toFixed(1)}%</p>
                        </div>
                        <p className="text-sm text-emerald-400 font-bold">Score {(Number(actor.finalScore || 0) * 100).toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Author Card & Trust Score Integration */}
              <div className="bg-[#030303] border border-white/10 rounded-2xl p-6 shadow-inner">
                <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">About the Client</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                    <User className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{post.author}</p>
                    <p className="text-xs font-semibold text-slate-400">{post.authorRole}</p>
                  </div>
                </div>
                
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mb-4 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                     <ShieldCheck className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-0.5">Trust Score: 98/100</p>
                     <p className="text-[10px] text-emerald-400/80 font-medium">Verified Payment History</p>
                   </div>
                </div>

                <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-colors">
                  View Full Profile
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>

      {/* NDA Modal */}
      <AnimatePresence>
        {showNdaModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0a0a0a] border border-[#FF6A00]/30 p-8 rounded-3xl shadow-2xl relative"
            >
              <div className="w-16 h-16 rounded-full bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00] mb-6 mx-auto border border-[#FF6A00]/20">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white text-center mb-4">Non-Disclosure Agreement</h2>
              <div className="bg-[#030303] border border-white/10 p-5 rounded-2xl mb-6 shadow-inner">
                <p className="text-slate-300 font-medium text-sm leading-relaxed text-center">
                  "I will not reuse, copy, or distribute this idea, its specifications, or related materials without explicit permission from the creator."
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowNdaModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">
                  Decline
                </button>
                <button onClick={signNda} className="flex-1 py-3 bg-[#FF6A00] hover:bg-orange-500 text-black font-black rounded-xl shadow-[0_0_15px_rgba(255,106,0,0.3)] transition-all">
                  I Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interaction Modal */}
      <InteractionModal 
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        mode="actor"
        contextData={post}
      />
    </div>
  );
}
