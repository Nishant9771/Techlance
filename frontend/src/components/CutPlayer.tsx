import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSmartImage, getSmartVideo } from '@/utils/assetManager';

interface CutPlayerProps {
  story: any;
  onNext: () => void;
  isActive: boolean;
}

export const CutPlayer: React.FC<CutPlayerProps> = ({ story, onNext, isActive }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [vidIndex, setVidIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto-play when active
  useEffect(() => {
    if (isActive) {
      if (story.type === 'video' && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else if (story.type === 'audio' && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
    }
  }, [isActive, story]);

  // Handle progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive) {
      interval = setInterval(() => {
        if (story.type === 'video' && videoRef.current) {
          const p = (videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100;
          setProgress(p);
          if (p >= 100) onNext();
        } else if (story.type === 'audio' && audioRef.current) {
          const p = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
          setProgress(p);
          if (p >= 100) onNext();
        } else if (story.type === 'image') {
           // For images, fake a 5 second progress
           setProgress(p => {
             if (p >= 100) {
               onNext();
               return 0;
             }
             return p + (100 / (5 * 20)); // 5 seconds at 20fps
           });
        }
      }, 50);
    }
    
    return () => clearInterval(interval);
  }, [isActive, story, onNext]);

  useEffect(() => {
    const v = setInterval(() => {
      setVidIndex((prev) => (prev + 1) % 5);
    }, 10000);
    return () => clearInterval(v);
  }, []);


  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (story.type === 'video' && videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    } else if (story.type === 'audio' && audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950 flex flex-col items-center justify-center group overflow-hidden">
      
      {/* Media Rendering */}
      {story.type === 'video' ? (
        <video 
          ref={videoRef}
          src={getSmartVideo(vidIndex)} 
          autoPlay
          loop
          className="w-full h-full object-cover"
          muted={isMuted}
          playsInline
          poster={story.thumbnail}
        />
      ) : story.type === 'audio' ? (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
           <img src={getSmartImage("cuts")} alt="Audio Cover" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
           <div className="relative z-10 w-48 h-48 rounded-full overflow-hidden border-4 border-blue-500/50 flex flex-col items-center justify-center bg-slate-900 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
             <img src={getSmartImage("cuts")} alt="Audio Cover" className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`} />
             <audio ref={audioRef} src={story.audioUrl || "https://www.w3schools.com/html/horse.mp3"} muted={isMuted} />
           </div>
           <div className="relative z-10 mt-8 flex space-x-1">
             {[...Array(10)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={isPlaying ? { height: [10, 40, 10] } : { height: 10 }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  className="w-2 bg-blue-500 rounded-full" 
                />
             ))}
           </div>
        </div>
      ) : (
        <img src={getSmartImage("cuts")} alt={story.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      )}

      {/* Overlay Player Controls */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Center Play/Pause Indicator (Fades out) */}
      <AnimatePresence>
        {!isPlaying && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.5 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 1.5 }}
             className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
           >
             <div className="w-20 h-20 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-white ml-2" />
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-10" onClick={togglePlay} />

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
         {/* Progress Bar */}
         <div className="w-full h-1 bg-white/20 rounded-full mb-4 overflow-hidden backdrop-blur-sm cursor-pointer relative" onClick={(e) => {
             e.stopPropagation();
             const bounds = e.currentTarget.getBoundingClientRect();
             const p = ((e.clientX - bounds.left) / bounds.width) * 100;
             setProgress(p);
             if (story.type === 'video' && videoRef.current) {
                videoRef.current.currentTime = (videoRef.current.duration * p) / 100;
             }
             if (story.type === 'audio' && audioRef.current) {
                audioRef.current.currentTime = (audioRef.current.duration * p) / 100;
             }
         }}>
            <div className="h-full bg-blue-500 rounded-full transition-all duration-75" style={{ width: `${progress}%` }} />
         </div>

         {/* Actions */}
         <div className="flex items-center justify-between">
            <button onClick={togglePlay} className="p-2 text-white hover:text-blue-400 transition-colors">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            
            <button onClick={toggleMute} className="p-2 text-white hover:text-blue-400 transition-colors">
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
         </div>
      </div>
    </div>
  );
};
