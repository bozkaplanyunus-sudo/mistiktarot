
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TarotCard, Language } from '../types';

interface CardProps {
  card?: TarotCard;
  isFlipped: boolean;
  isReversed?: boolean;
  positionName?: string;
  onClick?: () => void;
  className?: string;
  delay?: number;
  lang?: Language;
  noHover?: boolean;
  noBorder?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  card, 
  isFlipped, 
  isReversed = false, 
  positionName, 
  onClick,
  className = "",
  delay = 0,
  noHover = false,
  noBorder = false,
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (card?.imageUrl) {
      setCurrentSrc(card.imageUrl);
      setIsLoading(true);
      setIsError(false);
    } else if (card) {
      setIsError(true);
      setIsLoading(false);
    }
  }, [card]);

  const handleImgError = () => {
    console.warn(`Görsel yüklenemedi: ${card?.name}`);
    setIsError(true);
    setIsLoading(false);
  };

  // Majör Arkana kartlarını tespit et (id: major-...)
  const isMajor = card?.id.startsWith('major');

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={noHover ? {} : { y: -5 }}
      className={`relative perspective-1000 cursor-pointer shrink-0 ${className}`}
      onClick={onClick}
    >
      <div className={`card-inner relative w-full h-full duration-[800ms] ease-in-out ${isFlipped ? 'card-flipped' : ''}`}>
        
        {/* KART ARKASI */}
        <div className={`card-back absolute inset-0 rounded-lg flex items-center justify-center overflow-hidden ${noBorder ? 'bg-transparent' : 'bg-[#0a0f1e] border border-amber-600/30'}`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23d97706' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>
          {!noBorder && (
            <div className="relative w-full h-full flex items-center justify-center">
               <div className="w-4/5 h-4/5 border border-amber-600/10 rounded-full"></div>
               <div className="absolute text-amber-500/20 text-2xl font-serif">◈</div>
            </div>
          )}
        </div>

        {/* KART ÖNÜ */}
        <div className={`card-front absolute inset-0 rounded-lg overflow-hidden flex flex-col ${isReversed ? 'rotate-180' : ''} ${noBorder ? 'bg-transparent border-none' : 'bg-[#020617] border border-amber-500/50'}`}>
          {card && (
            <div className={`relative flex-1 w-full h-full flex flex-col overflow-hidden ${noBorder ? 'p-0' : 'p-1 md:p-1.5'}`}>
              {isLoading && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-10">
                   <div className="w-6 h-6 border-2 border-amber-600/20 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
              )}
              
              {!isError && currentSrc ? (
                <img 
                  src={currentSrc} 
                  alt={card.name} 
                  /* Majör kartlar için padding (p-2) ekleyerek onları minör kartlarla görsel olarak dengeliyoruz */
                  className={`flex-1 object-contain w-full h-full transition-all duration-700 ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${isMajor ? 'p-2' : 'p-0.5'}`}
                  onLoad={() => setIsLoading(false)}
                  onError={handleImgError}
                  loading="lazy"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center bg-indigo-950/20">
                  <div className="text-amber-500/20 text-4xl mb-2">✦</div>
                  <div className="font-cinzel text-[8px] text-amber-500/40 font-bold uppercase tracking-widest">
                    {card.name}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Card;
