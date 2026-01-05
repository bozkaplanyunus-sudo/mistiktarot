
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
      // Görsel URL'si yoksa direkt hata durumuna geç
      setIsError(true);
      setIsLoading(false);
    }
  }, [card]);

  const handleImgError = () => {
    console.warn(`Görsel yüklenemedi: ${card?.name}`);
    setIsError(true);
    setIsLoading(false);
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={noHover ? {} : { y: -8, zIndex: 50 }}
      className={`relative perspective-1000 cursor-pointer shrink-0 ${className}`}
      onClick={onClick}
    >
      <div className={`card-inner relative w-full h-full duration-[800ms] ease-in-out shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${isFlipped ? 'card-flipped' : ''}`}>
        
        {/* KART ARKASI: Mistik Geometrik Desen */}
        <div className="card-back absolute inset-0 bg-[#0a0f1e] border-[3px] border-amber-600/50 rounded-xl flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23d97706' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>
          <div className="relative w-full h-full flex items-center justify-center">
             <div className="w-4/5 h-4/5 border border-amber-600/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
             <div className="absolute text-amber-500/40 text-4xl font-serif">◈</div>
          </div>
          <div className="absolute inset-2 border border-amber-600/10 rounded-lg"></div>
        </div>

        {/* KART ÖNÜ: Altın Çerçeve ve Görsel */}
        <div className={`card-front absolute inset-0 bg-slate-950 rounded-xl overflow-hidden border-[3px] border-amber-500/80 flex flex-col ${isReversed ? 'rotate-180' : ''}`}>
          {card && (
            <div className="relative flex-1 w-full h-full bg-[#020617] flex flex-col overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-10">
                   <div className="w-8 h-8 border-2 border-amber-600/20 border-t-amber-500 rounded-full animate-spin mb-2"></div>
                   <div className="text-[6px] font-cinzel text-amber-500 uppercase tracking-widest animate-pulse">Visioning...</div>
                </div>
              )}
              
              {!isError && currentSrc ? (
                <img 
                  src={currentSrc} 
                  alt={card.name} 
                  className={`flex-1 object-cover w-full h-full transition-all duration-700 ${isLoading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
                  onLoad={() => setIsLoading(false)}
                  onError={handleImgError}
                  loading="lazy"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center bg-indigo-950/20">
                  <div className="text-amber-500/30 text-5xl mb-2">✦</div>
                  <div className="font-cinzel text-[10px] text-amber-500/60 font-bold uppercase tracking-widest mb-1">
                    {card.name}
                  </div>
                  <div className="font-cinzel text-[8px] text-amber-600/40 uppercase tracking-tighter">
                    Mistik Mühür
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {positionName && (
        <div className="absolute -bottom-10 left-0 right-0 z-10 text-center pointer-events-none">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-[8px] md:text-[10px] font-cinzel text-white font-bold uppercase tracking-[0.2em] bg-amber-600 py-1 px-3 rounded-full shadow-[0_10px_20px_rgba(217,119,6,0.4)] whitespace-nowrap border border-white/20"
          >
            {positionName}
          </motion.span>
        </div>
      )}
    </motion.div>
  );
};

export default Card;
