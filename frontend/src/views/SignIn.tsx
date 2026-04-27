import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Settings, Users, Briefcase, Package, Zap, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useNavigate } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '../context/RoleContext';
import {
  getFirebaseAuthErrorMessage,
  loginWithEmail,
  mapRoleLabelToAppRole,
  registerWithEmail,
  type ProfileDetails,
  type RegistrationFileUpload,
  type SerializableProfileValue,
} from '@/lib/firebaseAuth';

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

const MINIMAL_PARTICLES: MinimalParticle[] = Array.from({ length: 25 }, (_, index) => {
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

// -- REUSABLE TIGHT FORM COMPONENTS --
const Field = ({ label, children, required = true }: any) => (
  <div className="space-y-1 w-full">
    {label && <label className="text-[10px] font-semibold text-slate-400 ml-1 uppercase tracking-wider">{label} {required && <span className="text-[#FF6A00]">*</span>}</label>}
    {children}
  </div>
);

const Input = ({ type = 'text', className = '', ...props }: any) => {
  const isControlled = props.value !== undefined;

  return (
    <input
      type={type}
      required
      {...props}
      {...(isControlled ? { value: props.value } : {})}
      className={`w-full bg-[#030303] border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#FF6A00] hover:border-white/20 transition-all placeholder:text-slate-600 ${className}`}
    />
  );
};

const Select = ({ options, required = true, ...props }: any) => (
  <div className="relative w-full">
    <select required={required} {...props} className="w-full bg-[#030303] border border-white/10 text-white rounded-lg pl-3 pr-8 py-2 text-xs appearance-none focus:outline-none focus:border-[#FF6A00] transition-all [&>option]:bg-slate-900 cursor-pointer">
      {options.map((o: any) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
    <ChevronDown className="w-3 h-3 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

const FileInput = ({ required = true, className = '', ...props }: any) => (
  <input type="file" required={required} {...props} className={`w-full bg-[#030303] border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#FF6A00] hover:border-white/20 transition-all file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-[#1a1a1a] file:text-[#FF6A00] hover:file:bg-[#2a2a2a] cursor-pointer ${className}`} />
);

const SKIPPED_FIRESTORE_FIELDS = new Set([
  'password',
  'confirmPassword',
  'termsAccepted',
  'roleLabel',
  'userType',
  'actorStatus',
  'supplierType',
]);

function serializeFile(file: File): SerializableProfileValue | null {
  if (!file.name) {
    return null;
  }

  return {
    name: file.name,
    size: file.size,
    type: file.type || 'unknown',
    lastModified: file.lastModified,
  };
}

function serializeFormValue(value: FormDataEntryValue): SerializableProfileValue | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  return serializeFile(value);
}

function appendProfileDetail(
  details: ProfileDetails,
  key: string,
  value: SerializableProfileValue | null,
) {
  if (value === null) {
    return;
  }

  const currentValue = details[key];

  if (currentValue === undefined) {
    details[key] = value;
    return;
  }

  details[key] = Array.isArray(currentValue) ? [...currentValue, value] : [currentValue, value];
}

function collectRegistrationDetails(
  form: HTMLFormElement,
  metadata: {
    roleLabel: string;
    userType: string;
    actorStatus: string;
    supplierType: string;
  },
): ProfileDetails {
  const formData = new FormData(form);
  const details: ProfileDetails = {
    roleLabel: metadata.roleLabel,
    role: mapRoleLabelToAppRole(metadata.roleLabel),
    userType: metadata.userType,
    actorStatus: metadata.actorStatus,
    supplierType: metadata.supplierType,
    termsAccepted: formData.get('termsAccepted') === 'on',
  };

  formData.forEach((value, key) => {
    if (SKIPPED_FIRESTORE_FIELDS.has(key)) {
      return;
    }

    appendProfileDetail(details, key, serializeFormValue(value));
  });

  return details;
}

function collectRegistrationFileUploads(form: HTMLFormElement): RegistrationFileUpload[] {
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"][name]')).flatMap(
    (input) => {
      if (!input.files) {
        return [];
      }

      return Array.from(input.files)
        .filter((file) => Boolean(file.name))
        .map((file) => ({
          field: input.name,
          file,
        }));
    },
  );
}

function getDetailString(details: ProfileDetails, key: string) {
  const value = details[key];
  return typeof value === 'string' ? value : '';
}

export default function SignIn() {
  const [isSign, setIsSign] = useState(true); // true = sign-in, false = sign-up
  const [showPwd, setShowPwd] = useState(false);
  const [role, setFormRole] = useState('User');
  const [userType, setUserType] = useState('Student');
  const [actorStatus, setActorStatus] = useState('Student');
  const [supplierType, setSupplierType] = useState('Individual');
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const [signInForm, setSignInForm] = useState({
    email: '',
    password: '',
  });

  const [signUpForm, setSignUpForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const { setRole } = useRole();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/home');
    }
  }, [loading, navigate, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    
    // Convert form role mapping
    const normalizedRole = mapRoleLabelToAppRole(role);

    try {
      if (isSign) {
        const email = signInForm.email.trim();
        const password = signInForm.password;

        if (!email || !password) {
          setAuthError('Email and password are required.');
          setIsSubmitting(false);
          return;
        }

        const result = await loginWithEmail(email, password);
        const currentRole = result.role ?? 'user';

        localStorage.setItem('role', currentRole);
        setRole(currentRole);
        navigate('/home');
        setIsSubmitting(false);
        return;
      }

      if (signUpForm.password !== signUpForm.confirmPassword) {
        setAuthError('Password and confirm password do not match.');
        setIsSubmitting(false);
        return;
      }

      if (!signUpForm.fullName.trim() || !signUpForm.email.trim() || !signUpForm.password) {
        setAuthError('Name, email, and password are required to register.');
        setIsSubmitting(false);
        return;
      }

      const registrationDetails = collectRegistrationDetails(e.currentTarget, {
        roleLabel: role,
        userType,
        actorStatus,
        supplierType,
      });

      await registerWithEmail({
        displayName: signUpForm.fullName.trim(),
        email: signUpForm.email.trim(),
        password: signUpForm.password,
        role: normalizedRole,
        phone: getDetailString(registrationDetails, 'phone'),
        location: getDetailString(registrationDetails, 'location'),
        profileDetails: {
          registration: registrationDetails,
        },
        fileUploads: collectRegistrationFileUploads(e.currentTarget),
      });

      localStorage.setItem('role', normalizedRole);
      setRole(normalizedRole);
      navigate('/home');
    } catch (error) {
      setAuthError(getFirebaseAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-[#050505] font-sans selection:bg-orange-500/30 overflow-hidden relative">
      <MinimalParticles />
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-black z-0 pointer-events-none" />

      {/* 
        ========================================================
        LEFT SIDE (HERO)
        ========================================================
      */}
      <div className="relative hidden w-[55%] lg:flex flex-col justify-center px-16 xl:px-24 z-10 border-r border-white/5">
        
        {/* LOGO */}
        <div className="absolute top-12 left-16 xl:left-24 flex flex-col items-start gap-1">
          <Settings className="w-8 h-8 text-[#FF6A00]" />
          <span className="font-extrabold text-white text-lg tracking-[0.2em] mt-1 drop-shadow-md">
            TECHLANCE
          </span>
        </div>

        {/* HERO CONTENT */}
        <div className="mt-8">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl xl:text-6xl font-black text-white leading-tight mb-2 tracking-tight"
          >
            TECHLANCE
          </motion.h1>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl text-[#FF6A00] font-bold mb-4 tracking-wide"
          >
            Engineering Freelance Ecosystem
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-lg max-w-lg leading-relaxed mb-16"
          >
            Connect engineers, suppliers, and innovators to build real-world projects.
          </motion.p>

          {/* FEATURE BLOCK - 4 CARDS */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 gap-4 max-w-lg"
          >
            <div className="bg-white/[0.03] border border-white/5 hover:border-[#FF6A00]/50 p-5 rounded-2xl backdrop-blur-md transition-all duration-300 group hover:shadow-[0_0_20px_rgba(255,106,0,0.15)] flex flex-col items-start cursor-default">
              <Users className="w-6 h-6 text-[#FF6A00] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold text-sm">Find Engineers</h3>
            </div>
            
            <div className="bg-white/[0.03] border border-white/5 hover:border-[#FF6A00]/50 p-5 rounded-2xl backdrop-blur-md transition-all duration-300 group hover:shadow-[0_0_20px_rgba(255,106,0,0.15)] flex flex-col items-start cursor-default">
              <Briefcase className="w-6 h-6 text-[#FF6A00] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold text-sm">Build Projects</h3>
            </div>
            
            <div className="bg-white/[0.03] border border-white/5 hover:border-[#FF6A00]/50 p-5 rounded-2xl backdrop-blur-md transition-all duration-300 group hover:shadow-[0_0_20px_rgba(255,106,0,0.15)] flex flex-col items-start cursor-default">
              <Package className="w-6 h-6 text-[#FF6A00] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold text-sm">Suppliers</h3>
            </div>
            
            <div className="bg-white/[0.03] border border-white/5 hover:border-[#FF6A00]/50 p-5 rounded-2xl backdrop-blur-md transition-all duration-300 group hover:shadow-[0_0_20px_rgba(255,106,0,0.15)] flex flex-col items-start cursor-default">
              <Zap className="w-6 h-6 text-[#FF6A00] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold text-sm">Collaboration</h3>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 
        ========================================================
        RIGHT SIDE (LOGIN / OBOARDING FORM)
        ========================================================
      */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-8 relative z-10 w-full h-full">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[500px] h-full flex flex-col justify-center"
        >
          {/* Glass Card - Scroll constrained to fit inside 100vh page */}
          <div className="backdrop-blur-2xl bg-[#0a0a0a]/80 border border-white/5 p-6 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] relative overflow-hidden">
            
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF6A00]/50 to-transparent" />
            
            {/* Header (Fixed) */}
            <div className="text-center mb-6 shrink-0">
               <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                 {isSign ? "Welcome Back" : "Create Account"}
               </h2>
               <div className="flex bg-[#050505] rounded-xl p-1 border border-white/10 w-fit mx-auto">
                 <button type="button" onClick={() => setIsSign(true)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isSign ? 'bg-[#FF6A00] text-black' : 'text-slate-400 hover:text-white'}`}>Sign In</button>
                 <button type="button" onClick={() => setIsSign(false)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isSign ? 'bg-[#FF6A00] text-black' : 'text-slate-400 hover:text-white'}`}>Sign Up</button>
               </div>
            </div>

            {/* Form Scroll Area (No visible scrollbar) */}
            <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 pb-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                {authError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    {authError}
                  </div>
                )}
                
                {isSign ? (
                  // --- SIGN IN FLOW ---
                  <div className="space-y-4">
                    <Field label="Email ID">
                      <Input
                        type="email"
                        name="signInEmail"
                        placeholder="you@example.com"
                        value={signInForm.email}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          setSignInForm({ ...signInForm, email: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="Password">
                      <div className="relative">
                        <Input
                          type={showPwd ? 'text' : 'password'}
                          name="signInPassword"
                          placeholder="••••••••"
                          value={signInForm.password}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setSignInForm({ ...signInForm, password: event.target.value })
                          }
                        />
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </Field>
                  </div>
                ) : (
                  // --- FULL ONBOARDING FLOW ---
                  <div className="space-y-5">
                    {/* Common Account Section */}
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Full Name">
                        <Input
                          name="fullName"
                          placeholder="John Doe"
                          value={signUpForm.fullName}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setSignUpForm({ ...signUpForm, fullName: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Email ID">
                        <Input
                          type="email"
                          name="email"
                          placeholder="john@domain.com"
                          value={signUpForm.email}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setSignUpForm({ ...signUpForm, email: event.target.value })
                          }
                        />
                      </Field>
                    </div>

                    <Field label="Mobile Number">
                      <div className="flex gap-2 relative">
                        <Input type="tel" name="phone" placeholder="+1 234 567 8900" className="pr-[90px]" />
                        <button type="button" onClick={() => setOtpSent(true)} className="absolute right-1 top-1 bottom-1 px-3 bg-white/5 hover:bg-[#FF6A00]/20 text-[#FF6A00] text-[10px] font-bold rounded-md border border-white/10 whitespace-nowrap transition-colors flex items-center justify-center">
                          {otpSent ? <CheckCircle2 className="w-4 h-4" /> : 'SEND OTP'}
                        </button>
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Password">
                        <div className="relative">
                          <Input
                            type={showPwd ? 'text' : 'password'}
                            name="password"
                            placeholder="••••••••"
                            value={signUpForm.password}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                              setSignUpForm({ ...signUpForm, password: event.target.value })
                            }
                          />
                          <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                            {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </Field>
                      <Field label="Confirm Password">
                        <Input
                          type={showPwd ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="••••••••"
                          value={signUpForm.confirmPassword}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setSignUpForm({ ...signUpForm, confirmPassword: event.target.value })
                          }
                        />
                      </Field>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Role Selection */}
                    <Field label="Select Profile Role">
                      <Select name="roleLabel" value={role} onChange={(e: any) => setFormRole(e.target.value)} options={['User', 'Actor', 'Supplier']} />
                    </Field>

                    {/* ------------- USER (CLIENT) FIELDS ------------- */}
                    {role === 'User' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Field label="Personal Type">
                          <Select name="userType" value={userType} onChange={(e: any) => setUserType(e.target.value)} options={['Student', 'Parent', 'Other']} />
                        </Field>
                        
                        {userType === 'Student' && (
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="School / College Name"><Input name="schoolCollegeName" placeholder="University Name" /></Field>
                            <Field label="Student ID Number"><Input name="studentIdNumber" placeholder="ID Number" /></Field>
                            <div className="col-span-2"><Field label="Upload ID Card (Image/PDF)"><FileInput name="studentIdCard" accept="image/*,.pdf" /></Field></div>
                          </div>
                        )}

                        {userType === 'Parent' && (
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Child Name"><Input name="childName" placeholder="Child Name" /></Field>
                            <Field label="School / College Name"><Input name="childSchoolCollegeName" placeholder="School Name" /></Field>
                            <div className="col-span-2"><Field label="Parent ID Proof Number"><Input name="parentIdProofNumber" placeholder="ID Proof Number" /></Field></div>
                          </div>
                        )}

                        {userType === 'Other' && (
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Organization Name"><Input name="organizationName" placeholder="Org Name" /></Field>
                            <Field label="Role / Purpose"><Input name="organizationRolePurpose" placeholder="Role" /></Field>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Location (City + State)"><Input name="location" placeholder="New York, NY" /></Field>
                          <Field label="Budget Range"><Input name="budgetRange" type="number" placeholder="e.g. 500" min="0" /></Field>
                        </div>
                        <Field label="Purpose of Use"><Input name="purposeOfUse" placeholder="Briefly describe what you want built..." /></Field>
                      </div>
                    )}

                    {/* ------------- ACTOR (SERVICE PROVIDER) FIELDS ------------- */}
                    {role === 'Actor' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-[#1a1a1a]/50 border border-white/5 rounded-xl p-4 space-y-4">
                          <h4 className="text-[10px] text-[#FF6A00] font-bold uppercase tracking-wider">Basic Profile</h4>
                          <Field label="Profile Photo"><FileInput name="profilePhoto" accept="image/*" /></Field>
                          <Field label="Headline"><Input name="headline" placeholder="e.g. IoT Developer | PCB Designer" /></Field>
                          <Field label="Skills (comma separated)"><Input name="skills" placeholder="React, Node, Python" /></Field>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Experience Level">
                              <Select name="experienceLevel" options={['Beginner', 'Intermediate', 'Expert']} />
                            </Field>
                            <Field label="Years of Exp."><Input name="yearsOfExperience" type="number" min="0" placeholder="0" /></Field>
                          </div>
                        </div>

                        <div className="bg-[#1a1a1a]/50 border border-white/5 rounded-xl p-4 space-y-4">
                          <h4 className="text-[10px] text-[#FF6A00] font-bold uppercase tracking-wider">Education & Work</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Degree"><Input name="degree" placeholder="B.Tech" /></Field>
                            <Field label="Field of Study"><Input name="fieldOfStudy" placeholder="Computer Science" /></Field>
                          </div>
                          <Field label="College / Institute"><Input name="collegeInstitute" placeholder="Institute Name" /></Field>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Current Status">
                              <Select name="actorStatus" value={actorStatus} onChange={(e:any) => setActorStatus(e.target.value)} options={['Student', 'Working', 'Freelance', 'Other']} />
                            </Field>
                            {actorStatus === 'Working' && <Field label="Company Name"><Input name="companyName" placeholder="Company" /></Field>}
                          </div>
                          <Field label="Previous Work Description"><Input name="previousWorkDescription" placeholder="Describe past projects" /></Field>
                        </div>

                        <div className="bg-[#1a1a1a]/50 border border-white/5 rounded-xl p-4 space-y-4">
                          <h4 className="text-[10px] text-[#FF6A00] font-bold uppercase tracking-wider">Portfolio & Links</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="GitHub Profile"><Input name="githubProfile" type="url" placeholder="https://github.com/..." /></Field>
                            <Field label="Portfolio Website"><Input name="portfolioWebsite" type="url" placeholder="https://..." /></Field>
                          </div>
                          <Field label="Upload Work Files"><FileInput name="workFiles" multiple /></Field>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="LinkedIn Profile"><Input name="linkedinProfile" type="url" placeholder="https://linkedin.com/..." /></Field>
                            <Field label="Other Platform" required={false}><Input name="otherPlatform" type="url" placeholder="Optional URL" /></Field>
                          </div>
                        </div>

                        <div className="bg-[#1a1a1a]/50 border border-white/5 rounded-xl p-4 space-y-4">
                          <h4 className="text-[10px] text-[#FF6A00] font-bold uppercase tracking-wider">Identity & Payment</h4>
                          <Field label="Aadhaar OR PAN Number"><Input name="identityNumber" placeholder="ID Number" /></Field>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="UPI ID"><Input name="upiId" placeholder="username@upi" /></Field>
                            <Field label="Upload QR Code"><FileInput name="upiQrCode" accept="image/*" /></Field>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ------------- SUPPLIER (SELLER) FIELDS ------------- */}
                    {role === 'Supplier' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-[#1a1a1a]/50 border border-white/5 rounded-xl p-4 space-y-4">
                          <h4 className="text-[10px] text-[#FF6A00] font-bold uppercase tracking-wider">Business Info</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Business Name"><Input name="businessName" placeholder="Business Name" /></Field>
                            <Field label="Owner Name"><Input name="ownerName" placeholder="Owner Name" /></Field>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Business Type">
                              <Select name="supplierType" value={supplierType} onChange={(e:any) => setSupplierType(e.target.value)} options={['Individual', 'Shop', 'Company']} />
                            </Field>
                            <Field label="Location"><Input name="location" placeholder="City, State" /></Field>
                          </div>
                        </div>

                        <div className="bg-[#1a1a1a]/50 border border-white/5 rounded-xl p-4 space-y-4">
                          <h4 className="text-[10px] text-[#FF6A00] font-bold uppercase tracking-wider">Capabilities & Legal</h4>
                          <Field label="Product Categories (tags)"><Input name="productCategories" placeholder="PCBs, Sensors, Displays" /></Field>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Min Order Capability"><Input name="minOrderCapability" type="number" min="1" placeholder="Minimum quantity" /></Field>
                            <Field label="Supply Capacity"><Input name="supplyCapacity" type="number" min="1" placeholder="Max weekly units" /></Field>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="PAN Number"><Input name="panNumber" placeholder="PAN" /></Field>
                            <Field label="GST Number" required={false}><Input name="gstNumber" placeholder="GST (Optional)" /></Field>
                          </div>
                          <Field label="Upload Shop/Invoice Proof"><FileInput name="shopInvoiceProof" accept="image/*,.pdf" /></Field>
                        </div>

                        <div className="bg-[#1a1a1a]/50 border border-white/5 rounded-xl p-4 space-y-4">
                          <h4 className="text-[10px] text-[#FF6A00] font-bold uppercase tracking-wider">Payment Details</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Bank Account Number"><Input name="bankAccountNumber" placeholder="Account No." /></Field>
                            <Field label="IFSC Code"><Input name="ifscCode" placeholder="IFSC" /></Field>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="UPI ID"><Input name="upiId" placeholder="username@upi" /></Field>
                            <Field label="Upload QR Code"><FileInput name="upiQrCode" accept="image/*" /></Field>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Consent Checkbox */}
                    <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                        <input type="checkbox" name="termsAccepted" required className="peer appearance-none w-4 h-4 border border-white/20 rounded bg-[#030303] checked:bg-[#FF6A00] checked:border-[#FF6A00] focus:outline-none transition-colors" />
                        <CheckCircle2 className="w-3 h-3 text-black absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-[10px] leading-tight text-slate-400 group-hover:text-slate-300 transition-colors">
                        I confirm all provided information is accurate and agree to Terms & Conditions and Privacy Policy. All inputs are strictly required for validation.
                      </span>
                    </label>
                  </div>
                )}

                {/* Submit Action (Fixed to bottom of form) */}
                <div className="pt-4 sticky bottom-0 bg-[#0a0a0a]/90 backdrop-blur-sm border-t border-white/5 pt-4 mt-8">
                   <button 
                     type="submit"
                     disabled={isSubmitting}
                     className="w-full bg-gradient-to-r from-[#FF6A00] to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black tracking-wide rounded-xl py-3 flex items-center justify-center transition-all shadow-[0_0_20px_rgba(255,106,0,0.3)] hover:shadow-[0_0_30px_rgba(255,106,0,0.5)] active:scale-[0.98]"
                   >
                     {isSubmitting ? 'Please wait...' : isSign ? "Launch TECHLANCE" : "Complete Registration"}
                   </button>
                </div>

              </form>
            </div>
            
          </div>
        </motion.div>
      </div>
      
    </div>
  );
}
