import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { User, MapPin, Phone, Lock, CheckCircle2, ArrowRight, Upload, Mail, CreditCard, ShieldCheck } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { recordAuthEvent, upsertUserProfile } from '@/lib/firebaseAuth';

type MinimalParticle = {
  width: string;
  height: string;
  left: string;
  top: string;
  duration: number;
  delay: number;
};

function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const MINIMAL_PARTICLES: MinimalParticle[] = Array.from({ length: 20 }, (_, index) => {
  const base = index + 1;

  return {
    width: `${seededRandom(base * 1.3) * 3 + 2}px`,
    height: `${seededRandom(base * 1.7) * 3 + 2}px`,
    left: `${seededRandom(base * 2.1) * 100}%`,
    top: `${seededRandom(base * 2.9) * 100}%`,
    duration: seededRandom(base * 3.7) * 15 + 10,
    delay: seededRandom(base * 4.3) * 5,
  };
});

const MinimalParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {MINIMAL_PARTICLES.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-orange-500/20 blur-[1px]"
          initial={{
            width: particle.width,
            height: particle.height,
            left: particle.left,
            top: particle.top,
            opacity: 0
          }}
          animate={{
            y: -100,
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
            delay: particle.delay
          }}
        />
      ))}
    </div>
  );
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { setRole: setGlobalRole } = useRole();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    otp: ''
  });
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Step 3: Profile
  const [profileInfo, setProfileInfo] = useState({
    location: ''
  });

  const handleSendOtp = () => {
    if (!basicInfo.phone || basicInfo.phone.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }
    setError('');
    setIsOtpSent(true);
  };

  const handleVerifyOtp = () => {
    if (basicInfo.otp.length !== 4) {
      setError('Enter 4-digit OTP (e.g. 1234)');
      return;
    }
    setError('');
    setIsPhoneVerified(true);
  };

  const handleStep1Submit = () => {
    if (!basicInfo.name || !basicInfo.email || !basicInfo.password || !basicInfo.phone) {
      setError('All fields are required');
      return;
    }
    if (!isPhoneVerified) {
      setError('Please verify your mobile number first');
      return;
    }
    setError('');
    setCurrentStep(2); // Move to Role Assign (Auto)
  };

  // Step 2 is an auto-transition
  useEffect(() => {
    if (currentStep === 2) {
      const timer = setTimeout(() => {
        setCurrentStep(3);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleStep3Submit = () => {
    if (!profileInfo.location) {
      setError('Location is mandatory');
      return;
    }
    setError('');
    setCurrentStep(4);
  };

  const finishOnboarding = async () => {
    if (!user) {
      setError('Please sign in first to complete onboarding.');
      navigate('/');
      return;
    }

    setIsFinishing(true);

    try {
      await upsertUserProfile(user, {
        role: 'user',
        location: profileInfo.location,
      });
      await recordAuthEvent('onboarding_completed', user, { role: 'user' });

      setGlobalRole('user');
      localStorage.setItem('role', 'user');
      navigate('/home');
    } catch {
      setError('Unable to complete onboarding. Please try again.');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#050505] font-sans selection:bg-orange-500/30 relative overflow-y-auto custom-scrollbar">
      <MinimalParticles />
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-black z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-12 flex flex-col items-center">
        
        {/* Header Text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            Create Client Account
          </h1>
          <p className="text-slate-400 text-base md:text-lg">
            Join TECHLANCE to build your next project securely.
          </p>
        </motion.div>

        {/* Dynamic Form Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <div className="backdrop-blur-2xl bg-[#0a0a0a]/80 border border-white/5 p-6 md:p-10 rounded-[2rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF6A00]/50 to-transparent" />
            
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center justify-center font-medium">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              
              {/* STEP 1: ACCOUNT CREATION */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF6A00]/20 flex items-center justify-center text-[#FF6A00] font-bold text-sm">1</div>
                    <h3 className="text-xl font-bold text-white">Basic Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-300 ml-1">Full Name *</label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within/input:text-[#FF6A00]">
                          <User className="w-5 h-5 pointer-events-none" />
                        </div>
                        <input type="text" value={basicInfo.name} onChange={(e) => setBasicInfo({...basicInfo, name: e.target.value})} className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:border-[#FF6A00] focus:ring-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 shadow-inner" placeholder="John Doe" />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-300 ml-1">Email ID *</label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within/input:text-[#FF6A00]">
                          <Mail className="w-5 h-5 pointer-events-none" />
                        </div>
                        <input type="email" value={basicInfo.email} onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})} className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:border-[#FF6A00] focus:ring-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 shadow-inner" placeholder="hello@example.com" />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-300 ml-1">Password *</label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within/input:text-[#FF6A00]">
                          <Lock className="w-5 h-5 pointer-events-none" />
                        </div>
                        <input type="password" value={basicInfo.password} onChange={(e) => setBasicInfo({...basicInfo, password: e.target.value})} className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:border-[#FF6A00] focus:ring-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 shadow-inner" placeholder="••••••••" />
                      </div>
                    </div>

                    {/* Mobile Number & OTP */}
                    <div className="space-y-1.5 md:col-span-2 border border-white/5 rounded-xl p-4 bg-white/[0.02]">
                      <label className="text-sm font-semibold text-slate-300 ml-1">Mobile Number (Verification Required) *</label>
                      
                      <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <div className="relative group/input flex-1">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within/input:text-[#FF6A00]">
                            <Phone className="w-5 h-5 pointer-events-none" />
                          </div>
                          <input type="tel" value={basicInfo.phone} onChange={(e) => setBasicInfo({...basicInfo, phone: e.target.value})} disabled={isPhoneVerified} className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:border-[#FF6A00] focus:ring-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 disabled:opacity-50" placeholder="9876543210" />
                        </div>
                        
                        {!isPhoneVerified && !isOtpSent && (
                          <button type="button" onClick={handleSendOtp} className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-3 rounded-xl transition-colors border border-white/10 shrink-0">
                            Send OTP
                          </button>
                        )}
                      </div>

                      {isOtpSent && !isPhoneVerified && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col sm:flex-row gap-3 mt-3">
                          <input type="text" maxLength={4} value={basicInfo.otp} onChange={(e) => setBasicInfo({...basicInfo, otp: e.target.value})} className="w-full sm:w-1/2 bg-[#030303] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:border-[#FF6A00] focus:ring-[#FF6A00] text-center tracking-widest text-lg font-mono" placeholder="0000" />
                          <button type="button" onClick={handleVerifyOtp} className="w-full sm:w-auto bg-[#FF6A00] hover:bg-orange-500 text-black font-bold px-8 py-3 rounded-xl transition-colors shrink-0">
                            Verify
                          </button>
                        </motion.div>
                      )}

                      {isPhoneVerified && (
                        <div className="mt-3 flex items-center gap-2 text-emerald-500 font-medium text-sm">
                          <CheckCircle2 className="w-4 h-4" /> Verified Successfully
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button type="button" onClick={handleStep1Submit} className="w-full bg-[#FF6A00] hover:bg-orange-500 text-black font-black tracking-wide rounded-xl py-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,106,0,0.3)] hover:shadow-[0_0_30px_rgba(255,106,0,0.5)] active:scale-[0.98]">
                      Continue <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: AUTO ROLE ASSIGNMENT */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="py-12 flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/50 relative">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 relative z-10" />
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="absolute inset-[-4px] border border-transparent border-t-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Basic Verified</h3>
                    <p className="text-slate-400 font-medium">Allocating restricted USER (Client) workspace...</p>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: BASIC PROFILE */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF6A00]/20 flex items-center justify-center text-[#FF6A00] font-bold text-sm">2</div>
                    <h3 className="text-xl font-bold text-white">Profile Setup</h3>
                  </div>

                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-[#030303] border border-white/10 flex items-center justify-center mb-4 shadow-inner">
                      <User className="w-10 h-10 text-slate-600" />
                    </div>
                    <button type="button" className="text-sm font-semibold text-[#FF6A00] hover:text-orange-400 flex items-center gap-2 border border-[#FF6A00]/30 hover:bg-[#FF6A00]/10 px-4 py-2 rounded-lg transition-colors">
                      <Upload className="w-4 h-4" /> Upload Photo (Optional)
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Location (Mandatory)</label>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within/input:text-[#FF6A00]">
                        <MapPin className="w-5 h-5 pointer-events-none" />
                      </div>
                      <input type="text" value={profileInfo.location} onChange={(e) => setProfileInfo({...profileInfo, location: e.target.value})} className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:border-[#FF6A00] focus:ring-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 shadow-inner" placeholder="City, Country" />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button type="button" onClick={handleStep3Submit} className="w-full bg-[#FF6A00] hover:bg-orange-500 text-black font-black tracking-wide rounded-xl py-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,106,0,0.3)] hover:shadow-[0_0_30px_rgba(255,106,0,0.5)] active:scale-[0.98]">
                      Save & Continue <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: PAYMENT SETUP (OPTIONAL) */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                   <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF6A00]/20 flex items-center justify-center text-[#FF6A00] font-bold text-sm">3</div>
                    <h3 className="text-xl font-bold text-white">Payment Method</h3>
                  </div>

                  <div className="p-4 bg-orange-500/5 border border-[#FF6A00]/20 rounded-xl mb-6">
                    <p className="text-slate-300 text-sm flex items-start gap-3">
                       <ShieldCheck className="w-6 h-6 text-[#FF6A00] shrink-0" />
                       Add a card now to seamlessly hire required talent and approve payments instantly via Escrow.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-300 ml-1">Card Number</label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within/input:text-[#FF6A00]">
                          <CreditCard className="w-5 h-5 pointer-events-none" />
                        </div>
                        <input type="text" className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:border-[#FF6A00] focus:ring-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 shadow-inner" placeholder="0000 0000 0000 0000" />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-sm font-semibold text-slate-300 ml-1">Expiry Date</label>
                        <input type="text" className="w-full bg-[#030303] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:border-[#FF6A00] focus:ring-[#FF6A00] hover:border-white/20 transition-all text-center placeholder:text-slate-600" placeholder="MM/YY" />
                      </div>
                      <div className="space-y-1.5 flex-[0.5]">
                        <label className="text-sm font-semibold text-slate-300 ml-1">CVV</label>
                        <input type="password" maxLength={3} className="w-full bg-[#030303] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:border-[#FF6A00] focus:ring-[#FF6A00] hover:border-white/20 transition-all text-center placeholder:text-slate-600" placeholder="•••" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 flex flex-col gap-3">
                    <button type="button" onClick={finishOnboarding} disabled={isFinishing} className="w-full bg-[#FF6A00] hover:bg-orange-500 disabled:opacity-70 disabled:cursor-not-allowed text-black font-black tracking-wide rounded-xl py-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,106,0,0.3)] hover:shadow-[0_0_30px_rgba(255,106,0,0.5)] active:scale-[0.98]">
                      Save & Enter Platform <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={finishOnboarding} disabled={isFinishing} className="w-full bg-transparent hover:bg-white/5 border border-white/10 disabled:opacity-70 disabled:cursor-not-allowed text-slate-300 font-semibold rounded-xl py-3.5 transition-all">
                      Skip for now
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
