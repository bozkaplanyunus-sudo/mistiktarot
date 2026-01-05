
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  History, 
  ChevronLeft, 
  Send, 
  RotateCcw, 
  MessageCircle, 
  Globe,
  Clock,
  BookOpen,
  Layers
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

const App: React.FC = () => {
  // --- STATE ---
  const [lang, setLang] = useState<Language>(Language.TR);
  const [view, setView] = useState<'welcome' | 'deck-selection' | 'spread-selection' | 'mixing' | 'drawing' | 'reading' | 'history'>('welcome');
  const [reading, setReading] = useState<ReadingState>({
    deck: null,
    spread: null,
    cards: [],
    interpretation: '',
    questionsRemaining: 3,
    followUpQuestions: []
  });
  const [history, setHistory] = useState<SavedReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [rumiInput, setRumiInput] = useState('');
  const [activeReadingId, setActiveReadingId] = useState<string | null>(null);

  const t = translations[lang];

  // --- ACTIONS ---
  const toggleLanguage = () => {
    setLang(prev => prev === Language.TR ? Language.EN : (prev === Language.EN ? Language.FR : Language.TR));
  };

  const startNewReading = () => {
    setView('deck-selection');
    setReading({
      deck: null,
      spread: null,
      cards: [],
      interpretation: '',
      questionsRemaining: 3,
      followUpQuestions: []
    });
  };

  const selectDeck = (deck: DeckType) => {
    setReading(prev => ({ ...prev, deck }));
    setView('spread-selection');
  };

  const selectSpread = (spread: SpreadType) => {
    setReading(prev => ({ ...prev, spread }));
    setView('mixing');
    setTimeout(() => setView('drawing'), 3000);
  };

  const drawNextCard = () => {
    const config = SPREAD_CONFIGS[reading.spread!];
    const currentCount = reading.cards.length;
    
    if (currentCount >= config.count) return;

    const deck = getFullDeck(reading.deck!);
    // Rastgele kart seçimi
    let randomCard: TarotCard;
    let isReversed: boolean;
    
    do {
      const idx = Math.floor(Math.random() * deck.length);
      randomCard = deck[idx];
      isReversed = Math.random() > 0.7; // %30 ters gelme şansı
    } while (reading.cards.some(c => c.card.id === randomCard.id));

    const newSelection: CardSelection = {
      card: randomCard,
      isReversed,
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
      const result = await getTarotInterpretation(
        reading.deck!,
        reading.spread!,
        finalCards,
        lang
      );
      
      setReading(prev => ({ ...prev, interpretation: result }));
      
      const newSaved: SavedReading = {
        id: Date.now().toString(),
        date: new Date().toLocaleString(lang === Language.TR ? 'tr-TR' : 'en-US'),
        deckType: reading.deck!,
        spreadType: reading.spread!,
        cards: finalCards,
        interpretation: result,
        followUps: [],
        isFavorite: false
      };
      setHistory(prev => [newSaved, ...prev]);
      setActiveReadingId(newSaved.id);
    } catch (error) {
      console.error(error);
      setReading(prev => ({ ...prev, interpretation: "Mistik kanallar şu an kapalı..." }));
    } finally {
      setLoading(false);
    }
  };

  const handleRumiAsk = async () => {
    if (!rumiInput.trim() || reading.questionsRemaining === 0 || loading) return;

    setLoading(true);
    const randomCard = reading.cards[Math.floor(Math.random() * reading.cards.length)];
    const answer = await getRumiFollowUpAnswer(rumiInput, randomCard, lang);
    
    const newFollowUp: FollowUp = {
      question: rumiInput,
      card: randomCard,
      answer
    };

    setReading(prev => ({
      ...prev,
      questionsRemaining: prev.questionsRemaining - 1,
      followUpQuestions: [...prev.followUpQuestions, newFollowUp]
    }));

    setRumiInput('');
    setLoading(false);
  };

  // --- RENDER FUNCTIONS ---

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 flex-1">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8 w-32 h-32 rounded-full border-2 border-amber-500/30 flex items-center justify-center bg-amber-500/5 animate-glow">
        <Sparkles className="text-amber-500 w-16 h-16" />
      </motion.div>
      <h2 className="font-cinzel text-3xl md:text-5xl text-amber-500 mb-6 tracking-widest">{t.welcomeTitle}</h2>
      <p className="font-playfair text-lg md:text-xl text-slate-300 max-w-xl italic mb-12 leading-relaxed">{t.welcomeSub}</p>
      <button onClick={startNewReading} className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-4 px-12 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl font-cinzel tracking-widest uppercase">
        {t.startBtn}
      </button>
      {history.length > 0 && (
        <button onClick={() => setView('history')} className="mt-8 flex items-center gap-2 text-amber-500/60 hover:text-amber-500 transition-colors uppercase font-bold text-xs tracking-widest">
          <History size={16} /> {t.historyTitle}
        </button>
      )}
    </div>
  );

  const renderDeckSelection = () => (
    <div className="flex flex-col items-center px-6 py-12 max-w-4xl mx-auto flex-1">
      <h2 className="font-cinzel text-2xl md:text-3xl text-amber-500 mb-12 tracking-widest text-center">{t.selectDeck}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {[
          { type: DeckType.RIDER_WAITE, title: t.deckRiderTitle, desc: t.deckRiderDesc, icon: <Sparkles /> },
          { type: DeckType.MARSEILLE, title: t.deckMarseilleTitle, desc: t.deckMarseilleDesc, icon: <BookOpen /> }
        ].map(deck => (
          <motion.div key={deck.type} whileHover={{ y: -5 }} onClick={() => selectDeck(deck.type)} className="bg-slate-900/40 border border-amber-500/20 p-8 rounded-2xl cursor-pointer hover:border-amber-500/60 transition-all group">
            <div className="text-amber-500 mb-4 group-hover:scale-110 transition-transform">{deck.icon}</div>
            <h3 className="font-cinzel text-xl text-white mb-2">{deck.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{deck.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderSpreadSelection = () => (
    <div className="flex flex-col items-center px-6 py-12 max-w-4xl mx-auto flex-1">
      <h2 className="font-cinzel text-2xl md:text-3xl text-amber-500 mb-12 tracking-widest text-center">{t.selectSpread}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {Object.entries(SPREAD_CONFIGS).map(([type, config]) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            onClick={() => selectSpread(type as SpreadType)}
            className="flex flex-col items-center p-6 bg-slate-900/40 border border-amber-500/10 rounded-xl hover:border-amber-500 transition-all"
          >
            <Layers className="text-amber-500 mb-3" size={32} />
            <span className="font-cinzel text-xs text-center leading-tight uppercase tracking-tighter">
              {t.spreads[type as SpreadType]}
            </span>
            <span className="text-[10px] text-slate-500 mt-2 font-bold">{config.count} {lang === Language.TR ? 'Kart' : 'Cards'}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderMixing = () => (
    <div className="flex flex-col items-center justify-center text-center p-12 h-full flex-1">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="mb-12 relative w-48 h-48">
        <div className="absolute inset-0 border-4 border-dashed border-amber-500/20 rounded-full" />
        <div className="absolute inset-4 border-2 border-amber-500/40 rounded-full flex items-center justify-center">
          <Sparkles className="text-amber-500 w-12 h-12" />
        </div>
      </motion.div>
      <h2 className="font-cinzel text-2xl text-amber-500 mb-4 tracking-widest">{t.mixingTitle}</h2>
      <p className="font-playfair text-slate-400 italic">{t.mixingDesc}</p>
    </div>
  );

  const renderDrawing = () => {
    const config = SPREAD_CONFIGS[reading.spread!];
    const drawnCount = reading.cards.length;

    return (
      <div className="flex flex-col h-full w-full max-w-6xl mx-auto overflow-hidden p-4">
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center justify-start pt-8">
          <h2 className="font-cinzel text-lg text-amber-500 mb-8 tracking-[0.3em] uppercase opacity-60">
            {t.spreads[reading.spread!]}
          </h2>
          
          <div className="flex flex-wrap justify-center gap-6 w-full max-w-4xl px-4 pb-12">
            {Array.from({ length: config.count }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 w-28 md:w-36">
                <Card 
                  card={reading.cards[i]?.card}
                  isFlipped={!!reading.cards[i]}
                  isReversed={reading.cards[i]?.isReversed}
                  positionName={reading.cards[i]?.positionName || (t.positions as any)[config.positions[i]]}
                  noHover
                  className="w-full aspect-[2/3.5]"
                />
              </div>
            ))}
          </div>
        </div>

        {drawnCount < config.count && (
          <div className="h-64 relative flex items-end justify-center overflow-hidden pb-8 mt-4 border-t border-amber-500/5 bg-slate-950/20 rounded-t-[3rem]">
            <div className="absolute top-4 left-0 right-0 text-center">
              <span className="font-cinzel text-[10px] text-amber-500/40 uppercase tracking-[0.4em]">
                {t.drawBtn} ({drawnCount} / {config.count})
              </span>
            </div>
            
            <div className="relative w-full flex justify-center h-48 pointer-events-auto">
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={i}
                  style={{ transformOrigin: 'bottom center', transform: `rotate(${(i - 7) * 4}deg) translateX(${i * 2}px)` }}
                  whileHover={{ y: -20 }}
                  onClick={drawNextCard}
                  className="absolute bottom-0 w-24 h-40 bg-slate-900 border border-amber-600/30 rounded-lg cursor-pointer shadow-2xl overflow-hidden hover:border-amber-400 group"
                >
                  <div className="w-full h-full flex items-center justify-center bg-[#0a0f1e]">
                    <div className="text-amber-500/10 text-2xl group-hover:text-amber-500/30">✦</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReading = () => (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-6 overflow-y-auto custom-scrollbar flex-1">
      {/* SEÇİLEN KARTLARIN GÖRÜNMESİ İÇİN ÜST ALAN */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-16 py-8">
        {reading.cards.map((c, i) => (
          <div key={i} className="w-24 md:w-36">
            <Card 
              card={c.card} 
              isFlipped={true} 
              isReversed={c.isReversed} 
              positionName={c.positionName} 
              noHover 
              className="w-full aspect-[2/3.5]"
            />
          </div>
        ))}
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-amber-500/10 shadow-2xl mb-12">
        <div className="flex items-center gap-4 mb-8 border-b border-amber-500/10 pb-4">
          <BookOpen className="text-amber-500" />
          <h2 className="font-cinzel text-xl md:text-2xl text-amber-500 tracking-widest uppercase">{t.readingTitle}</h2>
        </div>
        
        {loading && !reading.interpretation ? (
          <div className="space-y-4">
            <div className="h-4 bg-slate-800 rounded animate-pulse w-full" />
            <div className="h-4 bg-slate-800 rounded animate-pulse w-[90%]" />
            <div className="h-4 bg-slate-800 rounded animate-pulse w-[95%]" />
          </div>
        ) : (
          <div className="prose prose-invert max-w-none whitespace-pre-wrap font-playfair text-lg leading-relaxed text-slate-200">
            {reading.interpretation}
          </div>
        )}
      </div>

      {/* RUMI SORU KÖŞESİ */}
      <div className="bg-indigo-950/20 backdrop-blur-md rounded-3xl p-8 border border-indigo-500/20 shadow-2xl mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <MessageCircle className="text-indigo-400" />
            <h2 className="font-cinzel text-lg md:text-xl text-indigo-300 tracking-widest uppercase">{t.rumiTitle}</h2>
          </div>
          <div className="text-[10px] bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 uppercase font-bold">
            {reading.questionsRemaining} {t.questionsLeft}
          </div>
        </div>
        <p className="text-slate-400 text-sm mb-8 font-playfair italic">{t.rumiDesc}</p>

        <div className="space-y-6 mb-8">
          {reading.followUpQuestions.map((q, i) => (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="bg-indigo-900/30 p-6 rounded-2xl border border-indigo-500/10">
              <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2 opacity-60">Soru: {q.question}</p>
              <div className="whitespace-pre-wrap font-playfair text-slate-200">{q.answer}</div>
            </motion.div>
          ))}
        </div>

        {reading.questionsRemaining > 0 && (
          <div className="relative">
            <input 
              value={rumiInput}
              onChange={(e) => setRumiInput(e.target.value)}
              placeholder="..."
              className="w-full bg-slate-950/50 border border-indigo-500/30 rounded-full py-4 px-6 pr-16 focus:outline-none focus:border-indigo-500 transition-all text-slate-100"
              onKeyDown={(e) => e.key === 'Enter' && handleRumiAsk()}
            />
            <button disabled={loading || !rumiInput.trim()} onClick={handleRumiAsk} className="absolute right-2 top-2 p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-full transition-all">
              {loading ? <RotateCcw className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </div>
        )}
      </div>

      <button onClick={() => setView('welcome')} className="self-center mb-12 flex items-center gap-2 text-amber-500/40 hover:text-amber-500 transition-all uppercase font-bold text-xs tracking-[0.2em]">
        <RotateCcw size={16} /> {t.backBtn}
      </button>
    </div>
  );

  const renderHistory = () => (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-6 overflow-y-auto custom-scrollbar flex-1">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setView('welcome')} className="text-slate-400 hover:text-white transition-colors">
          <ChevronLeft />
        </button>
        <h2 className="font-cinzel text-xl text-amber-500 tracking-widest uppercase">{t.historyTitle}</h2>
        <div className="w-6" />
      </div>

      {history.length === 0 ? (
        <div className="text-center py-24 text-slate-600 italic">{t.noHistory}</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-12">
          {history.map(item => (
            <div key={item.id} className="bg-slate-900/40 border border-amber-500/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all cursor-pointer group" onClick={() => {
              setReading({
                deck: item.deckType,
                spread: item.spreadType,
                cards: item.cards,
                interpretation: item.interpretation,
                questionsRemaining: 3 - item.followUps.length,
                followUpQuestions: item.followUps
              });
              setView('reading');
            }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-cinzel mb-1 tracking-wider uppercase text-sm">{(t.spreads as any)[item.spreadType]}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase"><Clock size={12} /> {item.date}</div>
                </div>
                <div className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-amber-500/20 font-bold">{item.deckType}</div>
              </div>
              <div className="flex gap-2 overflow-x-hidden opacity-40 group-hover:opacity-100">
                {item.cards.map((c, i) => (
                  <div key={i} className="w-8 h-12 rounded border border-white/10 overflow-hidden shrink-0">
                    <img src={c.card.imageUrl} className={`w-full h-full object-cover ${c.isReversed ? 'rotate-180' : ''}`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-[#020617] text-slate-100 flex flex-col font-inter selection:bg-amber-500/30 overflow-hidden">
      {/* BG Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-amber-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-amber-500/5 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('welcome')}>
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 group-hover:border-amber-500/50 transition-all">
            <Sparkles className="text-amber-500" size={18} />
          </div>
          <h1 className="font-cinzel text-sm md:text-base text-amber-500 font-bold tracking-[0.2em] uppercase hidden sm:block">Mistik Tarot</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleLanguage} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-amber-500 transition-all px-3 py-1.5 rounded-full border border-white/5 bg-white/10">
            <Globe size={14} /> {lang}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full w-full flex flex-col">
            {view === 'welcome' && renderWelcome()}
            {view === 'deck-selection' && renderDeckSelection()}
            {view === 'spread-selection' && renderSpreadSelection()}
            {view === 'mixing' && renderMixing()}
            {view === 'drawing' && renderDrawing()}
            {view === 'reading' && renderReading()}
            {view === 'history' && renderHistory()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-20 px-6 py-3 border-t border-amber-500/5 text-center bg-slate-950/40 backdrop-blur-md">
        <p className="text-[8px] md:text-[10px] text-slate-600 uppercase tracking-[0.4em] font-bold opacity-60">
          {t.footer}
        </p>
      </footer>
    </div>
  );
};

export default App;
