
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Star, Trash2, X, ChevronRight, Bookmark, MessageCircle, Globe, RefreshCw, Languages, Library } from 'lucide-react';
import { DeckType, SpreadType, CardSelection, ReadingState, SavedReading, Language, TarotCard } from './types';
import { getFullDeck, SPREAD_CONFIGS } from './constants';
import { translations } from './translations';
import { getTarotInterpretation, getRumiFollowUpAnswer } from './services/geminiService';
import Card from './components/Card';

// Sürükleme ve tıklama çakışmasını önleyen gelişmiş bileşen
const DraggableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragThresholdMet, setDragThresholdMet] = useState(false);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!rowRef.current) return;
    setIsDragging(true);
    setDragThresholdMet(false);
    setStartX(e.pageX - rowRef.current.offsetLeft);
    setScrollLeft(rowRef.current.scrollLeft);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !rowRef.current) return;
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (Math.abs(x - startX) > 10) {
      setDragThresholdMet(true);
      rowRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const onMouseUp = () => {
    setTimeout(() => setIsDragging(false), 50);
  };

  const onMouseLeave = () => setIsDragging(false);

  return (
    <div
      ref={rowRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      className="w-full overflow-x-auto custom-scrollbar overflow-y-visible cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center min-w-max px-10 pb-10 pt-6 pointer-events-none">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onClick: (e: React.MouseEvent) => {
                if (dragThresholdMet) {
                  e.preventDefault();
                  e.stopPropagation();
                } else if (child.props.onClick) {
                  child.props.onClick(e);
                }
              }
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.TR);
  const [step, setStep] = useState<'language' | 'welcome' | 'deck' | 'spread' | 'picking' | 'reading' | 'history'>('language');
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
  const [rumiLoading, setRumiLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  
  const t = useMemo(() => translations[lang], [lang]);

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
  };

  const finalizeReading = async (selectedCards: CardSelection[], deck: DeckType, spread: SpreadType) => {
    // Önce stepi değiştiriyoruz, ama seçilen kartların state'e geçtiğinden emin oluyoruz
    setState(prev => ({ ...prev, cards: selectedCards }));
    setStep('reading');
    setLoading(true);

    try {
      const interpretation = await getTarotInterpretation(deck, spread, selectedCards, lang);
      setState(prev => ({ 
        ...prev, 
        interpretation,
        cards: selectedCards
      }));
      
      saveReading({
        deckType: deck,
        spreadType: spread,
        cards: selectedCards,
        interpretation,
        followUps: []
      });
    } catch (e) {
      console.error(e);
      setState(prev => ({ ...prev, interpretation: "Evren şu an sessiz kalmayı seçiyor. Lütfen tekrar deneyin." }));
    } finally {
      setLoading(false);
    }
  };

  const onCardPick = (card: TarotCard) => {
    if (!state.spread || !state.deck) return;
    const config = (SPREAD_CONFIGS as any)[state.spread];
    if (state.cards.length >= config.count) return;

    const newSelection: CardSelection = {
      card,
      isReversed: Math.random() > 0.8,
      positionName: (t.positions as any)[config.positions[state.cards.length]]
    };

    const newCards = [...state.cards, newSelection];
    
    // UI'daki slotları anında doldur
    setState(prev => ({ ...prev, cards: newCards }));
    setPickingDeck(prev => prev.filter(c => c.id !== card.id));

    if (newCards.length === config.count) {
      finalizeReading(newCards, state.deck, state.spread);
    }
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
    setLoading(false);
    setRumiLoading(false);
  };

  const renderTextBlocks = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim().replace(/[*_#]/g, '');
      if (!trimmed) return <div key={i} className="h-4" />;

      const isHeader = trimmed.length < 60 && (trimmed === trimmed.toUpperCase() || !trimmed.endsWith('.'));

      if (isHeader) {
        return (
          <motion.h4 
            key={i} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center text-amber-500 font-cinzel text-xl md:text-2xl mt-10 mb-6 uppercase tracking-[0.2em] font-bold"
          >
            {trimmed}
          </motion.h4>
        );
      }

      return (
        <motion.p 
          key={i} 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="text-justify text-slate-300 font-serif leading-relaxed mb-4 text-lg md:text-xl indent-8"
        >
          {trimmed}
        </motion.p>
      );
    });
  };

  const currentConfig = state.spread ? (SPREAD_CONFIGS as any)[state.spread] : null;

  const deckRows = useMemo(() => {
    const rows = [];
    const totalCards = pickingDeck.length;
    const cardsPerRow = Math.ceil(totalCards / 3) || 1;
    for (let i = 0; i < totalCards; i += cardsPerRow) {
      rows.push(pickingDeck.slice(i, i + cardsPerRow));
    }
    return rows;
  }, [pickingDeck]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-inter overflow-hidden select-none">
      <div className="fixed inset-0 pointer-events-none opacity-30 overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-600 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-950 rounded-full blur-[150px]"></div>
      </div>

      <header className="relative z-[500] w-full max-w-6xl mx-auto px-6 py-4 flex justify-between items-center bg-[#020617]/40 backdrop-blur-xl border-b border-white/5">
        <div className="w-10">
          <button onClick={reset} className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-600/10 border border-amber-600/20 hover:scale-110 transition-transform">
            <span className="text-sm">🔮</span>
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <h1 className="font-cinzel text-xs md:text-sm text-amber-500 font-bold tracking-[0.3em] uppercase text-center cursor-pointer" onClick={reset}>
            Mistik Tarot Rehberi
          </h1>
        </div>
        <div className="w-10 flex justify-end">
          {step !== 'language' && (
            <button onClick={() => setStep('history')} className="p-2.5 bg-amber-600/10 rounded-full border border-amber-600/20 text-amber-500 hover:bg-amber-600/20 transition-all">
              <Library size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto flex flex-col items-center overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'language' && (
            <motion.div key="language" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20 w-full px-6">
              <Globe className="text-amber-500 mx-auto mb-10 animate-pulse" size={40} />
              <h2 className="text-2xl font-cinzel text-white mb-8 tracking-widest uppercase">Select Language</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
                {[
                  { id: Language.TR, label: 'TÜRKÇE', flag: '🇹🇷' },
                  { id: Language.EN, label: 'ENGLISH', flag: '🇺🇸' },
                  { id: Language.FR, label: 'FRANÇAIS', flag: '🇫🇷' }
                ].map(l => (
                  <button key={l.id} onClick={() => { setLang(l.id); setStep('welcome'); }} className="flex-1 py-6 bg-slate-900/40 border border-white/10 rounded-2xl hover:border-amber-500 hover:bg-slate-900 transition-all shadow-xl group">
                    <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform">{l.flag}</span>
                    <span className="font-cinzel text-[10px] text-slate-400 group-hover:text-amber-500 uppercase tracking-widest">{l.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-12 w-full px-6">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }} className="mb-6 inline-block p-5 bg-amber-600/10 rounded-full border border-amber-600/20 shadow-[0_0_40px_rgba(217,119,6,0.2)]">
                <Bookmark className="text-amber-500" size={32} />
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-cinzel text-white mb-6 uppercase tracking-tighter leading-none">{t.welcomeTitle}</h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-12 font-playfair italic text-lg md:text-xl leading-relaxed">{t.welcomeSub}</p>
              <div className="flex flex-col gap-6 items-center">
                <button onClick={() => setStep('deck')} className="group relative px-10 py-3.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-full transition-all shadow-xl uppercase tracking-[0.2em] flex items-center gap-3 text-sm md:text-base">
                  <span>{t.startBtn}</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => setStep('language')} className="flex items-center gap-2 text-xs text-slate-500 hover:text-amber-500 transition-all uppercase tracking-[0.2em] font-bold border border-white/5 px-6 py-2 rounded-full hover:bg-white/5">
                  <Languages size={14} /> {t.changeLangBtn}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'deck' && (
            <motion.div key="deck" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full px-6 py-10">
              {[
                { type: DeckType.RIDER_WAITE, title: t.deckRiderTitle, desc: t.deckRiderDesc, preview: 'https://cdn.jsdelivr.net/gh/ekelen/tarot@master/assets/cards/m00.jpg' },
                { type: DeckType.MARSEILLE, title: t.deckMarseilleTitle, desc: t.deckMarseilleDesc, preview: 'https://cdn.jsdelivr.net/gh/Gideon-Stark/tarot-api@master/static/cards/m00.jpg' }
              ].map((deck) => (
                <motion.div key={deck.type} whileHover={{ y: -10 }} onClick={() => selectDeck(deck.type)} className="group bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] cursor-pointer hover:border-amber-600/50 transition-all text-center shadow-2xl flex flex-col items-center">
                  <div className="w-28 h-44 md:w-36 md:h-56 mb-8 rounded-xl border border-white/10 overflow-hidden bg-black/40 p-2">
                    <img src={deck.preview} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                  </div>
                  <h3 className="font-cinzel text-xl md:text-2xl text-amber-500 mb-3 uppercase tracking-widest">{deck.title}</h3>
                  <p className="text-slate-500 text-xs italic leading-relaxed max-w-[200px]">{deck.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {step === 'spread' && (
            <motion.div key="spread" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto text-center w-full px-6 py-6">
              <h2 className="font-cinzel text-2xl md:text-3xl mb-8 uppercase tracking-[0.2em] text-white/90">{t.selectSpread}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.values(SpreadType).map((spread) => (
                  <button key={spread} onClick={() => selectSpread(spread)} className="p-5 bg-slate-900/40 border border-white/5 rounded-2xl hover:border-amber-600/30 text-left hover:bg-slate-900/80 transition-all flex justify-between items-center group">
                    <div>
                      <div className="font-cinzel text-amber-500 text-base md:text-lg uppercase font-bold tracking-wider">{(t.spreads as any)[spread]}</div>
                      <div className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest">{(SPREAD_CONFIGS as any)[spread].count} {t.drawBtn}</div>
                    </div>
                    <ChevronRight className="text-slate-700 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" size={18} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'picking' && (
            <motion.div key="picking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-[calc(100vh-80px)] flex flex-col items-center overflow-hidden">
              <div className="w-full max-w-4xl z-[150] pt-6 px-6 flex flex-col items-center shrink-0">
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="font-cinzel text-xl md:text-3xl text-amber-500 uppercase tracking-widest font-bold">
                    {state.cards.length} <span className="text-slate-600">/</span> {currentConfig?.count}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-full">
                  {Array.from({ length: currentConfig?.count || 0 }).map((_, idx) => (
                    <div key={idx} className={`relative w-10 h-14 md:w-16 md:h-24 rounded-lg border flex items-center justify-center transition-all duration-700 overflow-hidden ${state.cards[idx] ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'border-dashed border-white/5 bg-white/2'}`}>
                      {state.cards[idx] ? (
                        <Card card={state.cards[idx].card} isFlipped={false} className="w-full h-full opacity-100 scale-90" />
                      ) : (
                        <div className="text-[6px] md:text-[8px] font-cinzel text-white/10 uppercase text-center font-bold px-1">
                          {currentConfig ? (t.positions as any)[currentConfig.positions[idx]] : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col justify-center gap-0 overflow-hidden py-4">
                {deckRows.map((row, rowIndex) => (
                  <motion.div 
                    key={rowIndex} 
                    className="relative" 
                    whileHover={{ zIndex: 1000 }}
                  >
                    <DraggableRow>
                      {row.map((card) => (
                        <motion.div
                          key={card.id}
                          whileHover={{ 
                            y: -40, 
                            scale: 1.35, 
                            zIndex: 2000,
                            transition: { type: 'spring', stiffness: 400, damping: 20 } 
                          }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onCardPick(card)}
                          className="relative -ml-5 first:ml-0 cursor-pointer group pointer-events-auto"
                        >
                          <Card 
                            card={card}
                            isFlipped={false}
                            className="w-14 h-20 md:w-20 md:h-30 shadow-2xl border border-white/10 group-hover:border-amber-500/100 transition-all pointer-events-none"
                          />
                        </motion.div>
                      ))}
                    </DraggableRow>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'reading' && (
            <motion.div 
              key="reading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="w-full flex-1 flex flex-col overflow-y-auto custom-scrollbar h-[calc(100vh-80px)]"
            >
              <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-4 py-8">
                <div className="flex flex-wrap justify-center gap-x-10 gap-y-24 mb-24 px-4 w-full pt-16">
                  {state.cards.map((item, idx) => (
                    <Card key={`${item.card.id}-${idx}`} card={item.card} isFlipped={true} isReversed={item.isReversed} positionName={item.positionName} delay={idx * 0.1} />
                  ))}
                </div>

                {loading && !state.interpretation ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center w-full">
                    <h2 className="font-cinzel text-2xl md:text-3xl text-amber-500 uppercase animate-pulse tracking-[0.4em] font-bold">
                      {t.drawingBtn}
                    </h2>
                    <p className="text-slate-500 font-cinzel text-xs mt-4 tracking-widest uppercase">Kaderin Işığı Yansıtılıyor...</p>
                  </div>
                ) : (
                  <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
                    <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 p-8 md:p-12 rounded-[3rem] backdrop-blur-md">
                      <div className="flex justify-center items-center mb-10 border-b border-white/5 pb-6">
                        <h3 className="font-cinzel text-amber-500 text-2xl md:text-3xl uppercase font-bold tracking-widest">{t.readingTitle}</h3>
                      </div>
                      <div className="max-w-none">
                        {state.interpretation ? renderTextBlocks(state.interpretation) : (
                          <div className="flex flex-col items-center py-10 opacity-20">
                             <RefreshCw className="animate-spin mb-4" size={30} />
                             <p className="font-cinzel uppercase tracking-widest">Yorum Bekleniyor...</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-amber-600/5 border border-amber-600/10 rounded-[2.5rem] p-8 flex flex-col h-[650px] shadow-3xl">
                      <h3 className="font-cinzel text-amber-500 text-xl mb-8 flex justify-center items-center gap-3 uppercase font-bold tracking-widest">
                        {t.rumiTitle}
                      </h3>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2 mb-6">
                        {state.followUpQuestions.length === 0 && !rumiLoading && <div className="text-center py-20 opacity-30 italic text-base font-playfair">{t.rumiDesc}</div>}
                        {state.followUpQuestions.map((f, i) => (
                          <div key={i} className="bg-black/40 p-5 rounded-2xl border border-white/5 text-sm shadow-inner">
                            <div className="text-amber-500 font-bold mb-3 italic text-center uppercase tracking-wider">{f.question}</div>
                            <div className="text-slate-400 font-serif leading-relaxed text-justify">{renderTextBlocks(f.answer)}</div>
                          </div>
                        ))}
                        {rumiLoading && (
                          <div className="flex flex-col items-center py-10 opacity-40">
                            <MessageCircle className="animate-pulse mb-2 text-amber-500" size={24} />
                            <p className="text-[10px] font-cinzel uppercase tracking-[0.2em]">{t.askingBtn}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
                        <textarea value={currentQuestion} onChange={(e) => setCurrentQuestion(e.target.value)} disabled={rumiLoading} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-amber-600/50 resize-none text-slate-200 placeholder:text-slate-700 shadow-inner disabled:opacity-50" placeholder="Rumi'ye sor..." rows={3} />
                        <button onClick={async () => {
                          if (!currentQuestion.trim() || state.questionsRemaining <= 0 || rumiLoading) return;
                          setRumiLoading(true);
                          const rumiCards = getFullDeck(DeckType.RUMI);
                          const selection = { card: rumiCards[Math.floor(Math.random() * rumiCards.length)], isReversed: false };
                          try {
                            const answer = await getRumiFollowUpAnswer(currentQuestion, selection, lang);
                            setState(prev => ({ ...prev, questionsRemaining: prev.questionsRemaining - 1, followUpQuestions: [...prev.followUpQuestions, { question: currentQuestion, card: selection, answer }] }));
                            setCurrentQuestion('');
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setRumiLoading(false);
                          }
                        }} disabled={!currentQuestion.trim() || state.questionsRemaining <= 0 || rumiLoading} className="w-full py-4 bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs uppercase tracking-[0.3em] disabled:opacity-20 transition-all hover:bg-amber-500">
                          {rumiLoading ? t.askingBtn : `${t.askBtn} (${state.questionsRemaining})`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto w-full px-6 py-10 overflow-y-auto h-full">
              <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-8">
                <h2 className="font-cinzel text-3xl md:text-4xl uppercase tracking-[0.2em] font-bold text-white/90">{t.historyTitle}</h2>
                <button onClick={() => setStep('welcome')} className="text-slate-500 hover:text-white p-3 hover:bg-white/5 rounded-full transition-all"><X size={28} /></button>
              </div>
              <div className="grid gap-6">
                {history.length > 0 ? history.map((reading) => (
                  <div key={reading.id} className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] flex justify-between items-center hover:bg-slate-900/80 transition-all group shadow-2xl">
                    <div>
                      <span className="text-amber-500 font-cinzel text-xl uppercase font-bold tracking-wider">{(t.spreads as any)[reading.spreadType]}</span>
                      <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.2em] font-bold">{reading.date} • {reading.deckType}</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => toggleFavorite(reading.id)} className={`p-3 rounded-full transition-all ${reading.isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-slate-700 hover:text-amber-500/50 hover:bg-white/5'}`}><Star size={22} fill={reading.isFavorite ? 'currentColor' : 'none'} /></button>
                      <button onClick={() => deleteReading(reading.id)} className="p-3 rounded-full text-slate-800 hover:text-red-500 hover:bg-red-500/5 transition-all"><Trash2 size={22} /></button>
                    </div>
                  </div>
                )) : <div className="text-center py-32 text-slate-700 italic uppercase tracking-[0.5em] text-sm font-bold">{t.noHistory}</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-[50] w-full max-w-6xl mx-auto px-6 py-4 text-center text-slate-800 text-[10px] uppercase tracking-[0.6em] font-bold">
        <p className="opacity-30">{t.footer}</p>
      </footer>
    </div>
  );
};

export default App;
