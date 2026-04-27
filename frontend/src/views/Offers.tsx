import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from '@/lib/router';
import { useRole } from '../context/RoleContext';
import { useAuth } from '@/context/AuthContext';
import { setOfferStatus, subscribeOffers, type LiveOffer } from '@/lib/liveData';
import { detectFraud } from '@/lib/vertexClient';
import { 
  ArrowLeft, 
  Star, 
  DollarSign, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  XCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { TechBackground } from '../components/TechBackground';

type OfferFraudState = {
  loading: boolean;
  result: any | null;
  error?: string;
};

function fraudBandClasses(band: string) {
  if (band === 'High') {
    return 'bg-red-500/10 border-red-500/30 text-red-300';
  }
  if (band === 'Medium') {
    return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
  }
  return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
}

function flattenFraudReasons(reasons: any) {
  if (!reasons || typeof reasons !== 'object') {
    return [] as string[];
  }

  return (Object.values(reasons) as unknown[])
    .flatMap((value) => (Array.isArray(value) ? value : []))
    .filter(Boolean)
    .map((item) => String(item));
}

// Mock Offers Data
const initialOffers = [
  {
    id: 101,
    actorName: 'Elena Rodriguez',
    rating: 4.9,
    reviews: 124,
    proposedPrice: '$6,500',
    timeline: '6 Weeks',
    message: 'Hi! I have extensive experience with ESP32 and MQTT. I recently built a similar smart home hub for a European client. I can deliver the firmware and PCB schematics within 6 weeks. Let me know if you want to discuss details.',
    timeAgo: '2 hours ago',
    avatar: 'https://picsum.photos/seed/elena/100/100',
    match: '98%'
  },
  {
    id: 102,
    actorName: 'Marcus Chen',
    rating: 4.7,
    reviews: 89,
    proposedPrice: '$5,200',
    timeline: '8 Weeks',
    message: 'I specialize in low-power IoT devices. I can handle the firmware architecture and optimize it for battery life. My timeline is a bit longer to ensure rigorous testing of the MQTT communication layer.',
    timeAgo: '5 hours ago',
    avatar: 'https://picsum.photos/seed/marcus/100/100',
    match: '92%'
  },
  {
    id: 103,
    actorName: 'IoT Solutions Ltd.',
    rating: 4.5,
    reviews: 312,
    proposedPrice: '$8,000',
    timeline: '4 Weeks',
    message: 'We are a team of 3 engineers. We can fast-track your prototype and deliver a production-ready design in 4 weeks. Price is firm due to the expedited timeline.',
    timeAgo: '1 day ago',
    avatar: 'https://picsum.photos/seed/agency/100/100',
    match: '85%'
  }
];

function formatLiveOffer(offer: LiveOffer) {
  return {
    id: offer.id,
    actorName: offer.senderName,
    rating: 0,
    reviews: 0,
    proposedPrice: offer.amount,
    timeline: offer.timeline,
    message: offer.message,
    timeAgo: 'Live now',
    avatar: `https://picsum.photos/seed/${offer.senderId}/100/100`,
    match: 'Live',
    status: offer.status,
  };
}

export default function Offers() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { user } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const [fraudByOffer, setFraudByOffer] = useState<Record<string, OfferFraudState>>({});

  useEffect(() => {
    if (!user) {
      setOffers([]);
      setFraudByOffer({});
      return;
    }

    const unsubscribe = subscribeOffers(
      user,
      role,
      (liveOffers) => {
        setOffers(liveOffers.filter((offer) => offer.status !== 'rejected').map(formatLiveOffer));
      },
      (error) => {
        console.warn('Unable to load live offers.', error);
        setOffers([]);
      },
    );

    return unsubscribe;
  }, [role, user]);

  const scanOfferFraud = async (offer: any) => {
    const key = String(offer.id);

    setFraudByOffer((prev) => ({
      ...prev,
      [key]: {
        loading: true,
        result: prev[key]?.result || null,
      },
    }));

    try {
      const offerText = String(offer.message || '');
      const offPlatformSignal = /(whatsapp|telegram|signal|outside platform|off-platform|@\w+\.com)/i.test(offerText) ? 2 : 0;
      const paymentRiskSignal = /(crypto|gift card|wire transfer|advance payment|upfront)/i.test(offerText) ? 1 : 0;

      const response = await detectFraud({
        expert: {
          displayName: offer.actorName,
          rating: offer.rating,
          reviewsCount: offer.reviews,
          bio: offer.message,
          skills: [],
          accountAgeDays: offer.timeAgo === 'Live now' ? 30 : 180,
        },
        review: {
          text: offer.message,
          rating: offer.rating,
          verified: role !== 'actor',
        },
        proposal: {
          title: offer.actorName,
          message: offer.message,
          workPlan: offer.message,
          amount: offer.proposedPrice,
          timeline: offer.timeline,
        },
        behavior: {
          offPlatformPaymentMentions: paymentRiskSignal,
          externalContactAttempts: offPlatformSignal,
          failedPayments: 0,
          chargebacks: 0,
          disputes: 0,
          rapidBidCount24h: 0,
        },
      });

      if (response?.error) {
        throw new Error(String(response.error));
      }

      setFraudByOffer((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          result: response,
        },
      }));
    } catch (fraudError) {
      const message = fraudError instanceof Error ? fraudError.message : 'Failed to scan fraud risk.';
      setFraudByOffer((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          result: null,
          error: message,
        },
      }));
    }
  };

  useEffect(() => {
    if (role === 'actor') {
      return;
    }

    const unseen = offers.filter((offer) => !fraudByOffer[String(offer.id)]);
    unseen.slice(0, 4).forEach((offer) => {
      void scanOfferFraud(offer);
    });
  }, [offers, role, fraudByOffer]);

  const handleAccept = async (id: string | number) => {
    setProcessingId(id);
    setActionType('accept');

    if (typeof id === 'string') {
      await setOfferStatus(id, 'accepted');
    }
    
    // Navigate to contract creation/view
    navigate(`/contract/${id}`);
  };

  const handleReject = async (id: string | number) => {
    setProcessingId(id);
    setActionType('reject');

    if (typeof id === 'string') {
      await setOfferStatus(id, 'rejected');
    }
    
    // Remove offer from list
    setOffers(offers.filter(offer => offer.id !== id));
    setProcessingId(null);
    setActionType(null);
  };

  const handleChat = (id: string | number) => {
    // Navigate to messages
    navigate('/messages');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white font-sans selection:bg-blue-500/30 relative overflow-y-auto">
      <div className="fixed inset-0 z-0">
        <TechBackground />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/home')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {role === 'actor' ? 'Work List' : 'Offers Received'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {role === 'actor' ? 'Manage requests from users' : 'Manage proposals for your projects'}
              </p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
            {offers.length} {role === 'actor' ? 'Requests' : 'Active Offers'}
          </div>
        </div>

        {/* Offers List */}
        <div className="space-y-6">
          <AnimatePresence>
            {offers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl"
              >
                <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-slate-300">
                  {role === 'actor' ? 'No active requests' : 'No active offers'}
                </h3>
                <p className="text-slate-500 mt-2">
                  {role === 'actor' ? 'You have processed all your user requests.' : 'You have processed all your received offers.'}
                </p>
              </motion.div>
            ) : (
              offers.map((offer, index) => (
                <motion.div 
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden group"
                >
                  {/* Subtle gradient hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="flex flex-col lg:flex-row gap-6 relative z-10">
                    {/* Left Column: Actor Info */}
                    <div className="flex-shrink-0 flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:w-48">
                      <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden flex-shrink-0">
                        <img src={offer.avatar} alt={offer.actorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{offer.actorName}</h3>
                        {role !== 'actor' && (
                          <>
                            <div className="flex items-center gap-1.5 mt-1 text-sm text-amber-400">
                              <Star className="w-4 h-4 fill-amber-400" />
                              <span className="font-medium">{offer.rating}</span>
                              <span className="text-slate-500">({offer.reviews})</span>
                            </div>
                            <div className="mt-2 inline-block px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                              {offer.match} Match
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Middle Column: Offer Details */}
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap gap-4">
                        <div className="px-4 py-2 rounded-xl bg-slate-950/50 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                            {role === 'actor' ? 'Budget' : 'Proposed Price'}
                          </p>
                          <p className="text-lg font-semibold text-emerald-400 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {offer.proposedPrice}
                          </p>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-slate-950/50 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Timeline</p>
                          <p className="text-lg font-semibold text-blue-400 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {offer.timeline}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                        "{offer.message}"
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs text-slate-500">{offer.timeAgo}</p>
                        {fraudByOffer[String(offer.id)]?.loading && (
                          <span className="text-[11px] px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300">
                            Scanning fraud risk...
                          </span>
                        )}
                        {fraudByOffer[String(offer.id)]?.result?.band && (
                          <span
                            className={`text-[11px] px-2 py-1 rounded-md border ${fraudBandClasses(String(fraudByOffer[String(offer.id)]?.result?.band))}`}
                          >
                            {String(fraudByOffer[String(offer.id)]?.result?.band)} risk • {Math.round(Number(fraudByOffer[String(offer.id)]?.result?.overallRisk || 0) * 100)}%
                          </span>
                        )}
                      </div>

                      {fraudByOffer[String(offer.id)]?.result?.reasons && (
                        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                          <p className="text-xs font-semibold text-slate-300 mb-1.5">Fraud Signals</p>
                          <ul className="space-y-1 text-xs text-slate-400">
                            {flattenFraudReasons(fraudByOffer[String(offer.id)]?.result?.reasons).slice(0, 2).map((reason) => (
                              <li key={reason}>• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {fraudByOffer[String(offer.id)]?.error && (
                        <p className="text-xs text-red-400">{fraudByOffer[String(offer.id)]?.error}</p>
                      )}
                    </div>

                    {/* Right Column: Actions */}
                    <div className="flex flex-row lg:flex-col gap-3 lg:w-40 flex-shrink-0 pt-2 lg:pt-0 border-t border-white/10 lg:border-t-0 lg:border-l lg:pl-6">
                      <button 
                        onClick={() => handleAccept(offer.id)}
                        disabled={processingId !== null}
                        className="flex-1 lg:flex-none py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processingId === offer.id && actionType === 'accept' ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Accept
                          </>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => handleChat(offer.id)}
                        disabled={processingId !== null}
                        className="flex-1 lg:flex-none py-2.5 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                      </button>

                      <button
                        onClick={() => scanOfferFraud(offer)}
                        disabled={processingId !== null || fraudByOffer[String(offer.id)]?.loading}
                        className="flex-1 lg:flex-none py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {fraudByOffer[String(offer.id)]?.loading ? (
                          <div className="w-4 h-4 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShieldAlert className="w-4 h-4" />
                            Risk Scan
                          </>
                        )}
                      </button>

                      <button 
                        onClick={() => handleReject(offer.id)}
                        disabled={processingId !== null}
                        className="flex-1 lg:flex-none py-2.5 px-4 rounded-xl bg-slate-800/50 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-400 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processingId === offer.id && actionType === 'reject' ? (
                          <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
