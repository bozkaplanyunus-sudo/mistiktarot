
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TarotCard, DeckType, Language } from '../types';

interface CardProps {
  card?: TarotCard;
  isFlipped: boolean;
  isReversed?: boolean;
  positionName?: string;
  onClick?: () => void;
  className?: string;
  delay?: number;
  lang?: Language;
}

const Card: React.FC<CardProps> = ({ 
  card, 
  isFlipped, 
  isReversed = false, 
  positionName, 
  onClick,
  className = "",
  delay = 0,
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (card?.imageUrl) {
      setCurrentSrc(card.imageUrl);
      setIsLoading(true);
      setIsError(false);
    }
  }, [card]);

  const handleImgError = () => {
    if (!card || isError) return;
    
    // Eğer CDN linki patlarsa ham GitHub linkine dön (daha yavaş ama kesin)
    if (currentSrc.includes('cdn.jsdelivr.net')) {
      setCurrentSrc(currentSrc.replace('cdn.jsdelivr.net/gh', 'raw.githubusercontent.com').replace('@master', '/master'));
    } else {
      // O da olmazsa m00.jpg (Joker) kartını göster
      setCurrentSrc("https://cdn.jsdelivr.net/gh/ekelen/tarot@master/assets/cards/m00.jpg");
      setIsError(true);
    }
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -5, scale: 1.05, zIndex: 40 }}
      className={`relative w-20 h-32 md:w-28 md:h-44 perspective-1000 cursor-pointer shrink-0 ${className}`}
      onClick={onClick}
    >
      <div className={`card-inner relative w-full h-full duration-700 ${isFlipped ? 'card-flipped' : ''}`}>
        {/* Card Back */}
        <div className="card-back absolute inset-0 bg-slate-900 border-2 border-amber-600/40 rounded-lg flex items-center justify-center overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-600/10 to-transparent"></div>
          <div className="text-amber-600/20 text-4xl animate-pulse">✧</div>
          <div className="absolute inset-1 border border-amber-600/10 rounded"></div>
        </div>

        {/* Card Front - İsim barı kaldırıldı, sadece resim alanı kaldı */}
        <div className={`card-front absolute inset-0 bg-white rounded-lg overflow-hidden border-2 border-amber-400/80 shadow-2xl flex flex-col ${isReversed ? 'rotate-180' : ''}`}>
          {card && (
            <div className="relative flex-1 w-full h-full bg-white flex flex-col overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                   <div className="text-amber-600/30 text-2xl animate-spin">✨</div>
                </div>
              )}
              <img 
                src={currentSrc} 
                alt={card.name} 
                className={`flex-1 object-cover w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
                onError={handleImgError}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Kartın Altındaki Pozisyon İsmi (Geçmiş, Şimdi vb.) - Bu alan kartın dışındadır */}
      {positionName && (
        <div className="absolute -bottom-8 left-0 right-0 z-10 text-center">
          <span className="inline-block text-[8px] md:text-[10px] font-cinzel text-amber-500 font-bold uppercase tracking-widest bg-slate-950/80 backdrop-blur-sm py-1 px-2 rounded border border-amber-600/20 shadow-lg whitespace-nowrap">
            {positionName}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default Card;
