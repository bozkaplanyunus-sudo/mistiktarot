
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { History, Star, Trash2, X, ChevronRight, Bookmark, MessageCircle, Globe, RefreshCw } from 'lucide-react';
import { DeckType, SpreadType, CardSelection, ReadingState, SavedReading, UserProfile, Language, TarotCard } from './types';
import { getFullDeck, SPREAD_CONFIGS } from './constants';
import { translations } from './translations';
import { getTarotInterpretation, getRumiFollowUpAnswer } from './services/geminiService';
import Card from './components/Card';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.TR);
  const [step, setStep] = useState<'language' | 'welcome' | 'deck' | 'spread' | 'picking' | 'reading' | 'history'>('language');
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('tarot_user');
    return saved ? JSON.parse(saved) : { name: 'Gezgin', avatar: '🔮' };
  });
  const [history, setHistory] = useState<SavedReading[]>(() => {
    const saved = localStorage.getItem('tarot_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [state, setState] = useState<ReadingState>({
    deck: null,
    spread: null,
    cards: [],
    interpretation: '',
    questionsRemaining: 3,
    followUpQuestions: []
  });

  const [pickingDeck, setPickingDeck] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  
  const t = useMemo(() => translations[lang], [lang]);
  
  // Drag Mechanics - Using a single value for the whole deck movement
  const deckX = useMotionValue(0);
  const smoothDeckX = useSpring(deckX, { stiffness: 100, damping: 25 });

  useEffect(() => {
    localStorage.setItem('tarot_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tarot_history', JSON.stringify(history));
  }, [history]);

  const saveReading = (reading: Omit<SavedReading, 'id' | 'date' | 'isFavorite'>) => {
    const newReading: SavedReading = {
      ...reading,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(lang === Language.TR ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
      isFavorite: false
    };
    setHistory(prev => [newReading, ...prev]);
  };

  const toggleFavorite = (id: string) => {
    setHistory(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
  };

  const deleteReading = (id: string) => {
    setHistory(prev => prev.filter(r => r.id !== id));
  };

  const selectDeck = (deck: DeckType) => {
    setState(prev => ({ ...prev, deck }));
    setStep('spread');
  };

  const selectSpread = (spread: SpreadType) => {
    setState(prev => ({ ...prev, spread }));
    const deck = getFullDeck(state.deck || DeckType.RIDER_WAITE);
    setPickingDeck([...deck].sort(() => Math.random() - 0.5));
    setStep('picking');
    deckX.set(0); 
  };

  const onCardPick = (card: TarotCard) => {
    const config = (SPREAD_CONFIGS as any)[state.spread!];
    if (state.cards.length >= config.count) return;

    const newSelection: CardSelection = {
      card,
      isReversed: Math.random() > 0.8,
      positionName: (t.positions as any)[config.positions[state.cards.length]]
    };

    const newCards = [...state.cards, newSelection];
    setState(prev => ({ ...prev, cards: newCards }));
    setPickingDeck(prev => prev.filter(c => c.id !== card.id));

    if (newCards.length === config.count) {
      setTimeout(() => finalizeReading(newCards), 800);
    }
  };

  const finalizeReading = async (selectedCards: CardSelection[]) => {
    setLoading(true);
    setStep('reading');
    const interpretation = await getTarotInterpretation(state.deck!, state.spread!, selectedCards, lang);
    setState(prev => ({ ...prev, interpretation }));
    
    saveReading({
      deckType: state.deck!,
      spreadType: state.spread!,
      cards: selectedCards,
      interpretation,
      followUps: []
    });
    setLoading(false);
  };

  const reset = () => {
    setStep('welcome');
    setState({
      deck: null,
      spread: null,
      cards: [],
      interpretation: '',
      questionsRemaining: 3,
      followUpQuestions: []
    });
  };

  const currentConfig = state.spread ? (SPREAD_CONFIGS as any)[state.spread] : null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-inter overflow-hidden select-none">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-30 overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-600 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-950 rounded-full blur-[150px]"></div>
      </div>

      <header className="relative z-50 w-full max-w-6xl mx-auto px-6 py-4 flex justify-between items-center bg-[#020617]/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
          <div className="w-9 h-9 bg-amber-600/20 rounded-full flex items-center justify-center border border-amber-600/30 group-hover:scale-110 transition-transform">
            <span className="text-xl">🔮</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-cinzel text-lg text-amber-500 font-bold tracking-widest uppercase">Mistik</h1>
            <p className="text-[8px] text-amber-600/60 uppercase tracking-tighter">Sırrın Aynası</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {step !== 'language' && (
            <button onClick={() => setStep('history')} className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
              <History size={20} />
            </button>
          )}
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="text-xs font-medium text-slate-400">{user.name}</span>
            <span className="text-lg">{user.avatar}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto flex flex-col items-center">
        <AnimatePresence mode="wait">
          {step === 'language' && (
            <motion.div key="language" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20 w-full">
              <Globe className="text-amber-500 mx-auto mb-10 animate-pulse" size={48} />
              <h2 className="text-3xl font-cinzel text-white mb-12 tracking-widest uppercase">Select Language</h2>
              <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-lg mx-auto px-6">
                {[
                  { id: Language.TR, label: 'TÜRKÇE', flag: '🇹🇷' },
                  { id: Language.EN, label: 'ENGLISH', flag: '🇺🇸' },
                  { id: Language.FR, label: 'FRANÇAIS', flag: '🇫🇷' }
                ].map(l => (
                  <button key={l.id} onClick={() => { setLang(l.id); setStep('welcome'); }} className="flex-1 py-6 bg-slate-900/40 border border-white/10 rounded-3xl hover:border-amber-500 hover:bg-slate-900 transition-all shadow-xl group">
                    <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">{l.flag}</span>
                    <span className="font-cinzel text-sm text-slate-400 group-hover:text-amber-500 uppercase">{l.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-20 w-full px-6">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }} 
                transition={{ duration: 6, repeat: Infinity }}
                className="mb-8 inline-block p-6 bg-amber-600/10 rounded-full border border-amber-600/20 shadow-[0_0_50px_rgba(217,119,6,0.2)]"
              >
                <Bookmark className="text-amber-500" size={40} />
              </motion.div>
              <h2 className="text-4xl md:text-7xl font-cinzel text-white mb-8 uppercase tracking-tighter leading-none">{t.welcomeTitle}</h2>
              <p className="text-slate-400 max-w-2xl mx-auto mb-16 font-playfair italic text-xl md:text-2xl leading-relaxed">{t.welcomeSub}</p>
              <button onClick={() => setStep('deck')} className="group relative px-12 py-5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-full transition-all shadow-[0_0_30px_rgba(217,119,6,0.4)] uppercase tracking-[0.3em] flex items-center gap-3 mx-auto overflow-hidden">
                <span className="relative z-10">{t.startBtn}</span>
                <ChevronRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={24} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </motion.div>
          )}

          {step === 'deck' && (
            <motion.div key="deck" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full px-6 py-10">
              {[
                { type: DeckType.RIDER_WAITE, title: t.deckRiderTitle, desc: t.deckRiderDesc, preview: 'https://cdn.jsdelivr.net/gh/ekelen/tarot@master/assets/cards/m00.jpg' },
                { type: DeckType.MARSEILLE, title: t.deckMarseilleTitle, desc: t.deckMarseilleDesc, preview: 'https://cdn.jsdelivr.net/gh/Gideon-Stark/tarot-api@master/static/cards/m00.jpg' }
              ].map((deck) => (
                <motion.div 
                  key={deck.type} 
                  whileHover={{ y: -10 }}
                  onClick={() => selectDeck(deck.type)} 
                  className="group bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] cursor-pointer hover:border-amber-600/50 transition-all text-center shadow-2xl flex flex-col items-center"
                >
                  <div className="w-28 h-44 md:w-36 md:h-56 mb-8 rounded-xl border border-white/10 overflow-hidden bg-black/40 p-2 shadow-inner group-hover:shadow-amber-500/20 transition-all">
                    <img src={deck.preview} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                  </div>
                  <h3 className="font-cinzel text-xl md:text-2xl text-amber-500 mb-3 uppercase tracking-widest">{deck.title}</h3>
                  <p className="text-slate-500 text-xs italic leading-relaxed max-w-[200px]">{deck.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {step === 'spread' && (
            <motion.div key="spread" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto text-center w-full px-6 py-10">
              <h2 className="font-cinzel text-3xl md:text-4xl mb-12 uppercase tracking-[0.2em] text-white/90">{t.selectSpread}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.values(SpreadType).map((spread) => (
                  <button key={spread} onClick={() => selectSpread(spread)} className="p-6 md:p-8 bg-slate-900/40 border border-white/5 rounded-3xl hover:border-amber-600/30 text-left hover:bg-slate-900/80 transition-all flex justify-between items-center group relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="font-cinzel text-amber-500 text-lg md:text-xl uppercase font-bold tracking-wider">{(t.spreads as any)[spread]}</div>
                      <div className="text-slate-500 text-xs mt-2 uppercase tracking-widest">{(SPREAD_CONFIGS as any)[spread].count} {t.drawBtn}</div>
                    </div>
                    <ChevronRight className="text-slate-700 group-hover:text-amber-500 group-hover:translate-x-1 transition-all relative z-10" size={24} />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 rounded-full -mr-10 -mt-10 group-hover:bg-amber-600/10 transition-colors"></div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'picking' && (
            <motion.div key="picking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-[calc(100vh-80px)] flex flex-col items-center overflow-hidden touch-none">
              
              {/* Top Section: Navigation & Progress */}
              <div className="w-full max-w-4xl z-40 pt-4 px-6 flex flex-col items-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-1.5 w-16 md:w-32 bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className="h-full bg-amber-500 shadow-[0_0_10px_rgba(217,119,6,0.8)]" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(state.cards.length / currentConfig.count) * 100}%` }}
                    />
                  </div>
                  <h2 className="font-cinzel text-2xl md:text-4xl text-amber-500 uppercase tracking-widest font-bold">
                    {state.cards.length} <span className="text-slate-600">/</span> {currentConfig.count}
                  </h2>
                  <div className="h-1.5 w-16 md:w-32 bg-white/5 rounded-full shadow-inner" />
                </div>
                
                {/* Slots Area */}
                <div className="flex flex-wrap gap-2 md:gap-4 justify-center max-w-full mb-4">
                  {Array.from({ length: currentConfig.count }).map((_, idx) => (
                    <motion.div 
                      key={idx} 
                      className={`relative w-12 h-20 md:w-20 md:h-32 rounded-xl border-2 flex items-center justify-center transition-all duration-700 overflow-hidden ${state.cards[idx] ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(217,119,6,0.1)]' : 'border-dashed border-white/5 bg-white/2'}`}
                      animate={state.cards[idx] ? { scale: [1, 1.05, 1], y: [0, -5, 0] } : {}}
                    >
                      {state.cards[idx] ? (
                        <Card card={state.cards[idx].card} isFlipped={false} className="w-full h-full opacity-60 scale-90" />
                      ) : (
                        <div className="text-[6px] md:text-[9px] font-cinzel text-white/10 uppercase text-center leading-tight px-1 font-bold">
                          {(t.positions as any)[currentConfig.positions[idx]]}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CENTER PICKING AREA - HORIZONTAL DECK */}
              <div className="flex-1 w-full relative flex items-center justify-center overflow-visible mt-10">
                <motion.div 
                  drag="x"
                  dragConstraints={{ left: -3000, right: 3000 }}
                  dragElastic={0.05}
                  dragMomentum={true}
                  onDrag={(e, info) => deckX.set(info.offset.x)}
                  className="absolute h-full flex items-center justify-center cursor-grab active:cursor-grabbing w-[6000px]"
                  style={{ x: smoothDeckX }}
                >
                  <div className="flex items-center justify-center space-x-[-40px] md:space-x-[-60px]">
                    {pickingDeck.map((card, idx) => {
                      return (
                        <CardInDeck 
                          key={card.id} 
                          card={card} 
                          index={idx} 
                          total={pickingDeck.length} 
                          smoothDeckX={smoothDeckX} 
                          onPick={() => onCardPick(card)}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Help & Instruction */}
              <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-50 px-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex flex-col items-center gap-4"
                >
                  <div className="bg-[#0f172a]/90 backdrop-blur-2xl px-8 py-4 rounded-full border border-amber-600/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(217,119,6,1)]"></div>
                    <span className="font-cinzel text-xs md:text-sm text-amber-500 uppercase tracking-[0.4em] font-bold">
                      {t.mixingDesc}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-bold animate-pulse">Sola/Sağa kaydır ve bir kart seç</p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {step === 'reading' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full max-w-5xl mx-auto px-4 py-8 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="py-40 text-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 border-t-4 border-amber-500 rounded-full mx-auto mb-8 shadow-[0_0_30px_rgba(217,119,6,0.3)]"
                  ></motion.div>
                  <h2 className="font-cinzel text-2xl text-amber-500 uppercase animate-pulse tracking-[0.3em] font-bold">{t.drawingBtn}</h2>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap justify-center gap-x-10 gap-y-24 mb-24 px-4 w-full pt-16">
                    {state.cards.map((item, idx) => (
                      <Card 
                        key={`${item.card.id}-${idx}`} 
                        card={item.card} 
                        isFlipped={true} 
                        isReversed={item.isReversed} 
                        positionName={item.positionName}
                        delay={idx * 0.2}
                      />
                    ))}
                  </div>

                  <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
                    <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 p-8 md:p-12 rounded-[3rem] backdrop-blur-md shadow-3xl">
                      <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                        <h3 className="font-cinzel text-amber-500 text-2xl md:text-3xl uppercase font-bold tracking-widest">{t.readingTitle}</h3>
                        <button onClick={reset} className="text-xs text-slate-500 hover:text-amber-500 flex items-center gap-2 uppercase transition-all font-bold hover:scale-105">
                          <RefreshCw size={14} /> {t.backBtn}
                        </button>
                      </div>
                      <div className="prose prose-invert max-w-none text-slate-300 font-serif leading-relaxed whitespace-pre-line text-lg md:text-xl selection:bg-amber-500/30">
                        {state.interpretation}
                      </div>
                    </div>

                    <div className="bg-amber-600/5 border border-amber-600/10 rounded-[2.5rem] p-8 flex flex-col h-[650px] shadow-3xl backdrop-blur-sm">
                      <h3 className="font-cinzel text-amber-500 text-xl mb-8 flex items-center gap-3 uppercase font-bold tracking-widest">
                        <MessageCircle size={22} className="text-amber-600" /> {t.rumiTitle}
                      </h3>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2 mb-6">
                        {state.followUpQuestions.length === 0 && (
                          <div className="text-center py-20 opacity-30 italic text-base font-playfair">{t.rumiDesc}</div>
                        )}
                        {state.followUpQuestions.map((f, i) => (
                          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={i} className="bg-black/40 p-5 rounded-2xl border border-white/5 text-sm shadow-inner group">
                            <div className="text-amber-500 font-bold mb-3 italic">"{f.question}"</div>
                            <div className="text-slate-400 font-serif leading-relaxed">{f.answer}</div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
                        <textarea 
                          value={currentQuestion}
                          onChange={(e) => setCurrentQuestion(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-amber-600/50 resize-none text-slate-200 placeholder:text-slate-700 shadow-inner transition-all"
                          placeholder="Rumi'ye sor..."
                          rows={3}
                        />
                        <button 
                          onClick={async () => {
                            if (!currentQuestion.trim() || state.questionsRemaining <= 0) return;
                            setLoading(true);
                            const rumiCards = getFullDeck(DeckType.RUMI);
                            const selection = { card: rumiCards[Math.floor(Math.random() * rumiCards.length)], isReversed: false };
                            const answer = await getRumiFollowUpAnswer(currentQuestion, selection, lang);
                            setState(prev => ({
                              ...prev,
                              questionsRemaining: prev.questionsRemaining - 1,
                              followUpQuestions: [...prev.followUpQuestions, { question: currentQuestion, card: selection, answer }]
                            }));
                            setCurrentQuestion('');
                            setLoading(false);
                          }}
                          disabled={!currentQuestion.trim() || state.questionsRemaining <= 0}
                          className="w-full py-4 bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs uppercase tracking-[0.3em] disabled:opacity-20 transition-all hover:bg-amber-500 shadow-xl active:scale-95"
                        >
                          {t.askBtn} ({state.questionsRemaining})
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {step === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto w-full px-6 py-10">
              <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-8">
                <h2 className="font-cinzel text-3xl md:text-4xl uppercase tracking-[0.2em] font-bold text-white/90">{t.historyTitle}</h2>
                <button onClick={() => setStep('welcome')} className="text-slate-500 hover:text-white p-3 hover:bg-white/5 rounded-full transition-all"><X size={28} /></button>
              </div>
              <div className="grid gap-6">
                {history.length > 0 ? history.map((reading) => (
                  <motion.div 
                    key={reading.id} 
                    whileHover={{ scale: 1.01, x: 5 }}
                    className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center hover:bg-slate-900/80 transition-all group shadow-2xl"
                  >
                    <div>
                      <span className="text-amber-500 font-cinzel text-xl uppercase font-bold tracking-wider">{(t.spreads as any)[reading.spreadType]}</span>
                      <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.2em] font-bold">{reading.date} • {reading.deckType}</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => toggleFavorite(reading.id)} className={`p-3 rounded-full transition-all ${reading.isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-slate-700 hover:text-amber-500/50 hover:bg-white/5'}`}>
                        <Star size={22} fill={reading.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <button onClick={() => deleteReading(reading.id)} className="p-3 rounded-full text-slate-800 hover:text-red-500 hover:bg-red-500/5 transition-all">
                        <Trash2 size={22} />
                      </button>
                    </div>
                  </motion.div>
                )) : (
                  <div className="text-center py-32 text-slate-700 italic uppercase tracking-[0.5em] text-sm font-bold">{t.noHistory}</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 text-center text-slate-800 text-[10px] uppercase tracking-[0.6em] font-bold">
        <p className="opacity-30">{t.footer}</p>
      </footer>
    </div>
  );
};

// Component for Individual Cards in the picking deck
const CardInDeck: React.FC<{ 
  card: TarotCard, 
  index: number, 
  total: number, 
  smoothDeckX: any,
  onPick: () => void 
}> = ({ card, index, total, smoothDeckX, onPick }) => {
  // Use a stable position based on index, then apply the drag offset
  const cardWidth = 100;
  const spacing = 50;
  const initialX = (index - total / 2) * spacing;

  // We want to calculate the current screen position of this card
  // smoothDeckX is a motion value representing the drag offset
  const currentGlobalX = useTransform(smoothDeckX, (val) => val + initialX);

  // Proximity to center of screen (0 is center)
  // Higher proximity means more scale and higher Y
  const scale = useTransform(currentGlobalX, [-400, 0, 400], [0.7, 1.2, 0.7]);
  const rotation = useTransform(currentGlobalX, [-600, 0, 600], [-35, 0, 35]);
  const yOffset = useTransform(currentGlobalX, [-500, 0, 500], [120, -40, 120]); // Important: -40 lifts it up, positive values lower it
  const opacity = useTransform(currentGlobalX, [-1200, -800, 0, 800, 1200], [0, 0.4, 1, 0.4, 0]);

  return (
    <motion.div
      style={{
        x: initialX,
        y: yOffset,
        rotate: rotation,
        scale: scale,
        opacity: opacity,
        position: 'absolute',
        zIndex: useTransform(currentGlobalX, [-200, 0, 200], [1, 100, 1])
      }}
      onClick={onPick}
      className="cursor-pointer group"
    >
      <div className="relative">
        <Card isFlipped={false} className="w-24 h-40 md:w-36 md:h-56 shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-white/5 group-hover:border-amber-500/50 transition-colors" />
        <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 rounded-xl transition-colors pointer-events-none"></div>
      </div>
    </motion.div>
  );
};

export default App;
