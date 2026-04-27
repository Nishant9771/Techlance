import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from '@/lib/router';
import { TermsContent, PrivacyContent, HelpContent } from '../components/LegalContent';
import { InteractionModal } from '../components/InteractionModal';
import { CutPlayer } from '../components/CutPlayer';
import { 
  Home as HomeIcon, 
  MessageSquare, 
  Settings, 
  Search, 
  Bell, 
  User,
  ShoppingBag,
  ListOrdered,
  Menu,
  Bookmark,
  X,
  Plus,
  Heart,
  Flag,
  Share2,
  ChevronRight,
  Edit2,
  MapPin,
  Calendar,
  DollarSign,
  Upload,
  Briefcase,
  Sparkles,
  Info
} from 'lucide-react';
import { TechBackground } from '../components/TechBackground';
import { useAuth } from '@/context/AuthContext';
import { createProduct, subscribeProducts, subscribeProjectPosts, type LiveProjectPost } from '@/lib/liveData';
import { 
  stories, 
  initialPosts, 
  engineeringNews 
} from '../data/dummyData';

function formatLiveProjectPost(post: LiveProjectPost) {
  return {
    id: post.id,
    type: 'Need Post',
    title: post.title,
    description: post.description,
    meta1Label: 'Budget',
    meta1Value: post.budget,
    meta1Icon: DollarSign,
    meta2Label: 'Timeline',
    meta2Value: `${post.timeline} Days`,
    meta2Icon: Calendar,
    category: post.category,
    buttonText: 'Suggest Component',
    author: post.authorName,
    createdBy: post.createdBy,
    time: 'Live now',
    gradient: 'from-orange-500/20 to-black/20',
    border: 'hover:border-[#FF6A00]/50',
  };
}

// Dummy data for showcase
const showcaseProducts = [
  { id: 1, name: 'CNC Aluminum Case D5', price: 150, description: 'Custom engineered aluminum case for edge devices.', stock: 'In Stock (12)', image: 'https://picsum.photos/seed/p1/400/300' },
  { id: 2, name: 'High-Temp 3D Filament', price: 45, description: 'Carbon fiber infused nylon for structural parts.', stock: 'Low Stock (3)', image: 'https://picsum.photos/seed/p2/400/300' },
  { id: 3, name: 'IoT Sensor Bundle X1', price: 85, description: 'Pack of 5 environmental sensors (Temp, Hum, Pres).', stock: 'In Stock (50)', image: 'https://picsum.photos/seed/p3/400/300' },
  { id: 4, name: 'Arduino Mega Kit', price: 45, description: 'Complete starter kit with sensors and modules.', stock: 'In Stock (100)', image: 'https://picsum.photos/seed/p4/400/300' },
  { id: 5, name: 'Raspberry Pi 5', price: 120, description: 'Latest RPi 5 model with 8GB RAM.', stock: 'In Stock (20)', image: 'https://picsum.photos/seed/p5/400/300' },
  { id: 6, name: 'Stepper Motor NEMA 17', price: 30, description: 'High torque stepper motor for CNC/3D printers.', stock: 'In Stock (45)', image: 'https://picsum.photos/seed/p6/400/300' },
  { id: 7, name: 'CNC Aluminum Plate', price: 80, description: 'T6-6061 Aluminum plate 500x500x5mm.', stock: 'In Stock (10)', image: 'https://picsum.photos/seed/p7/400/300' },
  { id: 8, name: 'Li-ion Battery Pack', price: 25, description: '3S 11.1V 2200mAh pack with XT60 connector.', stock: 'In Stock (80)', image: 'https://picsum.photos/seed/p8/400/300' },
  { id: 9, name: 'ESP32 Dev Module', price: 12, description: 'ESP32 WROOM-32 Wi-Fi & Bluetooth module.', stock: 'In Stock (200)', image: 'https://picsum.photos/seed/p9/400/300' },
  { id: 10, name: 'Carbon Fiber Tube', price: 35, description: '1000mm length, 20mm OD high strength tube.', stock: 'Low Stock (5)', image: 'https://picsum.photos/seed/p10/400/300' },
  { id: 11, name: 'Linear Guideway Rail', price: 110, description: 'MGN12H linear rail 400mm length.', stock: 'In Stock (30)', image: 'https://picsum.photos/seed/p11/400/300' },
  { id: 12, name: 'OLED Display 0.96"', price: 8, description: '128x64 pixels I2C white OLED display.', stock: 'In Stock (150)', image: 'https://picsum.photos/seed/p12/400/300' },
  { id: 13, name: 'Drone Motor Brushless', price: 22, description: '2205 2300KV motor for FPV drones.', stock: 'In Stock (64)', image: 'https://picsum.photos/seed/p13/400/300' },
  { id: 14, name: 'Jumper Wire Set', price: 5, description: '120pcs dupont wire set (M-M, M-F, F-F).', stock: 'In Stock (300)', image: 'https://picsum.photos/seed/p14/400/300' },
  { id: 15, name: 'Soldering Iron Station', price: 95, description: '65W digital soldering station with accessories.', stock: 'In Stock (15)', image: 'https://picsum.photos/seed/p15/400/300' },
];

