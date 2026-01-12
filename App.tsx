
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  History as HistoryIcon, 
  ChevronLeft, 
  ChevronRight,
  Send, 
  RotateCcw, 
  MessageCircle, 
  Globe,
  Clock,
  BookOpen,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  Language, 
  DeckType, 
  SpreadType, 
  TarotCard, 
  CardSelection, 
  ReadingState, 
  SavedReading, 
  FollowUp
} from './types';
import { getFullDeck, SPREAD_CONFIGS } from './constants';
import { translations } from './translations';
import { getTarotInterpretation, getRumiFollowUpAnswer } from './services/geminiService';
import Card from './components/Card';

/**
 * Markdown formatındaki görselleri, etiketleri ve metni şık bir şekilde render eder.
 */
const InterpretationRenderer: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(!\[.*?\]\(.*?\))/g);

  return (
    <div className="space-y-6">
      {parts.map((part, i) => {
        const imageMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
        
        if (imageMatch) {
          const alt = imageMatch[1];
          const url = imageMatch[2];
          return (
            <div key={i} className="flex flex-col items-center my-10 group">
              <div className="w-40 md:w-56 aspect-[2/3.5] rounded-xl overflow-hidden border-2 border-amber-500/20 shadow-[0_0_40px_rgba(217,119,6,0.15)] group-hover:border-amber-500/50 transition-all duration-500">
                <img src={url} alt={alt} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-cinzel text-amber-500/40 mt-3 uppercase tracking-[0.3em] font-bold">
                {alt}
              </span>
            </div>
          );
        }

        const paragraphs = part.split('\n').filter(p => p.trim() !== '');
        return paragraphs.map((p, j) => {
          // Clean text: remove leading symbols and bold markers
          const cleanText = p.replace(/^[#\*\-\s]+/, '').replace(/\*\*/g, '').trim();
          if (!cleanText) return null;

          // Heuristics for headers vs paragraphs
          const isOriginalHeading = p.trim().startsWith('#');
          const isAllCaps = cleanText === cleanText.toUpperCase() && cleanText.length > 3;
          const isStatus = cleanText.startsWith('Durum:');
          const isLabel = cleanText.startsWith('Yorum:') || cleanText.startsWith('Cevap:') || cleanText.startsWith('KART:');

          // Header Style (Orange)
          if ((isOriginalHeading || isAllCaps) && !isStatus && !isLabel) {
            return (
              <h3 key={`${i}-${j}`} className="font-cinzel text-amber-500 text-xl md:text-2xl tracking-[0.2em] mt-12 mb-6 uppercase text-center border-b border-amber-500/10 pb-4">
                {cleanText}
              </h3>
            );
          }

          // Special status badges
          if (isStatus) {
            return (
              <div key={`${i}-${j}`} className="flex justify-center mb-4">
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {cleanText}
                </span>
              </div>
            );
          }

          // Sub-labels
          if (isLabel) {
            return (
              <div key={`${i}-${j}`} className="font-cinzel text-amber-500/80 text-sm font-bold uppercase tracking-[0.2em] mb-2 mt-6">
                {cleanText}
              </div>
            );
          }

          // Standard Paragraph Style (Even More Dimmed White, Justified, Indented)
          return (
            <p key={`${i}-${j}`} className="font-playfair text-lg leading-relaxed text-slate-400 text-justify indent-8 opacity-80 mb-6 last:mb-0">
              {cleanText}
            </p>
          );
        });
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.TR);
  const [view, setView] = useState<'language-selection' | 'welcome' | 'deck-selection' | 'spread-selection' | 'intent-input' | 'mixing' | 'drawing' | 'reading' | 'history'>('language-selection');
  const [reading, setReading] = useState<ReadingState>({
    deck: null,
    spread: null,
    cards: [],
    interpretation: '',
    questionsRemaining: 3,
    followUpQuestions: [],
    userIntent: ''
  });
  
  // History state initialization from localStorage
  const [history, setHistory] = useState<SavedReading[]>(() => {
    const saved = localStorage.getItem('mistik_tarot_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [loading, setLoading] = useState(false);
  const [rumiInput, setRumiInput] = useState('');

  const t = translations[lang];

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mistik_tarot_history', JSON.stringify(history));
  }, [history]);

  const handleLanguageSelect = (selectedLang: Language) => {
    setLang(selectedLang);
    setView('welcome');
  };

  const startNewReading = () => {
    setView('deck-selection');
    setReading({
      deck: null,
      spread: null,
      cards: [],
      interpretation: '',
      questionsRemaining: 3,
      followUpQuestions: [],
      userIntent: ''
    });
  };

  const selectDeck = (deck: DeckType) => {
    setReading(prev => ({ ...prev, deck }));
    setView('spread-selection');
  };

  const selectSpread = (spread: SpreadType) => {
    setReading(prev => ({ ...prev, spread }));
    setView('intent-input');
  };

  const submitIntent = () => {
    setView('mixing');
    setTimeout(() => setView('drawing'), 3000);
  };

  const drawNextCard = () => {
    const config = SPREAD_CONFIGS[reading.spread!];
    const currentCount = reading.cards.length;
    if (currentCount >= config.count) return;
    
    const deck = getFullDeck(reading.deck!);
    let randomCard: TarotCard;
    
    do {
      const idx = Math.floor(Math.random() * deck.length);
      randomCard = deck[idx];
    } while (reading.cards.some(c => c.card.id === randomCard.id));

    const newSelection: CardSelection = {
      card: randomCard,
      isReversed: false,
      positionName: (t.positions as any)[config.positions[currentCount]] || config.positions[currentCount]
    };
    
    const updatedCards = [...reading.cards, newSelection];
    setReading(prev => ({ ...prev, cards: updatedCards }));
    
    if (updatedCards.length === config.count) {
      setTimeout(() => generateInterpretation(updatedCards), 1200);
    }
  };

  const generateInterpretation = async (finalCards: CardSelection[]) => {
    setLoading(true);
    setView('reading');
    try {
      const result = await getTarotInterpretation(reading.deck!, reading.spread!, finalCards, lang, reading.userIntent);
      setReading(prev => ({ ...prev, interpretation: result }));
      const newSaved: SavedReading = {
        id: Date.now().toString(),
        date: new Date().toLocaleString(),
        deckType: reading.deck!,
        spreadType: reading.spread!,
        cards: finalCards,
        interpretation: result,
        followUps: [],
        isFavorite: false,
        userIntent: reading.userIntent
      };
      setHistory(prev => [newSaved, ...prev]);
    } catch (error) {
      setReading(prev => ({ ...prev, interpretation: "Mistik kanallar şu an çok yoğun. Lütfen tekrar deneyin." }));
    } finally {
      setLoading(false);
    }
  };

  const handleRumiAsk = async () => {
    if (!rumiInput.trim() || reading.questionsRemaining === 0 || loading) return;
    setLoading(true);
    const randomCard = reading.cards[Math.floor(Math.random() * reading.cards.length)];
    const answer = await getRumiFollowUpAnswer(rumiInput, randomCard, lang);
    const newFollowUp: FollowUp = { question: rumiInput, card: randomCard, answer };
    setReading(prev => ({
      ...prev,
      questionsRemaining: prev.questionsRemaining - 1,
      followUpQuestions: [...prev.followUpQuestions, newFollowUp]
    }));
    setRumiInput('');
    setLoading(false);
  };

  const renderDrawing = () => {
    const config = SPREAD_CONFIGS[reading.spread!];
    const drawnCount = reading.cards.length;
    const totalCardsInDeck = 78;

    return (
      <div className="flex flex-col h-full w-full max-w-6xl mx-auto overflow-hidden">
        {/* ÜST ALAN: SEÇİLEN KARTLAR */}
        <div className="flex-none p-4 md:p-8 border-b border-amber-500/10 bg-slate-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-amber-500/5 mask-fade-edges opacity-30" />
          
          <div className="relative z-10 mb-6 text-center">
            <h2 className="font-cinzel text-xs md:text-sm text-amber-500 tracking-[0.4em] uppercase mb-1 font-bold">
              {t.spreads[reading.spread!]}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-8 bg-amber-500/20" />
              <div className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest bg-amber-500/5 px-3 py-0.5 rounded-full border border-amber-500/10">
                {drawnCount} / {config.count}
              </div>
              <div className="h-[1px] w-8 bg-amber-500/20" />
            </div>
          </div>

          <div className="relative z-10 flex gap-3 md:gap-6 justify-center items-center overflow-x-auto custom-scrollbar py-2 px-4">
            {Array.from({ length: config.count }).map((_, i) => {
              const selection = reading.cards[i];
              return (
                <div key={i} className="flex flex-col items-center gap-3 shrink-0">
                  <div className={`w-20 md:w-32 aspect-[2/3.5] rounded-xl transition-all duration-500 relative ${!selection ? 'border border-dashed border-amber-500/20 bg-amber-500/5' : 'shadow-[0_0_30px_rgba(217,119,6,0.2)]'}`}>
                    <AnimatePresence mode="wait">
                      {selection ? (
                        <motion.div
                          key={`card-${i}`}
                          initial={{ scale: 0.8, rotateY: 180, opacity: 0 }}
                          animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                          className="w-full h-full"
                        >
                          <Card 
                            card={selection.card}
                            isFlipped={true}
                            isReversed={selection.isReversed}
                            noHover
                            className="w-full h-full"
                          />
                        </motion.div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                           <Sparkles size={24} className="text-amber-500 animate-pulse" />
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="w-full max-w-[80px] md:max-w-[120px] h-6 flex items-center justify-center">
                    <span className={`text-[8px] md:text-[10px] font-cinzel text-center uppercase tracking-widest font-bold transition-colors ${selection ? 'text-amber-500' : 'text-slate-600'}`}>
                      {(t.positions as any)[config.positions[i]] || config.positions[i]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ALT ALAN: DESTE */}
        {drawnCount < config.count && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-950/20">
            <div className="text-center mb-10 mt-4">
               <motion.p 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="font-playfair italic text-slate-500 text-sm md:text-lg max-w-lg mx-auto leading-relaxed"
               >
                 {lang === Language.TR 
                   ? 'Kaderin kapılarını aralamak için sıradaki kartına odaklan ve sezgilerine güven...' 
                   : 'Focus on your next card and trust your intuition to unlock the doors of fate...'}
               </motion.p>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 md:gap-4 max-w-5xl mx-auto pb-24">
              {Array.from({ length: totalCardsInDeck }).map((_, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -8, scale: 1.05, borderColor: 'rgba(217,119,6,0.4)', backgroundColor: 'rgba(217,119,6,0.05)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={drawNextCard}
                  className="aspect-[2/3.5] bg-[#0a0f1e] border border-amber-600/20 rounded-lg cursor-pointer shadow-lg relative group transition-all"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4/5 h-4/5 border border-amber-600/5 rounded-full transition-transform group-hover:scale-110" />
                    <Sparkles className="text-amber-500/10 group-hover:text-amber-500/30 w-4 h-4 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#020617] text-slate-100 flex flex-col font-inter selection:bg-amber-500/30 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-amber-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-amber-500/10 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('welcome')}>
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 group-hover:border-amber-500 transition-all shadow-[0_0_10px_rgba(217,119,6,0.3)]">
            <Sparkles className="text-amber-500" size={18} />
          </div>
          <h1 className="font-cinzel text-sm text-amber-500 font-bold tracking-[0.2em] uppercase">Mistik Tarot</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setView('language-selection')} className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 hover:text-amber-500 transition-all px-3 py-1.5 rounded-full border border-white/5 bg-white/5 uppercase">
            <Globe size={12} /> {lang}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full flex flex-col">
            {view === 'language-selection' && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Globe className="text-amber-500 w-12 h-12 mb-8 animate-pulse" />
                <h2 className="font-cinzel text-2xl text-amber-500 mb-8 tracking-widest uppercase">Dil Seçiniz</h2>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {Object.values(Language).map(l => (
                    <motion.button 
                      key={l} 
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(217,119,6,0.05)' }}
                      onClick={() => handleLanguageSelect(l)} 
                      className="py-4 rounded-xl border border-amber-500/20 bg-slate-900/40 hover:border-amber-500 transition-all font-cinzel text-sm uppercase tracking-widest"
                    >
                      {l === Language.TR ? 'Türkçe' : l === Language.EN ? 'ENGLISH' : 'FRANCAIS'}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            {view === 'welcome' && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-24 h-24 rounded-full border border-amber-500/20 flex items-center justify-center mb-8 bg-amber-500/5 shadow-inner animate-glow">
                  <Sparkles className="text-amber-500 w-10 h-10" />
                </div>
                <h2 className="font-cinzel text-3xl text-amber-500 mb-4 tracking-widest uppercase">{t.welcomeTitle}</h2>
                <p className="font-playfair text-slate-400 max-w-md italic mb-12">{t.welcomeSub}</p>
                <div className="flex flex-col gap-4 w-full max-w-xs">
                  <button onClick={startNewReading} className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-4 px-12 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl font-cinzel tracking-widest uppercase">
                    {t.startBtn}
                  </button>
                  <button 
                    onClick={() => setView('history')} 
                    className="flex items-center justify-center gap-2 border border-amber-500/20 hover:border-amber-500/60 bg-white/5 hover:bg-white/10 text-amber-500/80 font-bold py-3 px-8 rounded-full transition-all active:scale-95 font-cinzel tracking-widest uppercase text-xs"
                  >
                    <HistoryIcon size={16} />
                    {t.historyTitle}
                  </button>
                </div>
              </div>
            )}
            {view === 'deck-selection' && (
              <div className="flex flex-col items-center justify-center h-full px-6 max-w-4xl mx-auto">
                <h2 className="font-cinzel text-2xl text-amber-500 mb-12 tracking-widest uppercase text-center">{t.selectDeck}</h2>
                <div className="grid grid-cols-1 gap-8 w-full max-w-sm">
                  {[
                    { type: DeckType.RIDER_WAITE, title: t.deckRiderTitle, desc: t.deckRiderDesc, icon: <Sparkles /> }
                  ].map(deck => (
                    <motion.div key={deck.type} whileHover={{ y: -5 }} onClick={() => selectDeck(deck.type)} className="bg-slate-900/40 border border-amber-500/20 p-8 rounded-2xl cursor-pointer hover:border-amber-500/60 transition-all group text-center">
                      <div className="text-amber-500 mb-4 group-hover:scale-110 transition-transform flex justify-center">{deck.icon}</div>
                      <h3 className="font-cinzel text-xl text-white mb-2">{deck.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed italic">{deck.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {view === 'spread-selection' && (
              <div className="flex flex-col items-center justify-center h-full px-6 max-w-md mx-auto w-full">
                <h2 className="font-cinzel text-xl text-amber-500 mb-8 tracking-widest uppercase text-center">{t.selectSpread}</h2>
                <div className="flex flex-col gap-4 w-full">
                  {Object.keys(SPREAD_CONFIGS).map(type => (
                    <button key={type} onClick={() => selectSpread(type as SpreadType)} className="flex items-center justify-between p-5 bg-slate-900/40 border border-amber-500/10 rounded-xl hover:border-amber-500 transition-all text-left group">
                      <span className="font-cinzel text-sm text-white uppercase tracking-wider">{t.spreads[type as SpreadType]}</span>
                      <ChevronRight size={18} className="text-amber-500/40 group-hover:text-amber-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {view === 'intent-input' && (
              <div className="flex flex-col items-center justify-center h-full px-6 max-w-2xl mx-auto w-full">
                <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 shadow-inner mb-8">
                  <MessageCircle className="text-amber-500 w-12 h-12" />
                </div>
                <h2 className="font-cinzel text-2xl text-amber-500 mb-6 tracking-widest uppercase text-center">
                  {lang === Language.TR ? 'Seni buraya getiren nedir?' : 'What brought you here?'}
                </h2>
                <p className="font-playfair text-slate-400 italic text-center mb-10 leading-relaxed">
                  {lang === Language.TR 
                    ? 'Bir duygu, bir istek ya da bir düşünce...' 
                    : 'A feeling, a desire, or a thought...'}
                </p>
                <div className="w-full relative">
                  <textarea 
                    value={reading.userIntent}
                    onChange={(e) => setReading(prev => ({ ...prev, userIntent: e.target.value }))}
                    placeholder={lang === Language.TR ? 'Buraya fısılda...' : 'Whisper here...'}
                    className="w-full h-40 bg-slate-950/60 border border-amber-500/20 rounded-3xl p-6 md:p-8 focus:outline-none focus:border-amber-500/60 transition-all text-lg font-playfair italic placeholder:text-slate-700 resize-none shadow-2xl"
                  />
                </div>
                <button 
                  onClick={submitIntent}
                  className="mt-10 flex items-center gap-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-4 px-12 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl font-cinzel tracking-widest uppercase group"
                >
                  {lang === Language.TR ? 'Devam Et' : 'Continue'}
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
              </div>
            )}
            {view === 'mixing' && (
              <div className="flex flex-col items-center justify-center h-full text-center p-12">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="mb-12 relative w-32 h-32">
                  <div className="absolute inset-0 border border-dashed border-amber-500/20 rounded-full" />
                  <div className="absolute inset-4 border border-amber-500/40 rounded-full flex items-center justify-center">
                    <Sparkles className="text-amber-500 w-8 h-8" />
                  </div>
                </motion.div>
                <h2 className="font-cinzel text-xl text-amber-500 mb-4 tracking-widest">{t.mixingTitle}</h2>
                <p className="font-playfair text-slate-400 italic text-sm">{t.mixingDesc}</p>
              </div>
            )}
            {view === 'drawing' && renderDrawing()}
            {view === 'reading' && (
              <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="bg-slate-950/40 backdrop-blur-2xl rounded-[3rem] p-8 md:p-14 border border-amber-500/10 mb-12 shadow-inner">
                  {loading && !reading.interpretation ? (
                    <div className="flex flex-col items-center py-24">
                      <RotateCcw className="text-amber-500 animate-spin mb-4" size={40} />
                      <p className="font-cinzel text-amber-500/60 uppercase tracking-widest animate-pulse">Kadim Enerji Okunuyor...</p>
                    </div>
                  ) : (
                    <InterpretationRenderer text={reading.interpretation} />
                  )}
                </div>

                <div className="bg-indigo-950/10 backdrop-blur-md rounded-3xl p-8 border border-amber-500/5 mb-12 shadow-inner">
                  <h2 className="font-cinzel text-xl text-amber-500 mb-6 tracking-widest uppercase text-center">{t.rumiTitle}</h2>
                  <div className="space-y-6 mb-8">
                    {reading.followUpQuestions.map((q, i) => (
                      <div key={i} className="bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-lg">
                        <p className="text-amber-500/40 text-[10px] font-bold uppercase mb-4 tracking-widest italic">Soru: {q.question}</p>
                        <InterpretationRenderer text={q.answer} />
                      </div>
                    ))}
                  </div>
                  {reading.questionsRemaining > 0 && (
                    <div className="relative group">
                      <input 
                        value={rumiInput}
                        onChange={(e) => setRumiInput(e.target.value)}
                        placeholder="Zihnindeki soruyu buraya fısılda..."
                        className="w-full bg-slate-950/60 border border-white/10 rounded-full py-4 px-8 pr-16 focus:outline-none focus:border-amber-500/40 transition-all text-sm font-playfair italic placeholder:text-slate-700"
                        onKeyDown={(e) => e.key === 'Enter' && handleRumiAsk()}
                      />
                      <button disabled={loading || !rumiInput.trim()} onClick={handleRumiAsk} className="absolute right-2 top-2 p-2.5 bg-amber-600/80 hover:bg-amber-500 text-white rounded-full transition-all shadow-lg active:scale-95">
                        {loading ? <RotateCcw size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  )}
                </div>

                <button onClick={() => setView('welcome')} className="self-center mb-12 flex items-center gap-2 text-slate-500 hover:text-amber-500 transition-all uppercase font-bold text-[10px] tracking-widest group">
                  <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-700" /> {t.backBtn}
                </button>
              </div>
            )}
            {view === 'history' && (
              <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-8 border-b border-amber-500/10 pb-4">
                  <button onClick={() => setView('welcome')} className="p-2 text-slate-400 hover:text-amber-500 transition-colors bg-white/5 rounded-full"><ChevronLeft size={20} /></button>
                  <h2 className="font-cinzel text-xl text-amber-500 tracking-[0.2em] uppercase">{t.historyTitle}</h2>
                  <div className="w-10" />
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-600 italic">
                      <BookOpen size={48} className="opacity-10 mb-4" />
                      <p>{t.noHistory}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {history.map(item => (
                        <motion.div 
                          key={item.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-900/40 border border-amber-500/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all cursor-pointer group shadow-xl"
                          onClick={() => {
                            setReading({
                              deck: item.deckType,
                              spread: item.spreadType,
                              cards: item.cards,
                              interpretation: item.interpretation,
                              questionsRemaining: 3 - item.followUps.length,
                              followUpQuestions: item.followUps,
                              userIntent: item.userIntent || ''
                            });
                            setView('reading');
                          }}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-white font-cinzel mb-1 tracking-wider uppercase text-sm">{(t.spreads as any)[item.spreadType]}</h3>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                <Clock size={12} /> {item.date}
                              </div>
                            </div>
                            <div className="text-[9px] bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 font-bold uppercase tracking-widest">
                              {item.deckType}
                            </div>
                          </div>
                          
                          {item.userIntent && (
                            <p className="text-xs text-slate-400 italic mb-4 line-clamp-1 border-l-2 border-amber-500/20 pl-4 bg-amber-500/5 py-2 rounded-r-lg">
                              "{item.userIntent}"
                            </p>
                          )}
                          
                          <div className="flex gap-2 overflow-x-hidden">
                            {item.cards.map((c, i) => (
                              <div key={i} className="w-10 h-16 rounded-md border border-white/5 overflow-hidden shrink-0 shadow-sm group-hover:border-amber-500/30 transition-colors">
                                <img src={c.card.imageUrl} className={`w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all ${c.isReversed ? 'rotate-180' : ''}`} />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-20 px-6 py-3 border-t border-amber-500/5 text-center bg-slate-950/60 backdrop-blur-md">
        <p className="text-[8px] text-slate-600 uppercase tracking-[0.4em] font-bold opacity-60">{t.footer}</p>
      </footer>
    </div>
  );
};

export default App;
