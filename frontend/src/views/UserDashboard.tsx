import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from '@/lib/router';
import { getSmartImage } from '@/utils/assetManager';
import { TermsContent, PrivacyContent, HelpContent } from '../components/LegalContent';
import { InteractionModal } from '../components/InteractionModal';
import { CutPlayer } from '../components/CutPlayer';
import { 
  Home as HomeIcon, 
  FolderKanban, 
  MessageSquare, 
  Settings, 
  Search, 
  Bell, 
  User,
  Sparkles,
  TrendingUp,
  Users,
  ShoppingBag,
  Cpu,
  BrainCircuit,
  Shield,
  Clock,
  DollarSign,
  ChevronRight,
  Menu,
  Bookmark,
  X,
  Briefcase,
  Plus,
  Heart,
  Share2,
  Flag,
  Maximize2,
  Minimize2,
  Send,
  MapPin,
  ChevronLeft
} from 'lucide-react';
import { TechBackground } from '../components/TechBackground';
import { subscribeProjectPosts, upsertLiveReaction, type LiveProjectPost } from '@/lib/liveData';
import { useAuth } from '@/context/AuthContext';
import { 
  stories, 
  initialPosts, 
  engineeringNews, 
  suggestedProjects, 
  groups, 
  supplierAds, 
  chatMessagesData 
} from '../data/dummyData';

const CUT_IMAGES = [
  "/assets/images/cuts/cut1.jpg",
  "/assets/images/cuts/cut2.jpg",
  "/assets/images/cuts/cut3.jpg",
  "/assets/images/cuts/cut4.jpg",
  "/assets/images/cuts/cut5.jpg",
  "/assets/images/cuts/cut6.jpg",
  "/assets/images/cuts/cut7.jpg",
  "/assets/images/cuts/cut8.jpg",
  "/assets/images/cuts/cut9.jpg",
  "/assets/images/cuts/cut10.jpg"
];

const PROFILE_IMAGES = [
  "/assets/images/profiles/prof1.jpg",
  "/assets/images/profiles/prof2.jpg",
  "/assets/images/profiles/prof3.jpg",
  "/assets/images/profiles/prof4.jpg",
  "/assets/images/profiles/prof5.jpg",
  "/assets/images/profiles/prof6.jpg",
  "/assets/images/profiles/prof7.jpg",
  "/assets/images/profiles/prof8.jpg",
  "/assets/images/profiles/prof9.jpg",
  "/assets/images/profiles/prof10.jpg"
];

// --- DUMMY DATA ---
const suggestedActors = [
  { name: 'James Wilson', skill: 'Robotics Eng', match: '98%' },
  { name: 'Elena Rodriguez', skill: 'CAD Designer', match: '94%' },
  { name: 'Marcus Chen', skill: 'PCB Layout', match: '89%' },
];

const trendingProjects = [
  { title: 'AI Drone Navigation System', bids: 24 },
  { title: 'Smart Grid Energy Monitor', bids: 18 },
  { title: 'Automated Hydroponics', bids: 12 },
];