const lookInRequests = [
  { id: 1, component: 'CNC Aluminum Frame', qty: 20, budget: '$500', location: 'Chennai', desc: 'Need precision CNC machined aluminum frames for drone project.' },
  { id: 2, component: '3D Printed Gears', qty: 100, budget: '$200', location: 'Bangalore', desc: 'SLA printed gears, high durability.' },
  { id: 3, component: 'Custom PCB Board', qty: 50, budget: '$1000', location: 'Mumbai', desc: 'Need 4-layer PCB manufacturing and assembly based on Gerber files.' },
  { id: 4, component: 'PCB fabrication', qty: 100, budget: '$600', location: 'Hyderabad', desc: 'Need PCB fabrication – 100 units – 2 layer, FR4.' },
  { id: 5, component: 'Drone motors', qty: 10, budget: '$250', location: 'Pune', desc: 'Looking for drone motors 2207 size, 1900KV. Immediate requirement.' },
  { id: 6, component: 'ESP32 Chips', qty: 500, budget: '$1200', location: 'Delhi', desc: 'Bulk requirement of ESP32 WROOM for smart home appliances.' },
  { id: 7, component: 'Lithium Cells 18650', qty: 1000, budget: '$2000', location: 'Chennai', desc: 'Samsung or LG cells for custom EV battery packs.' },
  { id: 8, component: 'Nylon Filaments', qty: 30, budget: '$800', location: 'Bangalore', desc: '30 spools of high quality black nylon filament.' },
];

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Showcase');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTab, setActiveTab] = useState<'feed' | 'news'>('feed');
  const [activeStory, setActiveStory] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>(initialPosts);

  useEffect(() => {
    const unsubscribe = subscribeProjectPosts(
      (livePosts) => setPosts([...livePosts.map(formatLiveProjectPost), ...initialPosts]),
      (error) => {
        console.warn('Unable to load live supplier feed.', error);
        setPosts(initialPosts);
      },
    );

    return unsubscribe;
  }, []);

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [suggestModal, setSuggestModal] = useState<{isOpen: boolean, request: any}>({ isOpen: false, request: null });
  const [infoModal, setInfoModal] = useState<{isOpen: boolean, title: string, content: React.ReactNode | string}>({isOpen: false, title: '', content: ''});
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  const showcaseProductList = [
    ...liveProducts.filter((product) => product.supplierId === user?.uid),
    ...showcaseProducts,
  ];

  useEffect(() => {
    const unsubscribe = subscribeProducts(
      (items) => setLiveProducts(items),
      (error) => {
        console.warn('Unable to load live showcase products.', error);
        setLiveProducts([]);
      },
    );

    return unsubscribe;
  }, []);

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      setInfoModal({ isOpen: true, title: 'Sign in required', content: 'Please sign in before adding a product.' });
      return;
    }

    const formData = new FormData(e.currentTarget);

    try {
      await createProduct(
        {
          name: String(formData.get('name') ?? ''),
          category: String(formData.get('category') ?? ''),
          price: Number(formData.get('price') ?? 0),
          stock: Number(formData.get('stock') ?? 0),
          description: String(formData.get('description') ?? ''),
        },
        user,
        profile,
      );

      setIsAddProductOpen(false);
    } catch {
      setInfoModal({ isOpen: true, title: 'Unable to add product', content: 'Check Firebase product rules and try again.' });
    }
  };

  const menuItems = [
    { name: 'Home', icon: HomeIcon, path: '/home' },
    { name: 'Showcase', icon: ShoppingBag, path: '/home' },
    { name: 'Orders', icon: ListOrdered, path: '/supplier/orders' },
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
  const sidebarRole = profile?.role ? `${profile.role.charAt(0).toUpperCase()}${profile.role.slice(1)}` : 'Supplier';
  const sidebarAvatarSeed = encodeURIComponent(profile?.uid || user?.uid || user?.email || 'techlance-supplier');
  const sidebarAvatar = user?.photoURL || `https://picsum.photos/seed/${sidebarAvatarSeed}/150/150`;

  const toggleSidebarModal = (type: 'actors' | 'projects' | 'suppliers') => {
    // Implement toggle sidebar
  };

  const handleNextStory = () => {
    const currentIndex = stories.findIndex(s => s.name === activeStory.name);
    const nextIndex = (currentIndex + 1) % stories.length;
    setActiveStory(stories[nextIndex]);
  };

  return (
    <div className="h-screen w-full flex bg-slate-950 text-white overflow-hidden font-sans selection:bg-blue-500/30 relative">
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
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-blue-400 transition-colors shadow-lg">
            <img src={sidebarAvatar} alt={sidebarName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 min-w-0 z-10">
            <h3 className="font-bold text-white truncate text-base">{sidebarName}</h3>
            <p className="text-sm text-blue-400 font-medium truncate flex items-center gap-1">
              {sidebarRole} <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1 shadow-[0_0_5px_#22c55e]"></span>
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 flex flex-col gap-1.5 px-3 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  if (item.action === 'modal') {
                    setInfoModal({ isOpen: true, title: item.name, content: item.content });
                  } else {
                    setActiveMenu(item.name);
                    if (item.path && item.name !== 'Showcase' && item.name !== 'Home') navigate(item.path);
                  }
                  if (window.innerWidth < 1024) setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                  isActive ? 'bg-blue-600/10 text-blue-400 font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div layoutId="activeTabIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                )}
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : 'group-hover:text-slate-200 transition-colors drop-shadow-md'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Background Overlay for Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* TOP BAR */}
        <header className="h-[73px] bg-slate-900/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
          <div className="flex items-center flex-1">
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Search Bar */}
            <div className="relative w-full max-w-md ml-4 lg:ml-0 group hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                placeholder="Search..." 
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
                        <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden"><img src="https://picsum.photos/seed/s1/50/50" alt="User" /></div>
                        <div><p className="text-sm text-white">Alice Engineer</p><p className="text-xs text-slate-500">Hardware</p></div>
                      </div>
                      <div className="px-3 py-2 mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</div>
                      <div 
                        className="px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer"
                        onClick={() => navigate('/projects')}
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
              onClick={() => navigate('/post/1')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hidden sm:block"
            >
              Look-In
            </button>
            <button 
              onClick={() => { setActiveMenu('Home'); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors hidden sm:block"
            >
              Cuts
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="p-2.5 bg-slate-800/50 border border-white/5 text-slate-300 hover:text-white rounded-full hover:bg-slate-700/80 transition-all hidden md:block"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2.5 rounded-full bg-slate-800/50 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all shadow-sm"
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
                        { title: "New order received", time: "Just now", action: () => navigate('/orders') },
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
                      <button onClick={() => { setIsNotificationOpen(false); navigate('/orders'); }} className="text-sm text-blue-400 hover:text-blue-300 font-medium">View All</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden hover:border-blue-500/50 transition-all"
            >
              <img src="https://picsum.photos/seed/supplier/150/150" alt="Supplier" className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* CENTER FEED (Showcase / Home) */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
              
              {activeMenu === 'Home' ? (
                // FEED RENDER (Cuts, Posts, News)
                <>
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
                          <img src={story.thumbnail} alt={story.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-90" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-white text-sm font-bold truncate mb-1 shadow-sm">{story.title}</p>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
                                <img src={`https://picsum.photos/seed/user${i}/50/50`} alt={story.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <p className="text-slate-300 text-xs truncate font-medium">{story.name}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Main Feed Header */}
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

                  <div className="space-y-6">
                    {activeTab === 'feed' ? (
                      posts.map((post, i) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={post.id} 
                          className={`relative rounded-2xl p-[1px] bg-gradient-to-b from-white/10 to-transparent group transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10`} />
                          
                          <div className={`bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-transparent ${post.border} transition-colors duration-300 h-full`}>
                            {/* Post Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                                  <img src={`https://picsum.photos/seed/author${post.id}/100/100`} alt={post.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                                  onClick={() => navigate(`/post/${post.id}`)}
                                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10 transition-colors text-center"
                                >
                                  View Details
                                </button>
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
                </>
              ) : (
                // SHOWCASE RENDER
                <>
                  {/* SECTION 3: SUPPLIER PROFILE BLOCK */}
                  <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center md:items-start shadow-xl backdrop-blur-md">
                    <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-white/10 overflow-hidden shrink-0">
                      <img src="https://picsum.photos/seed/supplier/150/150" alt="Supplier" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h1 className="text-3xl font-bold text-white mb-2">Acme Supplies</h1>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-400 mb-4">
                        <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-blue-400" /> New Delhi, IN</div>
                        <div className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-yellow-400" /> 4.9 Rating</div>
                        <div className="flex items-center gap-1"><Briefcase className="w-4 h-4 text-green-400" /> 124 Completed Supplies</div>
                      </div>
                      <p className="text-slate-300 max-w-2xl">
                        Leading provider of custom CNC parts, 3D printing filaments, and IoT sensor modules. We deliver high-precision engineering components on time.
                      </p>
                    </div>
                  </div>

                  {/* HEADER for SECTION 1 & 2 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6 text-blue-400" /> Your Showcase
                    </h2>
                    {/* SECTION 2: ADD PRODUCT BUTTON */}
                    <button 
                      onClick={() => setIsAddProductOpen(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    >
                      <Plus className="w-4 h-4" /> Add Product
                    </button>
                  </div>

                  {/* SECTION 1: PRODUCT SHOWCASE GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {showcaseProductList.map(product => (
                      <motion.div 
                    key={product.id}
                    whileHover={{ y: -5 }}
                    className="bg-slate-900/60 border border-white/10 hover:border-blue-500/30 rounded-2xl overflow-hidden flex flex-col shadow-lg transition-all"
                  >
                    <div className="h-40 bg-slate-800 relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-medium text-white border border-white/10">
                        {product.stock}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-white leading-tight">{product.name}</h3>
                        <span className="text-blue-400 font-bold ml-2">${product.price}</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4 flex-1 line-clamp-2">{product.description}</p>
                      <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5">
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

            </div>
          </div>

          {/* RIGHT SIDEBAR (Look-In for Supply) */}
          <div className={`w-80 border-l border-white/10 bg-slate-900/40 backdrop-blur-xl flex-col hidden xl:flex`}>
            <div className="p-6 border-b border-white/10 bg-slate-900/60 flex items-center gap-3">
              <Search className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-white text-lg">Look-In for Supply</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              <p className="text-xs text-slate-400 px-2 font-medium uppercase tracking-wider mb-2">Current Demands</p>
              
              {lookInRequests.map(req => (
                <div key={req.id} className="p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-blue-500/30 transition-all group cursor-pointer" onClick={() => setSuggestModal({ isOpen: true, request: req })}>
                  <h3 className="font-bold text-white text-md mb-1">{req.component}</h3>
                  <div className="flex items-center flex-wrap gap-2 text-xs font-medium text-slate-400 mb-2">
                    <span className="px-2 py-1 rounded bg-slate-900 text-blue-300 border border-blue-900/50">Qty: {req.qty}</span>
                    <span className="px-2 py-1 rounded bg-slate-900 text-green-300 border border-green-900/50">{req.budget}</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3 line-clamp-2">{req.desc}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {req.location}</div>
                    <button className="text-blue-400 font-medium group-hover:underline">Suggest</button>
                  </div>
                </div>
              ))}
              
              {/* Trending Projects Link */}
              <div 
                onClick={() => navigate('/projects')}
                className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all cursor-pointer flex flex-col gap-2"
              >
                <h3 className="font-bold text-white text-md flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" /> Trending Projects</h3>
                <p className="text-xs text-slate-400">Discover and join highly active engineering projects across the community.</p>
              </div>

              {/* Join Groups Link */}
              <div 
                onClick={() => navigate('/messages')}
                className="mt-2 p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 hover:border-green-500/30 transition-all cursor-pointer flex flex-col gap-2"
              >
                <h3 className="font-bold text-white text-md flex items-center gap-2"><User className="w-4 h-4 text-green-400" /> Join Groups</h3>
                <p className="text-xs text-slate-400">Connect with other suppliers and engineers in focused discussion groups.</p>
              </div>

            </div>
          </div>
        </div>
      </main>

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
                  onNext={handleNextStory}
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
                    <img src={`https://picsum.photos/seed/user${activeStory.name}/100/100`} alt={activeStory.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                    onClick={handleNextStory}
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

      {/* MODALS */}
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

        {/* Add Product Modal */}
        {isAddProductOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddProductOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5 text-blue-400" /> Add Product</h3>
                <button onClick={() => setIsAddProductOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form className="space-y-5" onSubmit={handleAddProduct}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-slate-300 block mb-1.5">Product Name</label>
                      <input name="name" type="text" required className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300 block mb-1.5">Category</label>
                      <select name="category" required className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none">
                        <option>Electronics</option>
                        <option>Mechanical</option>
                        <option>IoT Modules</option>
                        <option>Tools</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300 block mb-1.5">Price ($)</label>
                      <input name="price" type="number" required className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300 block mb-1.5">Stock Quantity</label>
                      <input name="stock" type="number" required className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-1.5">Description</label>
                    <textarea name="description" required rows={4} className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 focus:border-blue-500 focus:outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 block mb-1.5">Upload Image</label>
                    <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-950/30 transition-colors cursor-pointer group">
                      <Upload className="w-8 h-8 text-slate-500 group-hover:text-blue-400 mb-3 transition-colors" />
                      <p className="text-sm text-slate-300 font-medium">Click to upload image</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                  <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-white/5">
                    <button type="button" onClick={() => setIsAddProductOpen(false)} className="px-6 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-medium transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20">Add Product</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Suggest Component Modal */}
        <InteractionModal 
          isOpen={suggestModal.isOpen}
          onClose={() => setSuggestModal({ isOpen: false, request: null })}
          mode="supplier"
          contextData={suggestModal.request}
        />
      </AnimatePresence>
    </div>
  );
}
