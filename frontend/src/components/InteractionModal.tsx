import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Briefcase, Upload, Paperclip, Sparkles, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createOffer } from '@/lib/liveData';
import { detectFraud, generateProposalCopilot } from '@/lib/vertexClient';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'actor' | 'supplier'; // 'actor' = Send Offer / Hire Me, 'supplier' = Suggest Component
  contextData?: any; // e.g. post title, author, or demand request info
}

type FormState = {
  title: string;
  amount: string;
  timeline: string;
  quantity: string;
  deliveryMode: string;
  message: string;
  workPlan: string;
  notes: string;
};

const EMPTY_FORM_STATE: FormState = {
  title: '',
  amount: '',
  timeline: '',
  quantity: '',
  deliveryMode: '',
  message: '',
  workPlan: '',
  notes: '',
};

function normalizeSkillList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function toAccountAgeDays(value: unknown) {
  if (!value || typeof value !== 'object') {
    return 0;
  }

  const seconds = Number((value as { seconds?: unknown }).seconds ?? 0);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - seconds * 1000) / (1000 * 60 * 60 * 24)));
}

function bandClasses(band: string) {
  if (band === 'High') {
    return 'border-red-500/40 bg-red-500/10 text-red-300';
  }
  if (band === 'Medium') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  }
  return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
}

