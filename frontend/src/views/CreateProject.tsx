import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { createProjectPost } from '@/lib/liveData';
import { analyzeProjectML, saveEmbeddingForPost } from '@/lib/vertexClient';
import { saveProjectAIAnalysis } from '@/services/firestore';
import { 
  FileText, 
  AlignLeft, 
  Tag, 
  DollarSign, 
  Clock, 
  Wrench, 
  ShieldCheck, 
  X, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  Eye,
  FileBadge,
  Upload
} from 'lucide-react';

export default function CreateProject() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  // Form State
  const [title, setTitle] = useState('');
  const [basicDescription, setBasicDescription] = useState(''); // Public Layer
  const [fullDetails, setFullDetails] = useState(''); // Locked Layer
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [whoNeeded, setWhoNeeded] = useState('');
  
  // Skills State
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');
  
  // Protection State
  const [requireNda, setRequireNda] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  // UI State
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState('');
  const [projectInsights, setProjectInsights] = useState<{
    innovationScore?: number;
    successProbability?: number;
    fraudRisk?: number;
    pricingEstimate?: { min?: number; recommended?: number; max?: number; currency?: string };
    recommendedActors?: Array<{ name?: string; score?: number }>;
  } | null>(null);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
    if (('key' in e && e.key === 'Enter') || e.type === 'click') {
      e.preventDefault();
      if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
        setSkills([...skills, currentSkill.trim()]);
        setCurrentSkill('');
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleFileUpload = () => {
    // Mock watermarking & storage process
    setUploadedFiles([...uploadedFiles, `secure_file_${Date.now()}.pdf`]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim() || !basicDescription.trim() || !fullDetails.trim() || !category || !budget || !timeline || !whoNeeded || skills.length === 0) {
      setError('Please fill in all required fields and add at least one skill.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("STEP 1: START");
      if (!user) {
        setError('Please sign in before creating a project.');
        setIsSubmitting(false);
        return;
      }

      let aiData: any = null;
      let ai2Data: any = null;

      try {
        const aiPayload = {
          ideaText: fullDetails || basicDescription,
          actorAccepted: !requireNda,
          cancellations: 1,
          disputes: 0,
          completion_rate: 0.8,
          message_repeat: 0,
          existingIdeas: [],
        };

        const aiRes = await fetch("http://localhost:3001/api/ai/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(aiPayload),
        });

        if (aiRes.ok) {
          aiData = await aiRes.json();
          console.log("STEP 2: AI1 DONE", aiData);
          console.log("STEP 2: AI1 DONE");
        } else {
          console.warn("AI1 failed", { status: aiRes.status });
        }
      } catch (e) {
        console.warn("AI1 failed", e);
      }

      if (aiData?.nda?.requiresNDA) {
        setRequireNda(true);
      }

      try {
        const ai2Res = await fetch("http://localhost:3002/api/ai2/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ideaText: fullDetails,
            budget,
            timeline,
            skills,
          }),
        });

        if (ai2Res.ok) {
          ai2Data = await ai2Res.json();
          console.log("STEP 3: AI2 DONE", ai2Data);
          console.log("STEP 3: AI2 DONE");
        } else {
          console.warn("AI2 failed", { status: ai2Res.status });
        }
      } catch (e) {
        console.warn("AI2 failed", e);
      }

      console.log("STEP 4: BEFORE CREATE PROJECT");

      const projectId = await createProjectPost(
        {
          title,
          description: basicDescription,
          fullDetails,
          category,
          budget,
          timeline,
          whoNeeded,
          skills,
          requireNda,
          files: uploadedFiles,
          ...(aiData?.nda || ai2Data?.risk || ai2Data?.progress
            ? {
                aiAnalysis: {
                  risk: ai2Data?.risk ?? null,
                  progress: ai2Data?.progress ?? null,
                  nda: aiData?.nda ?? null,
                },
              }
            : {}),
        },
        user,
        profile,
      );
      console.log("STEP 5: PROJECT CREATED", projectId);
      console.log("STEP 5: PROJECT CREATED");

      const embeddingText = [
        title,
        basicDescription,
        fullDetails,
        `Category: ${category}`,
        `Budget: ${budget}`,
        `Timeline: ${timeline}`,
        `Who needed: ${whoNeeded}`,
        `Skills: ${skills.join(', ')}`,
      ].join('\n');

      void saveEmbeddingForPost(projectId, embeddingText, {
        source: 'projectPosts',
        category,
        createdBy: user.uid,
      }).catch((embeddingError) => {
        console.warn('Project created but embedding sync failed.', embeddingError);
      });

      setShowSuccess(true);
      setCreatedProjectId(projectId);
      setInsightsLoading(true);
      setInsightsError('');

      const analysis = await analyzeProjectML({
        projectId,
        title,
        ideaTitle: title,
        ideaText: `${basicDescription}\n${fullDetails}`,
        description: basicDescription,
        fullDetails,
        category,
        skills,
        budget,
        timeline,
        teamSize: whoNeeded === 'Team' ? 4 : 2,
        complexity: Math.min(10, Math.max(3, skills.length + (fullDetails.length > 450 ? 2 : 0))),
        searchQuery: title,
      });

      if (!analysis?.error) {
        void saveProjectAIAnalysis(projectId, analysis).catch((saveError) => {
          console.warn('ML analysis generated but ai_analysis sync failed.', saveError);
        });
        setProjectInsights(analysis);
        setShowInsightsModal(true);
        setTimeout(() => {
          navigate(`/post/${projectId}`);
        }, 9000);
      } else {
        setInsightsError(String(analysis.error));
        setTimeout(() => {
          navigate(`/post/${projectId}`);
        }, 2200);
      }

      setInsightsLoading(false);
      setIsSubmitting(false);

    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.toLowerCase().includes('permission')) {
        setError('Failed to create project due to permissions. Please sign in again and retry.');
      } else {
        setError('Failed to create project. Please try again.');
      }
      console.error('Create project failed:', err);
      setInsightsLoading(false);
      setIsSubmitting(false);
    }
  };

  const formatPercent = (value?: number) => `${Math.round((Number(value || 0) * 100))}%`;

  return (
    <div className="min-h-screen w-full flex bg-[#050505] font-sans selection:bg-orange-500/30 relative overflow-y-auto custom-scrollbar">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-black z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        <div className="w-full mb-6">
          <button 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group w-fit"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Return Home</span>
          </button>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Create Look-In</h1>
          <p className="text-slate-400 text-lg font-medium">Post your requirements and secure your idea.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full"
        >
          <div className="backdrop-blur-2xl bg-[#0a0a0a]/80 border border-white/5 p-8 sm:p-10 rounded-[2rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF6A00]/50 to-transparent" />
            
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="relative z-10 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}

              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  className="relative z-10 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p>Ownership secured & Look-In posted! Redirecting to home...</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
              
              {/* IDEA VISIBILITY (2 LAYERS) */}
              <section>
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 border-b border-white/10 pb-2">
                  <span className="bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/20 w-7 h-7 rounded-full flex items-center justify-center text-xs">1</span>
                  Controlled Idea Visibility
                </h3>
                
                <div className="space-y-6">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Project Title</label>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-[#FF6A00]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 shadow-inner" 
                        placeholder="e.g. Smart Home Hub Prototype" 
                      />
                    </div>
                  </div>

                  {/* Public Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1 mb-1">
                      <label className="text-sm font-semibold text-slate-300">Basic Description</label>
                      <span className="text-xs font-semibold text-[#FF6A00] flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Visible to all</span>
                    </div>
                    <textarea 
                      rows={2} 
                      value={basicDescription}
                      onChange={(e) => setBasicDescription(e.target.value)}
                      className="w-full bg-[#030303] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 resize-none shadow-inner" 
                      placeholder="Brief, high-level summary of the requirement..."
                    />
                  </div>

                  {/* Locked Details */}
                  <div className="space-y-1.5 bg-orange-500/5 border border-orange-500/10 p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-bold text-[#FF6A00] flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Full Details (Locked)
                      </label>
                    </div>
                    <textarea 
                      rows={5} 
                      value={fullDetails}
                      onChange={(e) => setFullDetails(e.target.value)}
                      className="w-full bg-[#030303] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 resize-none shadow-inner" 
                      placeholder="In-depth specifications, architecture ideas, core logic... This remains HIDDEN until NDA is signed."
                    />
                  </div>
                </div>
              </section>

              {/* NDA & PROTECTION SETTING */}
              <section>
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 border-b border-white/10 pb-2">
                  <span className="bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/20 w-7 h-7 rounded-full flex items-center justify-center text-xs">2</span>
                  Idea Protection & Security
                </h3>
                
                <div className="space-y-5">
                  <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/10 hover:border-[#FF6A00]/50 transition-colors bg-[#030303] shadow-inner cursor-pointer" onClick={() => setRequireNda(!requireNda)}>
                    <div className="relative mt-1">
                      <input type="checkbox" checked={requireNda} onChange={() => {}} className="peer sr-only" />
                      <div className="w-6 h-6 border-2 border-slate-600 rounded bg-transparent peer-checked:bg-[#FF6A00] peer-checked:border-[#FF6A00] transition-all flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-black opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1 flex items-center gap-2">
                        Enable Strict NDA Gate <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
                      </h4>
                      <p className="text-sm text-slate-400 font-medium">Actors must explicitly accept "<span className="text-slate-300 italic">I will not reuse, copy, or distribute this idea without permission</span>" before unlocking Full Details.</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-white/10 bg-[#030303] shadow-inner">
                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                      <FileBadge className="w-4 h-4 text-[#FF6A00]" /> Watermarked Uploads
                    </h4>
                    <p className="text-sm text-slate-400 font-medium mb-4">Any uploaded files are automatically watermarked with your User ID and timestamp for irrefutable proof of ownership.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button type="button" onClick={handleFileUpload} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-medium text-sm flex items-center justify-center gap-2 transition-colors">
                        <Upload className="w-4 h-4" /> Upload Concept Drafts
                      </button>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {uploadedFiles.map((file, i) => (
                           <span key={i} className="text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5">
                             <CheckCircle2 className="w-3 h-3" /> {file} (Timestamped)
                           </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* LOGISTICS & SKILLS */}
              <section>
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 border-b border-white/10 pb-2">
                  <span className="bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/20 w-7 h-7 rounded-full flex items-center justify-center text-xs">3</span>
                  Logistics & Talent
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Category</label>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-[#FF6A00]">
                        <Tag className="w-5 h-5" />
                      </div>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] hover:border-white/20 transition-all [&>option]:bg-slate-900 shadow-inner"
                      >
                        <option value="">Select Category</option>
                        <option value="IoT">IoT / Hardware</option>
                        <option value="AI">AI / Machine Learning</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Web">Web Development</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Budget Setup ($)</label>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-[#FF6A00]">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <input 
                        type="text" 
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 shadow-inner" 
                        placeholder="e.g. 5000" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Timeline (Days)</label>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-[#FF6A00]">
                        <Clock className="w-5 h-5" />
                      </div>
                      <input 
                        type="number" 
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 shadow-inner" 
                        placeholder="e.g. 60" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Who Needed</label>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-[#FF6A00]">
                        <AlignLeft className="w-5 h-5" />
                      </div>
                      <select 
                        value={whoNeeded}
                        onChange={(e) => setWhoNeeded(e.target.value)}
                        className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] hover:border-white/20 transition-all [&>option]:bg-slate-900 shadow-inner"
                      >
                        <option value="">Select Target Actor</option>
                        <option value="Engineer">Engineer</option>
                        <option value="Team">Team</option>
                        <option value="Supplier">Supplier</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-5">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Skills Required</label>
                  <div className="relative group flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#FF6A00]">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <input 
                        type="text" 
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyDown={handleAddSkill}
                        className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 shadow-inner" 
                        placeholder="Type a skill and press Enter..." 
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleAddSkill}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Skills Tags */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <AnimatePresence>
                        {skills.map((skill) => (
                          <motion.div
                            key={skill}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6A00]/10 border border-[#FF6A00]/20 rounded-lg text-orange-400 text-sm font-medium"
                          >
                            <span>{skill}</span>
                            <button type="button" onClick={() => removeSkill(skill)} className="text-[#FF6A00] hover:text-orange-300">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </section>

              {/* Submit Button */}
              <div className="pt-6 border-t border-white/10">
                <button 
                  type="submit"
                  disabled={isSubmitting || showSuccess}
                  className="w-full bg-gradient-to-r from-[#FF6A00] to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black tracking-wide rounded-xl py-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,106,0,0.3)] hover:shadow-[0_0_30px_rgba(255,106,0,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Secure & Post Look-In</span>
                      <ShieldCheck className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-slate-500 font-medium mt-4">
                  By posting, an irrefutable timestamp and ownership certificate will be logged to your account.
                </p>
              </div>

            </form>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showInsightsModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#090909] p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-black text-white">ML Insights</h3>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  Project Intelligence Ready
                </span>
              </div>

              {insightsLoading ? (
                <div className="py-10 text-center text-sm text-slate-300">Analyzing project signals...</div>
              ) : (
                <div className="space-y-4">
                  {insightsError ? (
                    <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
                      Analysis fallback: {insightsError}
                    </p>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs text-slate-400">Innovation Score</p>
                      <p className="text-2xl font-bold text-cyan-300">{formatPercent(projectInsights?.innovationScore)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs text-slate-400">Success Probability</p>
                      <p className="text-2xl font-bold text-emerald-300">{formatPercent(projectInsights?.successProbability)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs text-slate-400">Fraud Risk</p>
                      <p className="text-2xl font-bold text-rose-300">{formatPercent(projectInsights?.fraudRisk)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs text-slate-400">Pricing Estimate</p>
                      <p className="text-lg font-bold text-orange-300">
                        {projectInsights?.pricingEstimate?.currency || 'USD'} {projectInsights?.pricingEstimate?.min ?? 0} - {projectInsights?.pricingEstimate?.max ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="mb-2 text-xs text-slate-400">Recommended Actors</p>
                    <div className="flex flex-wrap gap-2">
                      {(projectInsights?.recommendedActors || []).slice(0, 4).map((actor, idx) => (
                        <span key={`${actor.name || 'actor'}-${idx}`} className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-200">
                          {actor.name || 'Actor'} ({formatPercent(actor.score)})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/project-intelligence')}
                  className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-900 hover:bg-cyan-300"
                >
                  Open Full Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/post/${createdProjectId}`)}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  Continue to Project <ArrowRight className="ml-1 inline h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
