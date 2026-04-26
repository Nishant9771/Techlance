import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Clock, Calendar, Briefcase, Upload, Paperclip } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createOffer } from '@/lib/liveData';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'actor' | 'supplier'; // 'actor' = Send Offer / Hire Me, 'supplier' = Suggest Component
  contextData?: any; // e.g. post title, author, or demand request info
}

export const InteractionModal: React.FC<InteractionModalProps> = ({ isOpen, onClose, mode, contextData }) => {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      await createOffer(
        {
          mode,
          contextId: contextData?.id ? String(contextData.id) : undefined,
          contextTitle: String(contextData?.title || contextData?.component || 'Direct request'),
          contextOwnerId: contextData?.createdBy ? String(contextData.createdBy) : undefined,
          title: String(formData.get('title') ?? ''),
          amount: String(formData.get('amount') ?? ''),
          timeline: String(formData.get('timeline') ?? ''),
          quantity: String(formData.get('quantity') ?? ''),
          deliveryMode: String(formData.get('deliveryMode') ?? ''),
          message: String(formData.get('message') ?? ''),
          workPlan: String(formData.get('workPlan') ?? ''),
          notes: String(formData.get('notes') ?? ''),
        },
        user,
        profile,
      );

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
                        className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                        placeholder={mode === 'supplier' ? 'Enter product name...' : 'Summary of your offer...'}
                        defaultValue={contextData?.component || ''}
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
                            className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                            placeholder="e.g. 100"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-300">Delivery Mode <span className="text-red-400">*</span></label>
                          <select 
                            name="deliveryMode"
                            required
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
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">
                      {mode === 'actor' ? 'Proposal Message & Description' : 'Product Description'} <span className="text-red-400">*</span>
                    </label>
                    <textarea 
                      name="message"
                      required
                      rows={5}
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
                    disabled={isSubmitting}
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
