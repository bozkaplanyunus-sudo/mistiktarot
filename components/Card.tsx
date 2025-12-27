
import React from 'react';
import { motion } from 'framer-motion';
import { TarotCard } from '../types';

interface CardProps {
  card?: TarotCard;
  isFlipped: boolean;
  isReversed?: boolean;
  positionName?: string;
  onClick?: () => void;
  className?: string;
  delay?: number;
}

const Card: React.FC<CardProps> = ({ 
  card, 
  isFlipped, 
  isReversed = false, 
  positionName, 
  onClick,
  className = "",
  delay = 0
}) => {
  return (
    <motion.div 
      initial={{ y: 50, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`relative w-28 h-48 md:w-40 md:h-64 perspective-1000 cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <div className={`card-inner relative w-full h-full duration-700 ${isFlipped ? 'card-flipped' : ''}`}>
        {/* Card Back */}
        <div className="card-back absolute inset-0 bg-slate-900 border-2 border-amber-600/50 rounded-lg flex items-center justify-center overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/30 via-transparent to-transparent"></div>
          <div className="text-amber-600/20 text-5xl">✧</div>
          <div className="absolute inset-1 border border-amber-600/20 rounded"></div>
        </div>

        {/* Card Front */}
        <div className={`card-front absolute inset-0 bg-white rounded-lg overflow-hidden border-2 border-amber-400 shadow-2xl ${isReversed ? 'rotate-180' : ''}`}>
          {card && (
            <div className="relative h-full w-full flex flex-col">
              <img src={card.imageUrl} alt={card.name} className="flex-1 object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-500" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-amber-200 py-1 px-2 text-center text-[10px] md:text-xs font-cinzel">
                {card.name}
              </div>
            </div>
          )}
        </div>
      </div>
      {positionName && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
          className="mt-2 text-center text-[10px] md:text-xs font-cinzel text-amber-500/80 uppercase tracking-tighter bg-black/60 py-1 rounded-full px-2"
        >
          {positionName}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Card;
