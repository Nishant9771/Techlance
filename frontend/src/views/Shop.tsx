import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from '@/lib/router';
import { 
  Home as HomeIcon, 
  FolderKanban, 
  MessageSquare, 
  Settings, 
  Search, 
  Bell, 
  User,
  ShoppingBag,
  Briefcase,
  ChevronLeft,
  Filter,
  Star,
  MapPin,
  ShoppingCart,
  X,
  Plus,
  Edit2,
  Trash2,
  Upload
} from 'lucide-react';
import { TechBackground } from '../components/TechBackground';
import { products, suggestedProjects, supplierAds } from '../data/dummyData';
import { useRole } from '../context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { getSmartImage, getNextIndex } from '@/utils/assetManager';
import { createProduct, deleteProduct, subscribeProducts } from '@/lib/liveData';

export default function Shop() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { user, profile } = useAuth();
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImgIndex((prev) => getNextIndex(prev, 10));
    }, 10000);

    return () => clearInterval(interval);
  }, []);
  const [activeMenu, setActiveMenu] = useState('Shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState(150);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [liveProducts, setLiveProducts] = useState<any[]>([]);

  const categories = ['All', 'Electronics', 'IoT Modules', 'Mechanical Parts', 'Sensors', 'Tools'];

  useEffect(() => {
    const unsubscribe = subscribeProducts(
      (items) => setLiveProducts(items),
      (error) => {
        console.warn('Unable to load live products.', error);
        setLiveProducts([]);
      },
    );

    return unsubscribe;
  }, []);

  const allProducts = [...liveProducts, ...products];

  const filteredProducts = allProducts.filter(p => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchPrice = p.price <= priceRange;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchPrice && matchSearch;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const addToCart = (product: any) => {
    setCart([...cart, product]);
    showToast('Added to cart');
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckoutOpen(false);
    setCart([]);
    showToast('Order placed (Prototype)');
  };

  // Supplier specific states
  const [supplierProducts, setSupplierProducts] = useState(products.slice(0, 3));
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const supplierProductList = [
    ...liveProducts.filter((product) => product.supplierId === user?.uid),
    ...supplierProducts,
  ];

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      showToast('Please sign in first');
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
      showToast('Product added live');
    } catch {
      showToast('Unable to add product. Check Firebase rules.');
    }
  };

  const menuItems = [
    { name: 'Home', icon: HomeIcon, path: '/home' },
    { name: 'Projects', icon: FolderKanban, path: '/projects' },
    { name: 'Work List', icon: Briefcase, path: '/offers' },
    { name: 'Shop', icon: ShoppingBag, path: '/shop' },
    { name: 'Messages', icon: MessageSquare, path: '/messages' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="h-screen w-full flex bg-slate-950 text-white overflow-hidden font-sans selection:bg-blue-500/30 relative">
      <div className="absolute inset-0 z-0">
        <TechBackground />
      </div>

      {/* LEFT SIDEBAR */}
      <aside className="w-[80px] lg:w-[240px] h-screen bg-slate-900/80 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 z-40 shrink-0">
        <div className="h-[73px] flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <span className="font-bold text-xl tracking-tighter">A</span>
          </div>
          <span className="ml-3 font-bold text-xl tracking-tight hidden lg:block bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Antigravity
          </span>
        </div>
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveMenu(item.name);
                  if (item.path) navigate(item.path);
                }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                  isActive ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : 'group-hover:text-slate-200 transition-colors'}`} />
                <span className="font-medium hidden lg:block">{item.name}</span>
                {isActive && (
                  <motion.div layoutId="activeTab" className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* TOP BAR */}
        <header className="h-[73px] bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search products, suppliers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {cart.length}
                </span>
              )}
            </button>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] cursor-pointer ml-2">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                <User className="w-5 h-5 text-slate-300" />
              </div>
            </div>
          </div>
        </header>

        {/* SHOP LAYOUT */}
        <div className="flex-1 overflow-hidden flex">
          
          {role === 'supplier' ? (
            // SUPPLIER DASHBOARD
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-white">Manage Your Shop</h1>
                  <button 
                    onClick={() => setIsAddProductOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>

                {/* Dummy Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-white">$12,450</p>
                  </div>
                  <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Active Orders</h3>
                    <p className="text-3xl font-bold text-white">8</p>
                  </div>
                  <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Products Listed</h3>
                    <p className="text-3xl font-bold text-white">{supplierProductList.length}</p>
                  </div>
                </div>

                {/* Your Products */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">Your Products</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supplierProductList.map((p, i) => (
                      <div key={p.id} className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex gap-4">
                        <img src={getSmartImage("shop", imgIndex + i)} alt={p.name} className="w-20 h-20 rounded-lg object-cover" />
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-white line-clamp-1">{p.name}</h3>
                          <p className="text-blue-400 font-medium text-sm mt-1">${p.price}</p>
                          <div className="flex gap-2 mt-3">
                            <button className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (typeof p.id === 'string') {
                                  void deleteProduct(p.id);
                                } else {
                                  setSupplierProducts(supplierProducts.filter((item) => item.id !== p.id));
                                }
                              }}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Orders */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">Recent Orders</h2>
                  <div className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-800/50 text-slate-400">
                        <tr>
                          <th className="px-6 py-3 font-medium">Order ID</th>
                          <th className="px-6 py-3 font-medium">Product</th>
                          <th className="px-6 py-3 font-medium">Customer</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <td className="px-6 py-4 text-white">#ORD-001</td>
                          <td className="px-6 py-4 text-slate-300">ESP32 Development Board</td>
                          <td className="px-6 py-4 text-slate-300">John Doe</td>
                          <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-xs">Pending</span></td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-white">#ORD-002</td>
                          <td className="px-6 py-4 text-slate-300">Arduino Uno R3 Kit</td>
                          <td className="px-6 py-4 text-slate-300">Jane Smith</td>
                          <td className="px-6 py-4"><span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">Completed</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // USER / ACTOR SHOP
            <>
              {/* LEFT FILTER PANEL */}
              <div className="w-[240px] border-r border-white/10 bg-slate-900/50 p-6 overflow-y-auto scrollbar-hide hidden md:block shrink-0">
                <div className="flex items-center gap-2 mb-6 text-white font-bold">
                  <Filter className="w-4 h-4" /> Filters
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Categories</h3>
                    <div className="space-y-2">
                      {categories.map(cat => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="category" 
                            checked={selectedCategory === cat}
                            onChange={() => setSelectedCategory(cat)}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedCategory === cat ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600 group-hover:border-slate-400'}`}>
                            {selectedCategory === cat && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                          </div>
                          <span className={`text-sm ${selectedCategory === cat ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-300'}`}>{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Max Price: ${priceRange}</h3>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      value={priceRange}
                      onChange={(e) => setPriceRange(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Location</h3>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                      <option>Any Location</option>
                      <option>San Jose, CA</option>
                      <option>Austin, TX</option>
                      <option>Seattle, WA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PRODUCT GRID */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product, i) => (
                    <div key={product.id} className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group flex flex-col">
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
                        <img src={getSmartImage("shop", imgIndex + i)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        {product.badge && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                            {product.badge}
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-white line-clamp-1 flex-1 pr-2">{product.name}</h3>
                          <span className="text-blue-400 font-bold">${product.price}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3 flex-1">{product.description}</p>
                        
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-slate-300 font-medium">{product.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[80px]">{product.location}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <button 
                            onClick={() => setSelectedProduct(product)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors"
                          >
                            Details
                          </button>
                          <button 
                            onClick={() => addToCart(product)}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT INFO PANEL */}
              <div className="w-[300px] border-l border-white/10 bg-slate-900/50 p-6 overflow-y-auto scrollbar-hide hidden xl:block shrink-0">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4">Recommended For You</h3>
                    <div className="space-y-3">
                      {allProducts.slice(0, 3).map((p, i) => (
                        <div key={p.id} className="flex gap-3 items-center p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors" onClick={() => setSelectedProduct(p)}>
                          <img src={getSmartImage("shop", imgIndex + i)} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <h4 className="text-xs font-bold text-white line-clamp-1">{p.name}</h4>
                            <p className="text-blue-400 text-xs font-medium">${p.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/5">
                        <MapPin className="w-4 h-4" /> Find Local Supplier
                      </button>
                      <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/5">
                        <Settings className="w-4 h-4" /> Request Custom Part
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg z-[200] font-medium text-sm"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/10 z-[110] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Your Cart
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <ShoppingCart className="w-12 h-12 mb-4 opacity-50" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((item, i) => (
                    <div key={i} className="flex gap-4 bg-slate-800/50 p-3 rounded-xl border border-white/5">
                      <img src={getSmartImage("shop", imgIndex)} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-slate-400">{item.supplier}</p>
                        <p className="text-blue-400 font-bold mt-1">${item.price}</p>
                      </div>
                      <button 
                        onClick={() => setCart(cart.filter((_, index) => index !== i))}
                        className="text-slate-500 hover:text-red-400 transition-colors self-start p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-slate-800/50 space-y-4">
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span>${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
                  >
                    Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CHECKOUT MODAL */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCheckoutOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                <h3 className="text-lg font-bold text-white">Checkout</h3>
                <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCheckout} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Full Name</label>
                  <input type="text" required className="w-full mt-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Shipping Address</label>
                  <textarea required rows={3} className="w-full mt-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 focus:border-blue-500 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Phone Number</label>
                  <input type="tel" required className="w-full mt-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 focus:border-blue-500 focus:outline-none" />
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors mt-4">
                  Place Order (${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)})
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRODUCT DETAILS MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-4xl max-h-full bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-full md:w-1/2 bg-slate-800 relative">
                <img src={getSmartImage("shop", imgIndex)} alt={selectedProduct.name} className="w-full h-full object-cover min-h-[300px]" />
              </div>
              
              <div className="w-full md:w-1/2 p-8 overflow-y-auto flex flex-col">
                <div className="mb-2 text-blue-400 text-xs font-bold uppercase tracking-wider">{selectedProduct.category}</div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedProduct.name}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                  <div className="flex items-center gap-1 text-yellow-500"><Star className="w-4 h-4 fill-yellow-500" /> {selectedProduct.rating}</div>
                  <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedProduct.location}</div>
                  <div className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {selectedProduct.supplier}</div>
                </div>
                
                <p className="text-slate-300 mb-6 leading-relaxed">{selectedProduct.description}</p>
                
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-white mb-3">Specifications</h3>
                  <ul className="space-y-2">
                    {selectedProduct.specs.map((spec: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {spec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between gap-4">
                  <div className="text-3xl font-bold text-white">${selectedProduct.price}</div>
                  <div className="flex gap-3">
                    {role === 'actor' && (
                      <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors">
                        Contact Supplier
                      </button>
                    )}
                    <button 
                      onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUPPLIER ADD PRODUCT MODAL */}
      <AnimatePresence>
        {isAddProductOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddProductOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl max-h-full bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                <h3 className="text-xl font-bold text-white">Add New Product</h3>
                <button onClick={() => setIsAddProductOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form className="space-y-4" onSubmit={handleAddProduct}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-300">Product Name</label>
                      <input name="name" type="text" required className="w-full mt-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300">Category</label>
                      <select name="category" className="w-full mt-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 focus:border-blue-500 focus:outline-none">
                        {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300">Price ($)</label>
                      <input name="price" type="number" required className="w-full mt-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300">Stock Quantity</label>
                      <input name="stock" type="number" required className="w-full mt-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 focus:border-blue-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Description</label>
                    <textarea name="description" required rows={4} className="w-full mt-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 focus:border-blue-500 focus:outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Product Image</label>
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-800/30 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <p className="text-sm text-slate-400">Click to upload image</p>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAddProductOpen(false)} className="px-6 py-2 rounded-xl text-slate-300 hover:bg-white/5">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl">Add Product</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
