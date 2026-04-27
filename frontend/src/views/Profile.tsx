import React, { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { useRole } from '../context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { upsertUserProfile, type ProfileDetails, type SerializableProfileValue } from '@/lib/firebaseAuth';
import { getBlockchainReputation } from '@/lib/blockchainClient';
import { 
  ArrowLeft, 
  Mail, 
  Shield, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Edit2, 
  Save,
  FileText,
  Image as ImageIcon,
  User,
  Star,
  Scale,
  CheckCircle2,
  Briefcase,
  Store,
  Package,
  TrendingUp,
  Award,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TechBackground } from '../components/TechBackground';

const initialProfile = {
  name: "Alex Developer",
  role: "Engineer",
  type: "Professional",
  email: "alex.dev@example.com",
  phone: "+1 (555) 123-4567",
  address: "San Francisco, CA",
  dob: "1995-08-15",
  degree: "B.S. Computer Engineering",
  businessName: "Alex's Embedded Solutions",
  bio: "Passionate IoT engineer with 5+ years of experience building scalable hardware solutions and embedded systems. Always looking for the next big challenge in the smart home space.",
  skills: ["Hardware", "Firmware", "C++", "ESP32", "MQTT"],
  avatar: "https://picsum.photos/seed/user/200/200",
  portfolio: "https://github.com/alexdev",
  // Specific stats
  stats: {
    trustScore: 94,
    fairScore: 88,
    completionRate: 98,
    totalContracts: 42,
    // Supplier specific
    productsCount: 15,
    ordersCompleted: 120,
    deliverySuccess: 99,
    rating: 4.8,
    // User specific
    projectsPosted: 12,
    budgetSpent: "$15K"
  }
};

const mockActivity = {
  posts: [
    { id: 1, title: 'Looking for PCB Designer', date: 'Oct 20, 2023', status: 'Active' },
    { id: 2, title: 'Smart Hub Firmware Architecture', date: 'Sep 15, 2023', status: 'Completed' }
  ],
  stories: [
    { id: 1, title: 'New Prototype Testing', date: '2 hours ago', img: 'https://picsum.photos/seed/story1/100/100' },
    { id: 2, title: 'Lab Setup', date: '1 day ago', img: 'https://picsum.photos/seed/story2/100/100' }
  ]
};

type ProfileModel = typeof initialProfile;

function asDetailRecord(value: SerializableProfileValue | undefined): ProfileDetails {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ProfileDetails;
  }

  return {};
}

function detailString(details: ProfileDetails, key: string, fallback = '') {
  const value = details[key];
  return typeof value === 'string' ? value : fallback;
}

function detailStringArray(details: ProfileDetails, key: string, fallback: string[]) {
  const value = details[key];

  if (Array.isArray(value)) {
    const strings = value.filter((item): item is string => typeof item === 'string');
    return strings.length > 0 ? strings : fallback;
  }

  if (typeof value === 'string') {
    const strings = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return strings.length > 0 ? strings : fallback;
  }

  return fallback;
}

