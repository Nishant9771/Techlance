import React from 'react';
import { motion } from 'motion/react';

type ParticleConfig = {
  left: string;
  top: string;
  opacity: number;
  scale: number;
  endTop: string;
  endLeft: string;
  duration: number;
};

function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const PARTICLE_CONFIGS: ParticleConfig[] = Array.from({ length: 30 }, (_, index) => {
  const base = index + 1;

  return {
    left: `${seededRandom(base * 1.1) * 100}%`,
    top: `${seededRandom(base * 1.7) * 100}%`,
    opacity: seededRandom(base * 2.3) * 0.5 + 0.2,
    scale: seededRandom(base * 2.9) * 2 + 0.5,
    endTop: `${seededRandom(base * 3.7) * -20}%`,
    endLeft: `calc(${seededRandom(base * 4.1) * 100}% + ${seededRandom(base * 4.7) * 40 - 20}px)`,
    duration: seededRandom(base * 5.3) * 10 + 10,
  };
});

export const Particles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLE_CONFIGS.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/40 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]"
          initial={{
            left: particle.left,
            top: particle.top,
            opacity: particle.opacity,
            scale: particle.scale,
          }}
          animate={{
            top: [null, particle.endTop],
            left: [null, particle.endLeft],
            opacity: [null, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export const TechBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950">
      {/* Deep gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-slate-950" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15]" />
      
      {/* Glowing orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-purple-600/20 rounded-full blur-[120px]"
      />

      <Particles />
    </div>
  );
};
