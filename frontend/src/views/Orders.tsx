import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from '@/lib/router';
import { 
  ArrowLeft,
  Search,
  Package,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  Box,
  X,
  CreditCard,
  User as UserIcon
} from 'lucide-react';
import { TechBackground } from '../components/TechBackground';

const initialOrders = [
  { id: 'ORD-5231', product: 'ESP32 Dev Board', qty: 20, customer: 'Rahul Sharma', location: 'Bangalore', type: 'Direct Order', date: '2026-04-20', status: 'Pending' },
  { id: 'ORD-5232', product: 'CNC Aluminum Frame', qty: 5, customer: 'TechCorp', location: 'Chennai', type: 'Contract Supply', date: '2026-04-12', status: 'Delivered' },
  { id: 'ORD-5233', product: 'Drilling Machine', qty: 1, customer: 'Workshop Pvt Ltd', location: 'Mumbai', type: 'Direct Order', date: '2026-04-15', status: 'Shipped' },
  { id: 'ORD-5234', product: 'Raspberry Pi 5', qty: 2, customer: 'Ananya S.', location: 'Delhi', type: 'Direct Order', date: '2026-04-21', status: 'Pending' },
  { id: 'ORD-5235', product: 'NEMA 17 Stepper', qty: 10, customer: 'RoboLabs', location: 'Pune', type: 'Contract Supply', date: '2026-04-18', status: 'Shipped' },
  { id: 'ORD-5236', product: 'IoT Sensor Bundle', qty: 50, customer: 'GreenTech Agri', location: 'Hyderabad', type: 'Direct Order', date: '2026-04-25', status: 'Pending' },
  { id: 'ORD-5237', product: 'High-Temp Filament', qty: 15, customer: 'Build3D', location: 'Bangalore', type: 'Contract Supply', date: '2026-04-10', status: 'Delivered' },
  { id: 'ORD-5238', product: 'Custom PCB Board', qty: 100, customer: 'ElectroHub', location: 'Chennai', type: 'Contract Supply', date: '2026-04-28', status: 'Pending' },
  { id: 'ORD-5239', product: 'Li-ion Battery Pack', qty: 30, customer: 'EV Motors', location: 'Coimbatore', type: 'Direct Order', date: '2026-04-16', status: 'Shipped' },
  { id: 'ORD-5240', product: 'Arduino Mega Kit', qty: 8, customer: 'Student Group X', location: 'Kochi', type: 'Direct Order', date: '2026-04-11', status: 'Delivered' },
];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof initialOrders[0] | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const filteredOrders = orders.filter(
    o => o.product.toLowerCase().includes(searchQuery.toLowerCase()) || 
         o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
         o.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    // Update local state to reflect 'Shipped'
    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'Shipped' } : o));
    
    // Show success message briefly before closing
    setDispatchSuccess(true);
    setTimeout(() => {
      setDispatchSuccess(false);
      setDispatchModalOpen(false);
      setSelectedOrder(null);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'Shipped': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'Delivered': return 'text-green-400 bg-green-400/10 border-green-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Pending': return <Clock className="w-3.5 h-3.5" />;
      case 'Shipped': return <Truck className="w-3.5 h-3.5" />;
      case 'Delivered': return <CheckCircle2 className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-white overflow-hidden font-sans selection:bg-blue-500/30 relative">
      <div className="absolute inset-0 z-0">
        <TechBackground />
      </div>

      <div className="relative z-10 w-full flex flex-col h-full">
        {/* HEADER */}
        <header className="h-[73px] bg-slate-900/40 backdrop-blur-xl border-b border-white/10 flex items-center px-4 sm:px-6 shrink-0 sticky top-0 z-40">
          <button 
            onClick={() => navigate('/home')}
            className="p-2 mr-4 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Orders Management</h1>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/60 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="relative w-full sm:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <Search className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders, products, or customers..." 
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-slate-700 transition-all placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <select className="flex-1 sm:w-auto bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
                <select className="flex-1 sm:w-auto bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="All">All Types</option>
                  <option value="Direct">Direct Order</option>
                  <option value="Contract">Contract Supply</option>
                </select>
              </div>
            </div>

            {/* Orders Table/List */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl hidden lg:block">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-medium rounded-tl-2xl">Order ID</th>
                    <th className="px-6 py-4 font-medium">Product & Qty</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Type & Location</th>
                    <th className="px-6 py-4 font-medium">Delivery Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right rounded-tr-2xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-blue-400">{order.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{order.product}</p>
                        <p className="text-xs text-slate-500 mt-1">Qty: <span className="text-slate-300">{order.qty}</span></p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-slate-500" />
                          <span>{order.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-300 mb-1">{order.type}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.location}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          {order.date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors">
                            View Details
                          </button>
                          {order.status === 'Pending' && (
                            <button 
                              onClick={() => { setSelectedOrder(order); setDispatchModalOpen(true); }}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors border border-transparent"
                            >
                              Send Order
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No orders found matching your search.</p>
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-mono text-xs font-medium text-blue-400 mb-1 block">{order.id}</span>
                      <h3 className="font-bold text-white leading-tight">{order.product}</h3>
                      <p className="text-sm text-slate-400 mt-1">Qty: <span className="text-white">{order.qty}</span></p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><UserIcon className="w-3 h-3" /> Customer</p>
                      <p className="font-medium text-slate-300">{order.customer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</p>
                      <p className="font-medium text-slate-300">{order.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Box className="w-3 h-3" /> Type</p>
                      <p className="font-medium text-slate-300">{order.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Delivery Date</p>
                      <p className="font-medium text-slate-300">{order.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                    <button className="flex-1 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors">
                      View Details
                    </button>
                    {order.status === 'Pending' && (
                      <button 
                        onClick={() => { setSelectedOrder(order); setDispatchModalOpen(true); }}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors border border-transparent shadow-lg shadow-blue-500/20"
                      >
                        Send Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>

      {/* DISPATCH MODAL */}
      <AnimatePresence>
        {dispatchModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => !dispatchSuccess && setDispatchModalOpen(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl"
            >
              {dispatchSuccess ? (
                <div className="p-10 flex flex-col items-center justify-center text-center">
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
                    className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Order Dispatched!</h3>
                  <p className="text-slate-400">Order {selectedOrder.id} has been marked as shipped successfully.</p>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-400" /> 
                      Dispatch Order
                    </h3>
                    <button 
                      onClick={() => setDispatchModalOpen(false)} 
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-sm text-blue-400">{selectedOrder.id}</span>
                        <span className="text-sm font-semibold text-white">{selectedOrder.product}</span>
                      </div>
                      <p className="text-xs text-slate-400">Deliver to: <span className="text-slate-300">{selectedOrder.customer} ({selectedOrder.location})</span></p>
                    </div>

                    <form onSubmit={handleDispatchSubmit} className="space-y-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300 block">Select Delivery Mode</label>
                        <select required className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="">Select mode...</option>
                          <option value="Parcel">Parcel Service</option>
                          <option value="Ecommerce">E-commerce Delivery</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300 block">Courier Name</label>
                        <input type="text" required placeholder="e.g. BlueDart, FedEx" className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300 block">Tracking ID</label>
                        <input type="text" required placeholder="e.g. TRK9876543210" className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 font-mono text-sm" />
                      </div>
                      
                      <div className="pt-4 mt-2">
                        <button 
                          type="submit"
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                        >
                          <Truck className="w-5 h-5" />
                          Dispatch Order
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