function profileFromFirebase(
  firebaseProfile: ReturnType<typeof useAuth>['profile'],
  authEmail: string,
  authName: string,
  appRole: 'user' | 'actor' | 'supplier',
): ProfileModel {
  const registration = asDetailRecord(firebaseProfile?.profileDetails?.registration);
  const profileEdit = asDetailRecord(firebaseProfile?.profileDetails?.profileEdit);
  const roleLabel = appRole === 'actor' ? 'Engineer' : appRole === 'supplier' ? 'Supplier' : 'Client';
  const degree = [
    detailString(registration, 'degree'),
    detailString(registration, 'fieldOfStudy'),
  ].filter(Boolean).join(' / ');

  return {
    ...initialProfile,
    name:
      detailString(profileEdit, 'name') ||
      firebaseProfile?.displayName ||
      authName ||
      detailString(registration, 'fullName') ||
      initialProfile.name,
    role: detailString(profileEdit, 'role', roleLabel),
    type: detailString(profileEdit, 'type') || detailString(registration, 'userType', initialProfile.type),
    email: authEmail || firebaseProfile?.email || detailString(profileEdit, 'email') || initialProfile.email,
    phone:
      detailString(profileEdit, 'phone') ||
      firebaseProfile?.phone ||
      detailString(registration, 'phone') ||
      initialProfile.phone,
    address:
      detailString(profileEdit, 'address') ||
      firebaseProfile?.location ||
      detailString(registration, 'location') ||
      initialProfile.address,
    dob: detailString(profileEdit, 'dob', initialProfile.dob),
    degree: detailString(profileEdit, 'degree') || degree || initialProfile.degree,
    businessName:
      detailString(profileEdit, 'businessName') ||
      detailString(registration, 'businessName') ||
      initialProfile.businessName,
    bio: detailString(profileEdit, 'bio', initialProfile.bio),
    skills: detailStringArray(profileEdit, 'skills', detailStringArray(registration, 'skills', initialProfile.skills)),
    portfolio:
      detailString(profileEdit, 'portfolio') ||
      detailString(registration, 'portfolioWebsite') ||
      detailString(registration, 'githubProfile') ||
      initialProfile.portfolio,
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { user, profile: firebaseProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [profile, setProfile] = useState(initialProfile);
  const [editForm, setEditForm] = useState(initialProfile);
  const [chainReputation, setChainReputation] = useState<{ trustScore: number; verified: boolean } | null>(null);

  useEffect(() => {
    const nextProfile = profileFromFirebase(
      firebaseProfile,
      user?.email ?? '',
      user?.displayName ?? '',
      role,
    );

    setProfile(nextProfile);

    if (!isEditing) {
      setEditForm(nextProfile);
    }
  }, [firebaseProfile, isEditing, role, user?.displayName, user?.email]);

  useEffect(() => {
    const walletAddress =
      (firebaseProfile?.profileDetails &&
      typeof firebaseProfile.profileDetails === 'object' &&
      !Array.isArray(firebaseProfile.profileDetails) &&
      firebaseProfile.profileDetails.registration &&
      typeof firebaseProfile.profileDetails.registration === 'object' &&
      !Array.isArray(firebaseProfile.profileDetails.registration) &&
      typeof firebaseProfile.profileDetails.registration.walletAddress === 'string'
        ? firebaseProfile.profileDetails.registration.walletAddress
        : '') || '';

    if (!walletAddress) {
      setChainReputation(null);
      return;
    }

    let cancelled = false;
    getBlockchainReputation({ walletAddress }).then((result: any) => {
      if (!cancelled && !result?.error) {
        setChainReputation({
          trustScore: Number(result.trustScore || 0),
          verified: Boolean(result.verified),
        });
      }
    }).catch(() => {
      if (!cancelled) setChainReputation(null);
    });

    return () => {
      cancelled = true;
    };
  }, [firebaseProfile]);

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);

    try {
      if (user) {
        await upsertUserProfile(user, {
          displayName: editForm.name,
          phone: editForm.phone,
          location: editForm.address,
          profileDetails: {
            ...(firebaseProfile?.profileDetails ?? {}),
            profileEdit: {
              name: editForm.name,
              role: editForm.role,
              type: editForm.type,
              email: editForm.email,
              phone: editForm.phone,
              address: editForm.address,
              dob: editForm.dob,
              degree: editForm.degree,
              businessName: editForm.businessName,
              bio: editForm.bio,
              skills: editForm.skills,
              portfolio: editForm.portfolio,
            },
          },
        });
      }

      setProfile(editForm);
      setIsEditing(false);
    } catch {
      setSaveError('Unable to save profile to Firebase. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white font-sans relative overflow-y-auto pb-12">
      <div className="fixed inset-0 z-0">
        <TechBackground />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Return Home</span>
          </button>
          
          {isEditing ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>

        {saveError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Main Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
              
              <div className="relative w-32 h-32 mx-auto rounded-full bg-slate-800 border-4 border-slate-900 overflow-hidden shadow-xl mb-4 mt-4">
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-3 mb-4">
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-lg px-3 py-2 text-center font-bold text-xl focus:outline-none focus:border-blue-500/50"
                  />
                  {role === 'user' ? (
                    <select 
                      value={editForm.type}
                      onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                      className="w-full bg-slate-950/50 border border-slate-800 text-blue-400 rounded-lg px-3 py-2 text-center font-medium focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="Student">Student</option>
                      <option value="Parent">Parent</option>
                      <option value="Professional">Professional</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <select 
                      value={editForm.role}
                      onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                      className="w-full bg-slate-950/50 border border-slate-800 text-blue-400 rounded-lg px-3 py-2 text-center font-medium focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="User">User</option>
                      <option value="Engineer">Engineer</option>
                      <option value="Supplier">Supplier</option>
                    </select>
                  )}
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-white mb-1">{profile.name}</h1>
                  <p className="text-blue-400 font-medium mb-4 capitalize">{role === 'user' ? profile.role : role}</p>
                  {chainReputation?.verified ? (
                    <p className="mb-4 inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                      <Shield className="h-3 w-3" />
                      Blockchain Verified Reputation ({chainReputation.trustScore})
                    </p>
                  ) : null}
                </>
              )}

              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {(role === 'actor' || role === 'user') && profile.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                    {skill}
                  </span>
                ))}
                {isEditing && (role === 'actor' || role === 'user') && (
                  <button className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors">
                    + Add Skill
                  </button>
                )}
              </div>

              {!isEditing && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Common stats for Actor & Supplier */}
                  {(role === 'actor' || role === 'supplier') && (
                    <>
                      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5 text-yellow-400 font-bold mb-1">
                          <Star className="w-4 h-4" />
                          <span>{profile.stats.trustScore}</span>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Trust Score</p>
                      </div>
                      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
                          <Scale className="w-4 h-4" />
                          <span>{profile.stats.fairScore}</span>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Fair Score</p>
                      </div>
                      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{profile.stats.completionRate}%</span>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Completion</p>
                      </div>
                      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{profile.stats.totalContracts}</span>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Contracts</p>
                      </div>
                    </>
                  )}
                  {/* Stats for regular User */}
                  {role === 'user' && (
                    <>
                       <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{profile.stats.projectsPosted}</span>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Projects Posted</p>
                      </div>
                      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{profile.stats.budgetSpent}</span>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Budget Spent</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!isEditing && (
                <button 
                  onClick={() => {
                    // Only allow one role addition process. (simplified mapping)
                    const nextRole = role === 'user' ? 'Engineer' : role === 'actor' ? 'Supplier' : 'Engineer';
                    localStorage.setItem('roleUpgrade', nextRole);
                    navigate('/onboarding', { state: { role: nextRole, isUpgrade: true } });
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-slate-300 text-sm font-bold transition-all shadow-lg border border-white/5"
                >
                  Add Secondary Role
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Column: Details & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl"
            >
              <h2 className="text-lg font-semibold text-white mb-6">About</h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Bio</label>
                    <textarea 
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      rows={3}
                      className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 resize-none text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                      <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Phone</label>
                      <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Address</label>
                      <input type="text" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Date of Birth</label>
                      <input type="date" value={editForm.dob} onChange={(e) => setEditForm({...editForm, dob: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 text-sm" />
                    </div>
                    {role === 'user' && (
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Account Type</label>
                        <select 
                          value={editForm.type}
                          onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                          className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 text-sm"
                        >
                          <option value="Student">Student</option>
                          <option value="Parent">Parent</option>
                          <option value="Professional">Professional</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}
                    {role === 'actor' && (
                       <div className="md:col-span-2">
                        <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Degree / Field</label>
                        <input type="text" value={editForm.degree} onChange={(e) => setEditForm({...editForm, degree: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 text-sm" />
                      </div>
                    )}
                    {role === 'supplier' && (
                       <div className="md:col-span-2">
                        <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Business Name</label>
                        <input type="text" value={editForm.businessName} onChange={(e) => setEditForm({...editForm, businessName: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 text-sm" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-slate-300 text-sm leading-relaxed">{profile.bio}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Email</p>
                        <p className="text-sm text-slate-200">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Phone</p>
                        <p className="text-sm text-slate-200">{profile.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Location</p>
                        <p className="text-sm text-slate-200">{profile.address}</p>
                      </div>
                    </div>
                    {role === 'user' && (
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Type</p>
                          <p className="text-sm text-slate-200">{profile.type}</p>
                        </div>
                      </div>
                    )}
                    {role === 'actor' && (
                       <>
                        <div className="flex items-start gap-3">
                          <GraduationCap className="w-5 h-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Degree / Field</p>
                            <p className="text-sm text-slate-200">{profile.degree}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Award className="w-5 h-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Experience</p>
                            <p className="text-sm text-slate-200">5+ Years</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <LinkIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Portfolio</p>
                            <a href={profile.portfolio} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:text-blue-300">{profile.portfolio}</a>
                          </div>
                        </div>
                      </>
                    )}
                    {role === 'supplier' && (
                      <div className="flex items-start gap-3">
                        <Store className="w-5 h-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Business Name</p>
                          <p className="text-sm text-slate-200">{profile.businessName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Activity Section */}
            {!isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl"
              >
                <h2 className="text-lg font-semibold text-white mb-6">Recent Activity</h2>
                
                <div className="space-y-8">
                  {/* Posts / Contracts / Supply */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                       <FileText className="w-4 h-4" />
                       {role === 'user' && 'Projects Posted (Look-In)'}
                       {role === 'actor' && 'Recent Contracts'}
                       {role === 'supplier' && 'Top Products'}
                    </h3>
                    {role === 'supplier' ? (
                       <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer">
                          <div>
                            <p className="text-sm font-medium text-slate-200">ESP32-S3 WROOM-1 Module</p>
                            <p className="text-xs text-slate-500 mt-1">Sold: 50+ | Rating: 4.9</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                        </div>
                         <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer">
                          <div>
                            <p className="text-sm font-medium text-slate-200">Stepper Driver DRV8825</p>
                            <p className="text-xs text-slate-500 mt-1">Sold: 120+ | Rating: 4.7</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                        </div>
                       </div>
                    ) : (
                      <div className="space-y-3">
                        {mockActivity.posts.map(post => (
                          <div key={post.id} className="p-4 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer">
                            <div>
                              <p className="text-sm font-medium text-slate-200">{post.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{post.date}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                              post.status === 'Active' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {post.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Optional Appended Info Based on Role */}
                  {role === 'supplier' && (
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
                       <div className="bg-slate-950/30 border border-white/5 p-4 rounded-xl flex flex-col items-center">
                         <Store className="w-5 h-5 text-purple-400 mb-2" />
                         <p className="text-xl font-bold text-white mb-1">{profile.stats.productsCount}</p>
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">Catalog Size</p>
                       </div>
                       <div className="bg-slate-950/30 border border-white/5 p-4 rounded-xl flex flex-col items-center">
                         <Package className="w-5 h-5 text-blue-400 mb-2" />
                         <p className="text-xl font-bold text-white mb-1">{profile.stats.ordersCompleted}</p>
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">Orders Setup</p>
                       </div>
                       <div className="bg-slate-950/30 border border-white/5 p-4 rounded-xl flex flex-col items-center">
                         <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
                         <p className="text-xl font-bold text-white mb-1">{profile.stats.deliverySuccess}%</p>
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">Delivery Success</p>
                       </div>
                       <div className="bg-slate-950/30 border border-white/5 p-4 rounded-xl flex flex-col items-center">
                         <Star className="w-5 h-5 text-yellow-400 mb-2" />
                         <p className="text-xl font-bold text-white mb-1">{profile.stats.rating}</p>
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">Avg Rating</p>
                       </div>
                     </div>
                  )}

                  {role === 'actor' && (
                     <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Client Reviews
                      </h3>
                      <div className="p-4 border border-white/5 rounded-xl bg-slate-950/30">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm text-slate-200 font-medium">"Delivered the 3D models early. High quality."</p>
                          <div className="flex text-yellow-400">
                             <Star className="w-3 h-3" fill="currentColor" />
                             <Star className="w-3 h-3" fill="currentColor" />
                             <Star className="w-3 h-3" fill="currentColor" />
                             <Star className="w-3 h-3" fill="currentColor" />
                             <Star className="w-3 h-3" fill="currentColor" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">- John D. (Oct 12, 2023)</p>
                      </div>
                     </div>
                  )}

                  {/* Stories */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Stories (Cuts)
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {mockActivity.stories.map(story => (
                        <div key={story.id} className="flex-shrink-0 w-32 group cursor-pointer">
                          <div className="w-full aspect-[9/16] rounded-xl overflow-hidden relative mb-2 border border-white/10 group-hover:border-blue-500/50 transition-colors">
                            <img src={story.img} alt={story.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <p className="absolute bottom-2 left-2 right-2 text-[10px] font-medium text-white leading-tight">{story.title}</p>
                          </div>
                          <p className="text-[10px] text-slate-500 text-center">{story.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
