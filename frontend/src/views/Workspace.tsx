import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from '@/lib/router';
import { motion, AnimatePresence } from 'motion/react';
import { getSmartImage } from '@/utils/assetManager';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  CreditCard, 
  Upload, 
  FileText, 
  Send, 
  Paperclip,
  Clock,
  DollarSign,
  User,
  ShieldCheck,
  MoreVertical,
  Download,
  AlertTriangle,
  Receipt,
  FileBadge
} from 'lucide-react';

const mockProject = {
  title: 'Smart Home Hub Prototype',
  actorName: 'Elena Rodriguez',
  actorAvatar: 'https://picsum.photos/seed/elena/100/100',
  budget: '₹50,000',
  timeline: '6 Weeks',
  progress: 45
};

const initialMessages = [
  { id: 1, sender: 'Elena Rodriguez', isSelf: false, text: 'Hi! I have reviewed the NDA and the deep dive specs. Looks great.', time: '10:30 AM' },
  { id: 2, sender: 'You', isSelf: true, text: 'Awesome. Have you accepted the payment declaration?', time: '10:45 AM' },
];

type JobStatus = 'Requested' | 'Accepted' | 'Payment_Initiated' | 'Work_In_Progress' | 'Completed' | 'Disputed';

export default function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState<{id:number, name:string, size:string, date:string, isWatermarked:boolean}[]>([]);
  
  // Job & Trust State
  const [jobStatus, setJobStatus] = useState<JobStatus>('Accepted');
  const [declarationSigned, setDeclarationSigned] = useState(false);
  const [paymentProof, setPaymentProof] = useState<{screenshot: string, upiId: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempUpi, setTempUpi] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Simulate irreversible chat log
    const msg = {
      id: Date.now(),
      sender: 'You',
      isSelf: true,
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  const handleFileUpload = () => {
    const newFile = {
      id: Date.now(),
      name: `secured_spec_${Math.floor(Math.random() * 1000)}.pdf`,
      size: '2.1 MB',
      date: 'Just now',
      isWatermarked: true
    };
    setFiles([newFile, ...files]);
  };

  const handleSignDeclaration = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setDeclarationSigned(true);
      setJobStatus('Payment_Initiated');
      setIsProcessing(false);
    }, 1000);
  };

  const handleUploadPaymentProof = () => {
    if(!tempUpi.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setPaymentProof({ screenshot: 'receipt_upload.png', upiId: tempUpi });
      setJobStatus('Work_In_Progress');
      setIsProcessing(false);
    }, 1500);
  };

  const handleMarkComplete = () => {
    setJobStatus('Completed');
  };

  const handleDispute = () => {
    setJobStatus('Disputed');
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-orange-500/30 relative overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-black z-0 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header Navigation */}
        <button 
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group w-fit"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* 1. Job Status Pipeline */}
        <div className="mb-6 p-6 rounded-3xl bg-[#0a0a0a]/80 border border-white/5 shadow-2xl backdrop-blur-md">
           <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-widest text-center">Job Status Pipeline</h2>
           <div className="flex flex-col md:flex-row items-center justify-between relative max-w-4xl mx-auto">
              <div className="hidden md:block absolute top-[15px] left-[10%] right-[10%] h-[2px] bg-slate-800 z-0" />
              {['Requested', 'Accepted', 'Payment_Initiated', 'Work_In_Progress', 'Completed'].map((step, idx) => {
                 const stepMapping: Record<string, number> = {
                   'Requested': 0, 'Accepted': 1, 'Payment_Initiated': 2, 'Work_In_Progress': 3, 'Completed': 4, 'Disputed': -1
                 };
                 const currentIdx = stepMapping[jobStatus];
                 const isCompleted = currentIdx >= idx;
                 const isActive = currentIdx === idx;
                 const isDisputed = jobStatus === 'Disputed';
                 
                 return (
                   <div key={step} className="relative z-10 flex flex-col items-center gap-2 mb-4 md:mb-0">
                     <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors shadow-inner
                       ${isDisputed ? 'border-red-500 bg-red-500/20 text-red-500' : 
                         isCompleted ? 'border-[#FF6A00] bg-[#FF6A00]/20 text-[#FF6A00]' : 'border-slate-700 bg-slate-900 text-slate-600'}
                     `}>
                       {(isCompleted && !isDisputed) && <CheckCircle2 className="w-4 h-4" />}
                       {isDisputed && <AlertTriangle className="w-4 h-4" />}
                     </div>
                     <span className={`text-[10px] md:text-sm uppercase tracking-wider font-bold 
                        ${isDisputed ? 'text-red-500' : isActive ? 'text-[#FF6A00]' : isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
                        {step.replace(/_/g, ' ')}
                     </span>
                   </div>
                 )
              })}
           </div>
        </div>

        {/* 2. Project Info Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 md:p-8 mb-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border ${
                 jobStatus === 'Disputed' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                 jobStatus === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-[#FF6A00]/10 border-[#FF6A00]/20 text-[#FF6A00]'
              }`}>
                {jobStatus.replace(/_/g, ' ')}
              </span>
              <span className="text-slate-500 text-xs font-bold tracking-widest uppercase">ID: #{id || '101'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-4">{mockProject.title}</h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                  <img src={getSmartImage("projects")} alt={mockProject.actorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="text-slate-300">{mockProject.actorName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#FF6A00]">
                <DollarSign className="w-4 h-4" />
                <span>{mockProject.budget}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-4 h-4 text-[#FF6A00]" />
                <span>{mockProject.timeline}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={handleDispute} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold rounded-xl border border-red-500/20 transition-colors uppercase tracking-widest">
              Raise Dispute
            </button>
            <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 transition-all">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Chat & Files (Secure Zone) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Securty Notice */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3">
               <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
               <div>
                  <p className="text-emerald-500 font-bold text-sm uppercase tracking-wide">Secure Zone Active</p>
                  <p className="text-emerald-400/80 text-xs mt-1 font-medium leading-relaxed">All chat messages and files uploaded here are permanently logged and time-stamped. Uploaded files are automatically watermarked for ownership proof.</p>
               </div>
            </div>

            {/* Chat Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-xl flex flex-col h-[450px]"
            >
              <div className="p-4 md:p-6 border-b border-white/5 flex items-center gap-3 bg-[#030303] rounded-t-3xl">
                <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                  <img src={getSmartImage("projects")} alt={mockProject.actorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{mockProject.actorName}</h2>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-md ${
                      msg.isSelf 
                        ? 'bg-[#FF6A00] text-black rounded-tr-sm' 
                        : 'bg-[#030303] text-slate-200 rounded-tl-sm border border-white/5'
                    }`}>
                      <p className={`text-sm font-medium leading-relaxed ${msg.isSelf ? 'text-black' : 'text-slate-300'}`}>{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 px-1 font-bold tracking-widest">{msg.time} (Logged)</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-white/5 bg-[#030303] rounded-b-3xl">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button type="button" className="p-3 rounded-xl text-slate-400 hover:text-[#FF6A00] hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your secure message..."
                    className="flex-1 bg-[#0a0a0a] border border-white/10 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#FF6A00] focus:border-[#FF6A00] transition-all placeholder:text-slate-600 shadow-inner"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-[#FF6A00] hover:bg-orange-500 text-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,106,0,0.3)]"
                  >
                    <Send className="w-5 h-5 ml-1 mr-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>

            {/* File Upload / Storage */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileBadge className="w-5 h-5 text-[#FF6A00]" /> Watermarked Files
                </h2>
                <span className="text-xs font-bold text-[#FF6A00] bg-[#FF6A00]/10 border border-[#FF6A00]/20 px-3 py-1 rounded-full uppercase tracking-widest">
                  {files.length} Secured
               </span>
              </div>

              <button 
                onClick={handleFileUpload}
                className="w-full py-8 rounded-2xl border border-dashed border-white/20 hover:border-[#FF6A00] bg-[#030303] hover:bg-[#FF6A00]/5 transition-all flex flex-col items-center justify-center gap-3 group mb-6 shadow-inner"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 group-hover:border-[#FF6A00]/30 group-hover:bg-[#FF6A00]/10 flex items-center justify-center transition-colors">
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#FF6A00] transition-colors" />
                </div>
                <div className="text-center mt-1">
                   <p className="text-sm font-bold text-slate-300 uppercase tracking-widest group-hover:text-[#FF6A00] transition-colors">Upload Concept / Draft</p>
                   <p className="text-xs font-medium text-slate-500 mt-1">Automatic Timestamp & UserID Watermark Applied.</p>
                </div>
              </button>

              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 rounded-xl bg-[#030303] border border-white/5 hover:border-white/10 transition-colors shadow-inner">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate mb-1">{file.name}</p>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#FF6A00]">Protected • {file.size} • {file.date}</p>
                      </div>
                    </div>
                    <button className="p-2.5 rounded-xl border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* RIGHT COLUMN: Payment Center */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-[#FF6A00]/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(255,106,0,0.05)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF6A00]/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                <Receipt className="w-5 h-5 text-[#FF6A00]" /> Payment Trust UI
              </h2>

              <div className="bg-[#030303] border border-white/10 rounded-2xl p-5 mb-6 text-center shadow-inner relative">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Declared Payment Amount</p>
                <p className="text-3xl font-black text-[#FF6A00] tracking-tight">{mockProject.budget}</p>
              </div>

              {/* PAYMENT FLOW LOGIC */}
              <div className="space-y-4">
                
                {/* Step 1: Declaration */}
                {(!declarationSigned && jobStatus === 'Accepted') && (
                  <div className="animate-fade-in space-y-4">
                    <div className="p-4 rounded-xl bg-orange-500/10 border border-[#FF6A00]/30 flex flex-col gap-2">
                       <h4 className="text-[#FF6A00] font-bold text-sm">Action Required</h4>
                       <p className="text-xs font-medium text-slate-300 leading-relaxed">You must declare your commitment to pay before the actor begins work.</p>
                    </div>
                    <button 
                      onClick={handleSignDeclaration}
                      disabled={isProcessing}
                      className="w-full py-4 rounded-xl bg-[#FF6A00] hover:bg-orange-500 text-black font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(255,106,0,0.3)] disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : `I Declare to Pay ${mockProject.budget}`}
                    </button>
                    <p className="text-center text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-2">Actor Must Then Accept</p>
                  </div>
                )}

                {/* Step 2: Proof Upload */}
                {(declarationSigned && jobStatus === 'Payment_Initiated') && (
                  <div className="animate-fade-in space-y-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-white/10">
                       <p className="text-xs font-bold text-slate-300 mb-3 tracking-wide uppercase">Upload Payment Proof</p>
                       <div className="space-y-3">
                          <input 
                            type="text" 
                            placeholder="Enter UPI ID / Auth Code" 
                            value={tempUpi}
                            onChange={(e) => setTempUpi(e.target.value)}
                             className="w-full bg-[#030303] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF6A00] transition-colors"
                          />
                          <button className="flex w-full items-center justify-center gap-2 border border-dashed border-white/20 bg-white/5 py-3 rounded-xl hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors">
                             <Upload className="w-4 h-4" /> Screenshot Proof
                          </button>
                       </div>
                    </div>
                    <button 
                      onClick={handleUploadPaymentProof}
                      disabled={isProcessing || !tempUpi}
                      className="w-full py-4 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 hover:bg-emerald-400"
                    >
                      {isProcessing ? 'Submitting...' : 'Submit Verification'}
                    </button>
                  </div>
                )}

                {/* Step 3: Work in Progress - Await Completion */}
                {(jobStatus === 'Work_In_Progress') && (
                  <div className="animate-fade-in">
                     <div className="p-5 border border-white/10 bg-[#030303] rounded-2xl flex flex-col items-center text-center shadow-inner gap-3">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <div>
                           <p className="text-emerald-500 font-bold uppercase tracking-widest text-sm">Proof Verified</p>
                           <p className="text-xs text-slate-400 font-medium mt-1">Work is currently under progress. Rate & review only unlocks upon completion.</p>
                        </div>
                     </div>
                     <button onClick={handleMarkComplete} className="w-full py-3 mt-4 border border-[#FF6A00]/50 text-[#FF6A00] font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-[#FF6A00]/10 transition-colors">
                       Dev Tool: Mark Complete
                     </button>
                  </div>
                )}

                {/* Step 4: Completed -> Rate & Review */}
                {jobStatus === 'Completed' && (
                  <div className="animate-fade-in p-5 bg-[#030303] border border-emerald-500/30 rounded-2xl flex flex-col items-center text-center shadow-inner">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mb-3" />
                    <p className="font-black text-emerald-400 uppercase tracking-widest mb-1 text-lg">Job Finished</p>
                    <p className="text-xs text-emerald-500/70 font-bold max-w-xs mb-5 uppercase tracking-wide">Trust score dynamically updated.</p>
                    <button className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-lg">
                      Rate Actor
                    </button>
                  </div>
                )}

                {/* Disputed state */}
                {jobStatus === 'Disputed' && (
                  <div className="p-5 border border-red-500/30 bg-red-500/10 rounded-2xl flex flex-col items-center text-center">
                     <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
                     <p className="text-red-500 font-black uppercase tracking-widest text-lg mb-1">Dispute Active</p>
                     <p className="text-xs text-red-400/80 font-bold px-2 uppercase tracking-wide leading-relaxed">Admin team will review chat logs, NDAs, and payment proof shortly.</p>
                  </div>
                )}

              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