export const InteractionModal: React.FC<InteractionModalProps> = ({ isOpen, onClose, mode, contextData }) => {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM_STATE);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotMeta, setCopilotMeta] = useState('');
  const [isFraudLoading, setIsFraudLoading] = useState(false);
  const [fraudResult, setFraudResult] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError('');
    setCopilotMeta('');
    setFraudResult(null);
    setForm({
      ...EMPTY_FORM_STATE,
      title: String(contextData?.component || contextData?.title || ''),
    });
  }, [contextData, isOpen, mode]);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const runCopilot = async () => {
    if (mode !== 'actor') {
      return;
    }

    setError('');
    setIsCopilotLoading(true);

    try {
      const profileDetails = (profile?.profileDetails as Record<string, unknown> | undefined) || {};
      const actorSkills = normalizeSkillList((profile as any)?.skills ?? profileDetails.skills);

      const response = await generateProposalCopilot({
        project: {
          title: String(contextData?.title || ''),
          description: String(contextData?.description || ''),
          fullDetails: String(contextData?.fullDetails || ''),
          category: String(contextData?.category || ''),
          budget: String(contextData?.budget || contextData?.meta1Value || ''),
          timeline: String(contextData?.timeline || contextData?.meta2Value || ''),
          skills: normalizeSkillList(contextData?.skills),
        },
        actor: {
          name: String(profile?.displayName || user?.displayName || user?.email || ''),
          skills: actorSkills,
          experienceYears: (profile as any)?.experienceYears ?? profileDetails.experienceYears ?? profileDetails.yearsExperience,
        },
        preferences: {
          amount: form.amount,
          timeline: form.timeline,
          tone: 'professional',
        },
      });

      if (response?.error) {
        throw new Error(String(response.error));
      }

      const draft = response?.draft || {};

      setForm((prev) => ({
        ...prev,
        title: String(draft?.title || prev.title || contextData?.title || ''),
        message: String(draft?.message || prev.message || ''),
        workPlan: String(draft?.workPlan || prev.workPlan || ''),
        notes: String(draft?.notes || prev.notes || ''),
      }));

      const source = String(response?.source || 'template');
      const modelSuffix = response?.modelUsed ? ` (${String(response.modelUsed)})` : '';
      setCopilotMeta(`Draft source: ${source}${modelSuffix}`);

      if (response?.fraudCheck?.band === 'High') {
        setError('Copilot draft returned a high-risk flag. Review and edit before submitting.');
      }
    } catch (copilotError) {
      const message = copilotError instanceof Error ? copilotError.message : 'Unable to generate proposal draft right now.';
      setError(message);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const runFraudDetection = async () => {
    setError('');
    setIsFraudLoading(true);

    try {
      const profileDetails = (profile?.profileDetails as Record<string, unknown> | undefined) || {};
      const actorSkills = normalizeSkillList((profile as any)?.skills ?? profileDetails.skills);
      const actorBio = String((profile as any)?.bio ?? (profile as any)?.summary ?? profileDetails.bio ?? '');
      const textBlob = `${form.message}\n${form.workPlan}\n${form.notes}`.toLowerCase();
      const offPlatformSignal = /(whatsapp|telegram|signal|gmail|@\w+\.com|outside platform|off-platform)/.test(textBlob) ? 1 : 0;
      const riskyPaymentSignal = /(crypto|gift card|wire transfer|upfront payment|advance payment)/.test(textBlob) ? 1 : 0;

      const response = await detectFraud({
        expert: {
          displayName: profile?.displayName || user?.displayName,
          bio: actorBio,
          skills: actorSkills,
          yearsExperience: (profile as any)?.experienceYears ?? profileDetails.experienceYears ?? profileDetails.yearsExperience,
          rating: (profile as any)?.rating ?? profileDetails.rating,
          reviewsCount: (profile as any)?.reviewsCount ?? profileDetails.reviewsCount,
          completedProjects: (profile as any)?.completedProjects ?? profileDetails.completedProjects,
          accountAgeDays: toAccountAgeDays(profile?.createdAt),
          portfolioUrl: (profile as any)?.portfolioUrl ?? profileDetails.portfolioUrl,
        },
        review: {
          text: form.notes,
          rating: (profile as any)?.rating ?? profileDetails.rating,
          verified: true,
        },
        proposal: {
          title: form.title,
          message: form.message,
          workPlan: form.workPlan,
          amount: form.amount,
          timeline: form.timeline,
          projectBudget: contextData?.budget || contextData?.meta1Value,
          projectTimeline: contextData?.timeline || contextData?.meta2Value,
        },
        behavior: {
          accountAgeDays: toAccountAgeDays(profile?.createdAt),
          offPlatformPaymentMentions: riskyPaymentSignal,
          externalContactAttempts: offPlatformSignal,
          failedPayments: 0,
          chargebacks: 0,
          disputes: 0,
        },
      });

      if (response?.error) {
        throw new Error(String(response.error));
      }

      setFraudResult(response);
    } catch (fraudError) {
      const message = fraudError instanceof Error ? fraudError.message : 'Unable to run fraud detection right now.';
      setError(message);
      setFraudResult(null);
    } finally {
      setIsFraudLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in before submitting.');
      return;
    }

    if (!form.title.trim() || !form.amount.trim() || !form.timeline.trim() || !form.message.trim()) {
      setError('Please fill all required fields before submitting.');
      return;
    }

    if (mode === 'actor' && !form.workPlan.trim()) {
      setError('Please add a work plan for actor proposals.');
      return;
    }

    if (mode === 'supplier' && (!form.quantity.trim() || !form.deliveryMode.trim())) {
      setError('Please add quantity and delivery mode for supplier suggestions.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createOffer(
        {
          mode,
          contextId: contextData?.id ? String(contextData.id) : undefined,
          contextTitle: String(contextData?.title || contextData?.component || 'Direct request'),
          contextOwnerId: contextData?.createdBy ? String(contextData.createdBy) : undefined,
          title: form.title,
          amount: form.amount,
          timeline: form.timeline,
          quantity: form.quantity,
          deliveryMode: form.deliveryMode,
          message: form.message,
          workPlan: form.workPlan,
          notes: form.notes,
        },
        user,
        profile,
      );

      setForm(EMPTY_FORM_STATE);
      setFraudResult(null);
      setCopilotMeta('');
      setIsSubmitting(false);
      onClose();
    } catch {
      setError('Unable to submit right now. Please check Firebase rules and try again.');
      setIsSubmitting(false);
    }
  };

  const getHeaderTitle = () => {
    if (mode === 'actor') {
      return contextData && contextData.type === 'Actor Showcase' ? 'Hire Me' : 'Send Offer';
    }
    return 'Suggest Component';
  };

  const fraudReasons = fraudResult?.reasons
    ? (Object.values(fraudResult.reasons) as unknown[])
        .flatMap((value) => (Array.isArray(value) ? value : []))
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl max-h-full bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50 shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" /> 
                {getHeaderTitle()}
              </h3>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 scrollbar-hide flex-1 custom-scrollbar">
              {contextData && (
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-bold text-blue-300 mb-1">
                    {mode === 'actor' ? 'Replying to:' : 'Replying to demand:'}
                  </h4>
                  <p className="text-white font-medium">{contextData.title || contextData.component}</p>
                  {(contextData.budget || contextData.qty || contextData.meta1Value) && (
                    <p className="text-sm text-slate-400 mt-1">
                      {contextData.qty ? `Requesting ${contextData.qty} units | ` : ''}
                      Budget/Rate: {contextData.budget || contextData.meta1Value}
                    </p>
                  )}
                  {contextData.author && (
                    <p className="text-sm text-slate-400 mt-1">By {contextData.author}</p>
                  )}
                </div>
              )}

              <form id="interaction-form" onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
                
                {/* 1. KEY DETAILS */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Key Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Common / Conditional Title Field */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-slate-300">
                        {mode === 'supplier' ? 'Product Name' : 'Title'} <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="text" 
                        name="title"
                        required
                        value={form.title}
                        onChange={(event) => setField('title', event.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                        placeholder={mode === 'supplier' ? 'Enter product name...' : 'Summary of your offer...'}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300">
                        {mode === 'supplier' ? 'Price / Total Amount ($)' : 'Total Amount ($)'} <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="number" 
                        name="amount"
                        required
                        value={form.amount}
                        onChange={(event) => setField('amount', event.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                        placeholder="e.g. 5000"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300">
                        {mode === 'supplier' ? 'Delivery Date' : 'Timeline / Delivery Date'} <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="text" 
                        name="timeline"
                        required
                        value={form.timeline}
                        onChange={(event) => setField('timeline', event.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                        placeholder="e.g. 2 Weeks or Specific Date"
                      />
                    </div>

                    {mode === 'supplier' && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-300">Quantity <span className="text-red-400">*</span></label>
                          <input 
                            type="number" 
                            name="quantity"
                            required
                            value={form.quantity}
                            onChange={(event) => setField('quantity', event.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                            placeholder="e.g. 100"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-300">Delivery Mode <span className="text-red-400">*</span></label>
                          <select 
                            name="deliveryMode"
                            required
                            value={form.deliveryMode}
                            onChange={(event) => setField('deliveryMode', event.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                          >
                            <option value="">Select Mode...</option>
                            <option value="online">Online / Digital</option>
                            <option value="offline">Offline / Physical Shipping</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. DESCRIPTION & MESSAGE */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Description & Details
                  </h4>

                  {mode === 'actor' && (
                    <div className="space-y-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={runCopilot}
                          disabled={isCopilotLoading || isSubmitting}
                          className="px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-600/15 text-blue-300 text-xs font-semibold uppercase tracking-wide hover:bg-blue-600/25 transition-colors disabled:opacity-60"
                        >
                          {isCopilotLoading ? 'Generating...' : 'Proposal Copilot'}
                        </button>
                        <button
                          type="button"
                          onClick={runFraudDetection}
                          disabled={isFraudLoading || isSubmitting}
                          className="px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-600/15 text-amber-300 text-xs font-semibold uppercase tracking-wide hover:bg-amber-600/25 transition-colors disabled:opacity-60"
                        >
                          {isFraudLoading ? 'Scanning...' : 'Detect Fraud'}
                        </button>
                      </div>

                      {copilotMeta && (
                        <p className="text-xs text-slate-300 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                          {copilotMeta}
                        </p>
                      )}

                      {fraudResult && (
                        <div className={`rounded-lg border p-3 ${bandClasses(String(fraudResult?.band || 'Low'))}`}>
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="text-sm font-semibold flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4" />
                              Fraud Risk: {String(fraudResult?.band || 'Low')}
                            </p>
                            <span className="text-xs font-medium">
                              {Math.round(Number(fraudResult?.overallRisk || 0) * 100)}%
                            </span>
                          </div>

                          {fraudReasons.length > 0 && (
                            <ul className="text-xs space-y-1 text-slate-200/90">
                              {fraudReasons.map((reason, index) => (
                                <li key={`${reason}-${index}`}>• {String(reason)}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">
                      {mode === 'actor' ? 'Proposal Message & Description' : 'Product Description'} <span className="text-red-400">*</span>
                    </label>
                    <textarea 
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(event) => setField('message', event.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600 resize-none"
                      placeholder={mode === 'actor' ? "Explain why you're a great fit, what you bring to the table..." : "Describe the component capabilities, materials used, specific technical specs..."}
                    />
                  </div>
                  
                  {mode === 'actor' && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300">Work Plan / Approach <span className="text-red-400">*</span></label>
                      <textarea 
                        name="workPlan"
                        required
                        rows={4}
                        value={form.workPlan}
                        onChange={(event) => setField('workPlan', event.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600 resize-none"
                        placeholder="Detail your step-by-step approach to complete this project..."
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Additional Notes</label>
                    <textarea 
                      name="notes"
                      rows={3}
                      value={form.notes}
                      onChange={(event) => setField('notes', event.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600 resize-none"
                      placeholder="Any constraints, extra terms, links, etc."
                    />
                  </div>
                </div>

                {/* 3. UPLOAD */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                  </h4>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Attach File (Optional)</label>
                    <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-950/30 transition-colors cursor-pointer group">
                      <Upload className="w-6 h-6 text-slate-500 group-hover:text-blue-400 mb-2 transition-colors" />
                      <p className="text-sm text-slate-300 font-medium">Click to attach files</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, DOC, ZIP up to 50MB</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-white/10 mt-6">
                  <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-6 py-3 rounded-xl text-slate-300 hover:bg-slate-800 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || isCopilotLoading || isFraudLoading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70 min-w-[150px] flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