function formatLiveProjectPost(post: LiveProjectPost) {
  return {
    id: post.id,
    type: 'Need Post',
    title: post.title,
    description: post.description,
    fullDetails: post.fullDetails,
    requireNda: post.requireNda,
    meta1Label: 'Budget',
    meta1Value: post.budget,
    meta1Icon: DollarSign,
    meta2Label: 'Timeline',
    meta2Value: `${post.timeline} Days`,
    meta2Icon: Clock,
    category: post.category,
    buttonText: 'Send Offer',
    author: post.authorName,
    createdBy: post.createdBy,
    time: 'Live now',
    icon: Cpu,
    gradient: 'from-orange-500/20 to-black/20',
    border: 'hover:border-[#FF6A00]/50',
    skills: post.skills,
  };
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<any>(null);
  const [isCutsModalOpen, setIsCutsModalOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<'feed' | 'news'>('feed');

  // New States for UI Fixes
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarMode, setSidebarMode] = useState<'minimized' | 'expanded' | 'hidden'>('minimized');
  const [sidebarDetailModal, setSidebarDetailModal] = useState<any>(null);
  const [infoModal, setInfoModal] = useState<{isOpen: boolean, title: string, content: React.ReactNode}>({ isOpen: false, title: '', content: '' });
  const [chatMessages, setChatMessages] = useState<{text: string, sender: 'user'|'other'}[]>(chatMessagesData);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeProjectPosts(
      (livePosts) => {
        setPosts([...livePosts.map(formatLiveProjectPost), ...initialPosts]);
      },
      (error) => {
        console.warn('Unable to load live feed posts.', error);
        setPosts(initialPosts);
      },
    );

    return unsubscribe;
  }, []);

  // Interactive States
  const [savedPosts, setSavedPosts] = useState<Array<string | number>>([]);
  const [offerModal, setOfferModal] = useState<{isOpen: boolean, postId: string | number | null}>({ isOpen: false, postId: null });
  const [offerForm, setOfferForm] = useState({ amount: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (postId: string | number) => {
    const isSaved = savedPosts.includes(postId);
    // Optimistic UI update
    if (isSaved) {
      setSavedPosts(savedPosts.filter(id => id !== postId));
    } else {
      setSavedPosts([...savedPosts, postId]);
    }

    try {
      await upsertLiveReaction('savedPosts', String(postId), {
        postId: String(postId),
        saved: !isSaved,
      });
    } catch (error) {
      console.warn('Unable to save post state.', error);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setIsSubmitting(false);
    setOfferModal({ isOpen: false, postId: null });
    setOfferForm({ amount: '', message: '' });
    alert('Offer sent successfully!');
  };

  const menuItems = [
    { name: 'Home', icon: HomeIcon, path: '/home' },
    { name: 'Projects', icon: FolderKanban, path: '/projects' },
    { name: 'Intelligence', icon: BrainCircuit, path: '/project-intelligence' },
    { name: 'Trust Layer', icon: Shield, path: '/blockchain-trust' },
    { name: 'Offers', icon: Briefcase, path: '/offers' },
    { name: 'Shop', icon: ShoppingBag, path: '/shop' },
    { name: 'Messages', icon: MessageSquare, path: '/messages' },
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'About', icon: Sparkles, action: 'modal', content: 'We are an engineering platform connecting top talent with innovative projects.' },
    { name: 'Terms & Conditions', icon: Bookmark, action: 'modal', content: <TermsContent /> },
    { name: 'Privacy Policy', icon: Bookmark, action: 'modal', content: <PrivacyContent /> },
    { name: 'Help / Support', icon: MessageSquare, action: 'modal', content: <HelpContent /> },
  ];

  const sidebarName =
    profile?.displayName?.trim() ||
    user?.displayName?.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Your Profile';
  const sidebarRole = profile?.role ? `${profile.role.charAt(0).toUpperCase()}${profile.role.slice(1)}` : 'User';
  const sidebarAvatarSeed = encodeURIComponent(profile?.uid || user?.uid || user?.email || 'techlance-user');
  const sidebarAvatar = user?.photoURL || `https://picsum.photos/seed/${sidebarAvatarSeed}/100/100`;

  return (
    <div className="h-screen w-full flex bg-slate-950 text-white overflow-hidden font-sans selection:bg-blue-500/30 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <TechBackground />
      </div>

      {/* LEFT SIDEBAR (Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out border-r border-white/10 bg-slate-900/60 backdrop-blur-2xl flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.2)]`}>
        {/* Profile Section */}
        <div 
          onClick={() => navigate('/profile')}
          className="p-6 border-b border-white/10 flex items-center gap-4 relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-shadow duration-300">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
              <img src={sidebarAvatar} alt={sidebarName} className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="font-semibold text-sm text-white group-hover:text-blue-200 transition-colors">{sidebarName}</h2>
            <p className="text-xs text-blue-400/80 font-medium tracking-wide">{sidebarRole}</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.name;
            return (
              <button
                key={item.name}
                onClick={() => { 
                  setActiveMenu(item.name); 
                  setMobileMenuOpen(false); 
                  if (item.path) navigate(item.path);
                  if (item.action === 'modal') {
                    setInfoModal({ isOpen: true, title: item.name, content: item.content || '' });
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div layoutId="activeMenuIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                )}
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-medium text-sm tracking-wide">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* MAIN AREA (CENTER) */}
      <main className={`relative z-10 flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ${sidebarMode === 'hidden' ? 'mr-0' : sidebarMode === 'expanded' ? 'mr-[420px]' : 'mr-[260px]'}`}>
        {/* Top Bar */}
        <header className="h-20 border-b border-white/10 bg-slate-900/60 backdrop-blur-2xl flex items-center justify-between px-4 md:px-8 flex-shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4 w-full max-w-md">
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Search Bar */}
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                placeholder="Search projects, engineers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-slate-700 transition-all placeholder:text-slate-500 shadow-inner"
              />
              
              {/* Search Dropdown */}
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Profiles</div>
                      <div 
                        className="px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer flex items-center gap-3"
                        onClick={() => navigate('/profile')}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden"><img src={PROFILE_IMAGES[1]} alt="User" /></div>
                        <div><p className="text-sm text-white">Alice Engineer</p><p className="text-xs text-slate-500">Hardware</p></div>
                      </div>
                      <div className="px-3 py-2 mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</div>
                      <div 
                        className="px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer"
                        onClick={() => setOfferModal({ isOpen: true, postId: 1 })}
                      >
                        <p className="text-sm text-white">Smart Hub Prototype</p>
                        <p className="text-xs text-slate-500">IoT / Hardware</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-3 md:gap-4 ml-4">
            <button 
              onClick={() => navigate('/shop')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors hidden sm:flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Shop
            </button>
            <button 
              onClick={() => navigate('/project-intelligence')}
              className="px-4 py-2 bg-cyan-400/90 hover:bg-cyan-300 text-slate-950 rounded-xl text-sm font-semibold transition-all hidden sm:flex items-center gap-2"
            >
              <BrainCircuit className="w-4 h-4" /> Intelligence
            </button>
            <button 
              onClick={() => navigate('/blockchain-trust')}
              className="px-4 py-2 bg-emerald-400/90 hover:bg-emerald-300 text-slate-950 rounded-xl text-sm font-semibold transition-all hidden sm:flex items-center gap-2"
            >
              <Shield className="w-4 h-4" /> Trust
            </button>
            <button 
              onClick={() => navigate('/create-project')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hidden sm:block"
            >
              Look-In
            </button>
            <button 
              onClick={() => setIsCutsModalOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors hidden sm:block"
            >
              Cuts
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2.5 rounded-full bg-slate-800/50 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              </button>
              
              {/* Notification Dropdown */}
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/10 bg-slate-800/50">
                      <h3 className="font-semibold text-white">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {[
                        { title: "New offer received", time: "Just now", action: () => navigate('/offers') },
                        { title: "Project updated", time: "1 hour ago", action: () => navigate('/projects') },
                        { title: "Message received", time: "2 hours ago", action: () => navigate('/messages') },
                      ].map((notif, i) => (
                        <div key={i} onClick={() => { setIsNotificationOpen(false); notif.action(); }} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                          <p className="text-sm text-slate-200 mb-1"><span className="font-semibold text-blue-400">System</span> {notif.title}</p>
                          <p className="text-xs text-slate-500">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center bg-slate-950/50">
                      <button onClick={() => { setIsNotificationOpen(false); navigate('/offers'); }} className="text-sm text-blue-400 hover:text-blue-300 font-medium">View All</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => navigate('/settings')}
              className="p-2.5 rounded-full bg-slate-800/50 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hidden sm:block"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="p-2.5 rounded-full bg-slate-800/50 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hidden sm:block"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto">
            {/* Stories Section (Horizontal Scroll) */}
            <div className="mb-10">
              <h3 className="text-xs font-bold text-slate-400 mb-5 uppercase tracking-widest">Cuts</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
                
                {stories.map((story, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    onClick={() => setActiveStory(story)}
                    className="relative w-64 h-40 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group border border-white/5 hover:border-blue-500/30 transition-colors shadow-lg"
                  >
                    <img src={CUT_IMAGES[i % CUT_IMAGES.length]} alt={story.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-90" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-sm font-bold truncate mb-1 shadow-sm">{story.title}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
                          <img src={PROFILE_IMAGES[i % PROFILE_IMAGES.length]} alt={story.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <p className="text-slate-300 text-xs truncate font-medium">{story.name}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Main Feed */}
            <div className="space-y-6">
              <div className="flex items-center gap-6 mb-6 border-b border-white/10 pb-0">
                <button 
                  onClick={() => setActiveTab('feed')}
                  className={`text-xs font-bold uppercase tracking-widest pb-3 border-b-2 transition-colors ${activeTab === 'feed' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
                >
                  Your Feed
                </button>
                <button 
                  onClick={() => setActiveTab('news')}
                  className={`text-xs font-bold uppercase tracking-widest pb-3 border-b-2 transition-colors ${activeTab === 'news' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-300'}`}
                >
                  Engineering News
                </button>
              </div>
              
              {activeTab === 'feed' ? (
                posts.map((post, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    key={post.id} 
                    className={`relative rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent group transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10`} />
                    
                    <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-transparent ${post.border} transition-colors duration-300 h-full`}>
                      {/* Post Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                            <img src={PROFILE_IMAGES[i % PROFILE_IMAGES.length]} alt={post.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">{post.author}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span>{post.time}</span>
                              <span>•</span>
                              <span className="text-blue-400">{post.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-slate-800/50 border border-white/5 text-xs font-medium text-slate-300 flex items-center gap-1.5">
                          <post.icon className="w-3.5 h-3.5" />
                          {post.category}
                        </div>
                      </div>

                      {/* Post Content */}
                      <h2 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-blue-100 transition-colors">{post.title}</h2>
                      <p className="text-sm text-slate-400 leading-relaxed mb-6">{post.description}</p>

                      {/* Post Meta & Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
                        <div className="flex gap-6">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{post.meta1Label}</p>
                            <p className="text-sm font-semibold text-white flex items-center gap-1">
                              <post.meta1Icon className="w-4 h-4 text-slate-400" />
                              {post.meta1Value}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{post.meta2Label}</p>
                            <p className="text-sm font-semibold text-white flex items-center gap-1">
                              <post.meta2Icon className="w-4 h-4 text-slate-400" />
                              {post.meta2Value}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                          <button 
                            onClick={() => handleSave(post.id)}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors flex-shrink-0"
                            title="Save Post"
                          >
                            <Bookmark className={`w-4 h-4 ${savedPosts.includes(post.id) ? 'fill-blue-500 text-blue-500' : ''}`} />
                          </button>
                          <button 
                            onClick={() => navigate(`/post/${post.id}`)}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10 transition-colors text-center"
                          >
                            View Details
                          </button>
                          {post.buttonText !== 'Send Offer' && (
                            <button 
                              onClick={() => setOfferModal({ isOpen: true, postId: post.id })}
                              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium border border-transparent transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            >
                              {post.buttonText}
                              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                engineeringNews.map((news, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={news.id} 
                    className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent group transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10" />
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-transparent hover:border-blue-500/30 transition-colors duration-300 h-full">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">{news.author}</span>
                          <span>•</span>
                          <span>{news.time}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">{news.category}</span>
                      </div>
                      <h2 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-blue-200 transition-colors">{news.title}</h2>
                      <p className="text-sm text-slate-400 leading-relaxed">{news.content}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Floating Restore Button for Sidebar */}
      <AnimatePresence>
        {sidebarMode === 'hidden' && (
          <motion.button
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            onClick={() => setSidebarMode('minimized')}
            className="fixed top-1/2 right-4 -translate-y-1/2 z-50 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* RIGHT SIDEBAR (FIXED PANEL - Desktop Only) */}
      <aside className={`hidden xl:flex fixed right-0 top-0 h-screen bg-slate-900/80 backdrop-blur-xl border-l border-white/10 z-40 transition-all duration-300 flex-col ${
        sidebarMode === 'hidden' ? 'translate-x-full' : 'translate-x-0'
      } ${
        sidebarMode === 'expanded' ? 'w-[420px]' : 'w-[260px]'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 h-[73px]">
          <h2 className="font-bold text-white">Platform</h2>
          <div className="flex items-center gap-2">
            {sidebarMode === 'minimized' ? (
              <button onClick={() => setSidebarMode('expanded')} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Expand">
                <Maximize2 className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setSidebarMode('minimized')} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Minimize">
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setSidebarMode('hidden')} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Hide">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sidebar Body - Minimized State */}
        {sidebarMode === 'minimized' && (
          <div className="flex-1 p-4 flex flex-col gap-6 overflow-hidden">
            {/* Rectangular Buttons */}
            <div className="flex flex-col gap-2.5">
              <button onClick={() => setSidebarDetailModal({ type: 'actors', title: 'Suggested Actors', data: suggestedActors })} className="w-full h-[40px] bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl flex items-center justify-center text-sm font-medium text-slate-200 transition-colors">
                Suggested Actors
              </button>
              <button onClick={() => setSidebarDetailModal({ type: 'projects', title: 'Trending Projects', data: trendingProjects })} className="w-full h-[40px] bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl flex items-center justify-center text-sm font-medium text-slate-200 transition-colors">
                Trending Projects
              </button>
              <button onClick={() => setSidebarDetailModal({ type: 'suppliers', title: 'Featured Suppliers', data: supplierAds })} className="w-full h-[40px] bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl flex items-center justify-center text-sm font-medium text-slate-200 transition-colors">
                Featured Suppliers
              </button>
            </div>

            {/* AI INFO BLOCK */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">AI Tools</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-square bg-blue-500/10 border border-blue-500/20 rounded-xl flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-xs font-medium text-blue-400">Budget<br/>Estimation</span>
                </div>
                <div className="aspect-square bg-purple-500/10 border border-purple-500/20 rounded-xl flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-xs font-medium text-purple-400">Idea<br/>Dev</span>
                </div>
                <div className="aspect-square bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-xs font-medium text-emerald-400">Idea<br/>Mapping</span>
                </div>
                <div className="aspect-square bg-orange-500/10 border border-orange-500/20 rounded-xl flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-xs font-medium text-orange-400">Other<br/>Tools</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Body - Expanded State */}
        {sidebarMode === 'expanded' && (
          <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setSidebarDetailModal({ type: 'actors', title: 'Suggested Actors', data: suggestedActors })} className="aspect-[4/3] bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl flex flex-col items-center justify-center p-4 transition-colors group">
                <span className="text-2xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">{suggestedActors.length}</span>
                <span className="text-sm font-medium text-slate-300 text-center">Suggested<br/>Actors</span>
              </button>
              <button onClick={() => setSidebarDetailModal({ type: 'projects', title: 'Trending Projects', data: trendingProjects })} className="aspect-[4/3] bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl flex flex-col items-center justify-center p-4 transition-colors group">
                <span className="text-2xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">{trendingProjects.length}</span>
                <span className="text-sm font-medium text-slate-300 text-center">Trending<br/>Projects</span>
              </button>
              <button onClick={() => setSidebarDetailModal({ type: 'suppliers', title: 'Featured Suppliers', data: supplierAds })} className="aspect-[4/3] bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl flex flex-col items-center justify-center p-4 transition-colors group">
                <span className="text-2xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">{supplierAds.length}</span>
                <span className="text-sm font-medium text-slate-300 text-center">Featured<br/>Suppliers</span>
              </button>
              <button className="aspect-[4/3] bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-xl flex flex-col items-center justify-center p-4 transition-colors group">
                <span className="text-2xl font-bold text-white mb-1 group-hover:scale-110 transition-transform">5</span>
                <span className="text-sm font-medium text-slate-300 text-center">Engineering<br/>News</span>
              </button>
            </div>
          </div>
        )}

        {/* Chat Panel */}
        <div className={`border-t border-white/10 bg-slate-900/90 p-4 shrink-0 flex flex-col ${sidebarMode === 'expanded' ? 'h-[120px]' : 'h-[60px] justify-center'}`}>
          {sidebarMode === 'expanded' && (
            <div className="flex-1 overflow-y-auto mb-2 space-y-2 scrollbar-hide">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`text-xs p-2 rounded-lg max-w-[85%] ${msg.sender === 'user' ? 'bg-blue-600 text-white ml-auto' : 'bg-slate-800 text-slate-200'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && chatInput.trim()) {
                  setChatMessages([...chatMessages, { text: chatInput, sender: 'user' }]);
                  setChatInput('');
                  setTimeout(() => {
                    setChatMessages(prev => [...prev, { text: 'Thanks for the message! I will get back to you soon.', sender: 'other' }]);
                  }, 1000);
                }
              }}
              placeholder="Type a message..." 
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <button 
              onClick={() => {
                if (chatInput.trim()) {
                  setChatMessages([...chatMessages, { text: chatInput, sender: 'user' }]);
                  setChatInput('');
                  setTimeout(() => {
                    setChatMessages(prev => [...prev, { text: 'Thanks for the message! I will get back to you soon.', sender: 'other' }]);
                  }, 1000);
                }
              }}
              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Offer Modal */}
      <InteractionModal 
        isOpen={offerModal.isOpen}
        onClose={() => setOfferModal({ isOpen: false, postId: null })}
        mode="actor"
        contextData={offerModal.postId ? posts.find(p => p.id === offerModal.postId) || initialPosts.find((p: any) => p.id === offerModal.postId) : undefined}
      />

      {/* Story Modal */}
      <AnimatePresence>
        {activeStory && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md"
            onWheel={(e) => {
              if (e.deltaY > 50) {
                const currentIndex = stories.findIndex(s => s.name === activeStory.name);
                const nextIndex = (currentIndex + 1) % stories.length;
                setActiveStory(stories[nextIndex]);
              } else if (e.deltaY < -50) {
                const currentIndex = stories.findIndex(s => s.name === activeStory.name);
                const prevIndex = (currentIndex - 1 + stories.length) % stories.length;
                setActiveStory(stories[prevIndex]);
              }
            }}
          >
            <button 
              onClick={() => setActiveStory(null)}
              className="absolute top-6 right-6 p-3 bg-slate-800/50 text-white/70 hover:text-white hover:bg-slate-700 transition-colors rounded-full z-[110]"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="w-full max-w-7xl h-[80vh] flex items-stretch gap-6 px-8">
              
              {/* LEFT: VIDEO AREA (60%) */}
              <div className="flex-[6] relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex items-center justify-center">
                <CutPlayer 
                  story={activeStory} 
                  isActive={!!activeStory}
                  onNext={() => {
                    const currentIndex = stories.findIndex(s => s.name === activeStory.name);
                    const nextIndex = (currentIndex + 1) % stories.length;
                    setActiveStory(stories[nextIndex]);
                  }}
                />
              </div>

              {/* MIDDLE: ACTIONS (10% / fixed width) */}
              <div className="w-20 flex flex-col items-center justify-center gap-6">
                <button className="p-4 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors flex flex-col items-center gap-1 group">
                  <Heart className="w-6 h-6 group-hover:text-pink-500 transition-colors" />
                  <span className="text-xs font-medium">{activeStory.likes || '1.2k'}</span>
                </button>
                <button className="p-4 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors flex flex-col items-center gap-1 group">
                  <MessageSquare className="w-6 h-6 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xs font-medium">{activeStory.comments || '342'}</span>
                </button>
                <button className="p-4 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors flex flex-col items-center gap-1 group">
                  <Bookmark className="w-6 h-6 group-hover:text-yellow-400 transition-colors" />
                  <span className="text-xs font-medium">Save</span>
                </button>
                <button className="p-4 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors flex flex-col items-center gap-1 group">
                  <Share2 className="w-6 h-6 group-hover:text-green-400 transition-colors" />
                  <span className="text-xs font-medium">Share</span>
                </button>
                <button className="p-4 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors flex flex-col items-center gap-1 group mt-4">
                  <Flag className="w-6 h-6 group-hover:text-red-400 transition-colors" />
                  <span className="text-xs font-medium">Report</span>
                </button>
                <button className="p-4 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors flex flex-col items-center gap-1 group">
                  <Plus className="w-6 h-6 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xs font-medium">Follow</span>
                </button>
              </div>

              {/* RIGHT: DETAILS (30%) */}
              <div className="flex-[3] bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col shadow-2xl">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-500 overflow-hidden">
                    <img src={PROFILE_IMAGES[(activeStory?.name?.length || 0) % PROFILE_IMAGES.length]} alt={activeStory.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <span className="text-white font-medium shadow-sm block text-lg">{activeStory.name}</span>
                    <span className="text-slate-400 text-sm">{activeStory.role}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                  <h3 className="text-2xl font-bold text-white mb-4">{activeStory.title}</h3>
                  <p className="text-slate-300 text-base mb-6 leading-relaxed">
                    {activeStory.description || "Check out this new update from the engineering team. We've made significant progress on the latest prototype."}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(activeStory.tags || ['#Engineering', '#Innovation']).map((tag: string, i: number) => (
                      <span key={i} className="text-sm text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-8">
                    <MapPin className="w-4 h-4" />
                    <span>{activeStory.location || 'Global'}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 mt-auto">
                  <button 
                    onClick={() => {
                      const currentIndex = stories.findIndex(s => s.name === activeStory.name);
                      const nextIndex = (currentIndex + 1) % stories.length;
                      setActiveStory(stories[nextIndex]);
                    }}
                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    Next Cut <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Cuts Upload Modal */}
      <AnimatePresence>
        {isCutsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Upload Cut (Story)</h3>
                <button 
                  onClick={() => setIsCutsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="w-full aspect-video bg-slate-950 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 hover:border-blue-500/50 hover:text-blue-400 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8" />
                  </div>
                  <p className="font-medium">Click to upload video or image</p>
                  <p className="text-xs mt-2 opacity-70">16:9 ratio recommended.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Caption</label>
                    <input 
                      type="text" 
                      placeholder="What's happening?" 
                      className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Tags</label>
                    <input 
                      type="text" 
                      placeholder="e.g. #engineering #iot" 
                      className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 text-sm"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => setIsCutsModalOpen(false)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                  Post Cut
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {infoModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                <h3 className="text-lg font-semibold text-white">{infoModal.title}</h3>
                <button 
                  onClick={() => setInfoModal({ isOpen: false, title: '', content: '' })}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar">
                {infoModal.content}
              </div>
              <div className="p-4 border-t border-white/10 bg-slate-950/50 flex justify-end">
                <button 
                  onClick={() => setInfoModal({ isOpen: false, title: '', content: '' })}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar Detail Modal */}
      <AnimatePresence>
        {sidebarDetailModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                <h3 className="text-lg font-semibold text-white">{sidebarDetailModal.title}</h3>
                <button 
                  onClick={() => setSidebarDetailModal(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {sidebarDetailModal.type === 'actors' && sidebarDetailModal.data.map((actor: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden">
                        <img src={PROFILE_IMAGES[i % PROFILE_IMAGES.length]} alt={actor.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-white">{actor.name}</p>
                        <p className="text-sm text-slate-400">{actor.skill}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-md">{actor.match} Match</span>
                      <button onClick={() => { setSidebarDetailModal(null); navigate('/profile'); }} className="text-xs text-blue-400 hover:text-blue-300 font-medium">View Profile</button>
                    </div>
                  </div>
                ))}
                {sidebarDetailModal.type === 'projects' && sidebarDetailModal.data.map((project: any, i: number) => (
                  <div key={i} className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-base font-medium text-white">{project.title}</p>
                      {project.bids ? (
                        <span className="text-xs font-semibold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-md">{project.bids} Bids</span>
                      ) : (
                        <div className="flex gap-2">
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">{project.budget}</span>
                          <span className="text-xs font-semibold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">{project.timeline}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mb-4">{project.desc || 'This is a dummy description for the trending project. It details the requirements and scope of the work needed.'}</p>
                    <button onClick={() => { setSidebarDetailModal(null); navigate('/projects'); }} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors">View Project</button>
                  </div>
                ))}
                {sidebarDetailModal.type === 'suppliers' && sidebarDetailModal.data.map((ad: any, i: number) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                    <div className="w-16 h-16 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-white/5">
                      <img src={getSmartImage("ui")} alt="Ad" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-medium text-white mb-1">{ad.name}</p>
                      <p className="text-sm text-slate-400 mb-3">{ad.desc}</p>
                      <button onClick={() => { setSidebarDetailModal(null); navigate('/profile'); }} className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-colors">Contact Supplier</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
