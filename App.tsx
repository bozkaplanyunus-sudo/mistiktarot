
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  History, 
  ChevronLeft, 
  ChevronRight,
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

/**
 * Metin içindeki Markdown imajlarını kaldırır ve metni formatlar.
 */
const InterpretationRenderer: React.FC<{ text: string }> = ({ text }) => {
  // Görselleri metinden tamamen temizle
  const regex = /!\[(.*?)\]\((.*?)\)/g;
  const cleanText = text.replace(regex, '');

  // Paragrafları böl ve boş olmayanları al
  const paragraphs = cleanText.split('\n').filter(p => p.trim() !== '');

  return (
    <div className="space-y-6">
      {paragraphs.map((paragraph, i) => {
        // Eğer satır tamamen büyük harfse başlık olarak kabul et
        const isHeading = paragraph === paragraph.toUpperCase() && paragraph.length > 5;
        
        if (isHeading) {
          return (
            <h3 key={i} className="font-cinzel text-amber-500 text-xl md:text-2xl tracking-[0.2em] mt-10 mb-4 uppercase">
              {paragraph}
            </h3>
          );
        }

        return (
          <p 
            key={i} 
            className="font-playfair text-lg leading-relaxed text-slate-300 text-justify indent-12"
          >
            {paragraph.trim()}
          </p>
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.TR);
  const [view, setView] = useState<'language-selection' | 'welcome' | 'deck-selection' | 'spread-selection' | 'mixing' | 'drawing' | 'reading' | 'history'>('language-selection');
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
    let randomCard: TarotCard;
    let isReversed: boolean;
    do {
      const idx = Math.floor(Math.random() * deck.length);
      randomCard = deck[idx];
      isReversed = Math.random() > 0.7;
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
      const result = await getTarotInterpretation(reading.deck!, reading.spread!, finalCards, lang);
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
    const newFollowUp: FollowUp = { question: rumiInput, card: randomCard, answer };
    setReading(prev => ({
      ...prev,
      questionsRemaining: prev.questionsRemaining - 1,
      followUpQuestions: [...prev.followUpQuestions, newFollowUp]
    }));
    setRumiInput('');
    setLoading(false);
  };

  // --- RENDER FUNCTIONS ---

  const renderLanguageSelection = () => (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 flex-1">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-12">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-amber-500/30 flex items-center justify-center bg-amber-500/5 shadow-[0_0_50px_rgba(217,119,6,0.1)]">
           <Globe className="text-amber-500 w-10 h-10 animate-pulse" />
        </div>
        <h2 className="font-cinzel text-2xl md:text-4xl text-amber-500 mb-4 tracking-[0.3em] uppercase">Choose Your Path</h2>
        <p className="font-playfair text-slate-400 italic">Select your language to begin the journey</p>
      </motion.div>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {[
          { id: Language.TR, label: 'türkçe', sub: 'kehaneti ana dilinde dinle' },
          { id: Language.EN, label: 'english', sub: 'hear the prophecy in english' },
          { id: Language.FR, label: 'français', sub: 'écoutez la prophétie en français' }
        ].map((langOption) => (
          <motion.button
            key={langOption.id}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(217, 119, 6, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageSelect(langOption.id)}
            className="group flex flex-col items-center py-4 px-8 rounded-2xl border border-amber-500/20 bg-slate-900/40 backdrop-blur-sm transition-all hover:border-amber-500/60"
          >
            <span className="font-cinzel text-lg text-white tracking-widest lowercase group-hover:text-amber-400">{langOption.label}</span>
            <span className="text-[10px] text-slate-500 lowercase tracking-tighter mt-1">{langOption.sub}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 flex-1">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8 w-32 h-32 rounded-full border-2 border-amber-500/30 flex items-center justify-center bg-amber-500/5 animate-glow">
        <Sparkles className="text-amber-500 w-16 h-16" />
      </motion.div>
      <h2 className="font-cinzel text-3xl md:text-5xl text-amber-500 mb-6 tracking-widest">{t.welcomeTitle}</h2>
      <p className="font-playfair text-lg md:text-xl text-slate-400 max-w-xl italic mb-12 leading-relaxed font-normal">{t.welcomeSub}</p>
      <button onClick={startNewReading} className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-4 px-12 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl font-cinzel tracking-widest uppercase">
        {t.startBtn}
      </button>
      {history.length > 0 && (
        <button onClick={() => setView('history')} className="mt-8 flex items-center gap-2 text-amber-500/60 hover:text-amber-500 transition-colors uppercase font-bold text-xs tracking-widest">
          <History size={16} /> {t.historyTitle}
        </button>
      )}
      <button onClick={() => setView('language-selection')} className="mt-4 text-[10px] text-slate-600 hover:text-amber-500/60 transition-colors uppercase font-bold tracking-[0.2em]">
        {t.changeLangBtn}
      </button>
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
    <div className="flex flex-col items-center px-6 py-12 max-w-2xl mx-auto flex-1 w-full">
      <h2 className="font-cinzel text-2xl md:text-3xl text-amber-500 mb-12 tracking-widest text-center">{t.selectSpread}</h2>
      <div className="flex flex-col gap-4 w-full">
        {Object.entries(SPREAD_CONFIGS).map(([type, config]) => (
          <motion.button
            key={type}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ x: 10, backgroundColor: 'rgba(217, 119, 6, 0.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectSpread(type as SpreadType)}
            className="flex items-center p-6 bg-slate-900/40 border border-amber-500/10 rounded-2xl hover:border-amber-500 transition-all text-left group"
          >
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 mr-6 group-hover:border-amber-500/50 transition-all">
              <Layers className="text-amber-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-cinzel text-white text-lg tracking-wider uppercase group-hover:text-amber-400 transition-colors">
                {t.spreads[type as SpreadType]}
              </h3>
              <p className="text-[10px] text-amber-500/60 font-bold uppercase tracking-[0.2em] mt-1">
                {config.count} {lang === Language.TR ? 'Kartlık Enerji Portalı' : 'Card Energy Portal'}
              </p>
            </div>
            <ChevronRight className="text-amber-500/30 group-hover:text-amber-500 transition-all group-hover:translate-x-1" size={20} />
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
    const rows = [0, 1, 2, 3];
    const totalCardsInDeck = 78;
    const cardsPerRow = Math.ceil(totalCardsInDeck / rows.length);
    const isCeltic = reading.spread === SpreadType.CELTIC_CROSS;

    return (
      <div className="flex flex-col h-full w-full max-w-7xl mx-auto overflow-hidden">
        {/* ÜST ALAN: SEÇİLEN KARTLAR */}
        <div className="flex-none h-[25%] overflow-y-auto custom-scrollbar flex flex-col items-center py-2 px-4 border-b border-amber-500/5">
          <div className="mb-2 text-center">
             <h2 className="font-cinzel text-[8px] text-amber-500/40 mb-0.5 tracking-[0.4em] uppercase">
              {t.spreads[reading.spread!]}
            </h2>
            <div className="text-[8px] font-bold text-amber-500/80 uppercase tracking-widest bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/20">
               {drawnCount} / {config.count} {lang === Language.TR ? 'Kart' : 'Cards'}
            </div>
          </div>
          
          <div className={`flex ${isCeltic ? 'flex-nowrap overflow-x-auto justify-start md:justify-center w-full max-w-none' : 'flex-wrap justify-center w-full max-w-4xl'} gap-2 md:gap-4 pb-2 scroll-smooth`}>
            {Array.from({ length: config.count }).map((_, i) => (
              <div key={i} className={`flex flex-col items-center gap-1 ${isCeltic ? 'w-8 md:w-14 shrink-0' : 'w-9 md:w-14'}`}>
                <Card 
                  card={reading.cards[i]?.card}
                  isFlipped={!!reading.cards[i]}
                  isReversed={reading.cards[i]?.isReversed}
                  noHover
                  className="w-full aspect-[2/3.5]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ALT ALAN: DESTE */}
        {drawnCount < config.count && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex-1 bg-slate-950/40 backdrop-blur-md py-1 overflow-hidden flex flex-col justify-center"
          >
            <div className="px-8 mb-1">
               <span className="font-cinzel text-[7px] text-amber-500/30 uppercase tracking-[0.5em] block text-center italic">
                {lang === Language.TR ? 'Niyetine odaklan ve kartlarını seç' : 'Focus on your intention and pick your cards'}
               </span>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 justify-center pb-2">
              {rows.map((rowIdx) => (
                <div key={rowIdx} className="flex overflow-x-auto custom-scrollbar px-12 gap-2 pb-0.5 mask-fade-edges">
                  {Array.from({ length: cardsPerRow }).map((_, colIdx) => {
                    const currentCardIdx = rowIdx * cardsPerRow + colIdx;
                    if (currentCardIdx >= totalCardsInDeck) return null;
                    
                    return (
                      <motion.div
                        key={currentCardIdx}
                        whileHover={{ y: -4, scale: 1.05, borderColor: 'rgba(217, 119, 6, 0.6)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={drawNextCard}
                        className="w-9 md:w-12 aspect-[2/3.5] bg-[#0a0f1e] border border-amber-600/20 rounded-lg cursor-pointer shadow-lg shrink-0 relative group transition-all"
                      >
                        <div className="absolute inset-0 bg-[#0a0f1e] rounded-lg overflow-hidden flex items-center justify-center">
                          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0l10 10-10 10L0 10z' fill='%23d97706' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>
                          <div className="text-amber-500/10 text-[7px] group-hover:text-amber-500/40 transition-colors">✦</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const renderReading = () => (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-6 overflow-y-auto custom-scrollbar flex-1">
      {/* ÜSTTEKİ KARTLAR VE POZİSYONLARI */}
      <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-16 py-10">
        {reading.cards.map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-5 w-24 md:w-36">
            <Card 
              card={c.card} 
              isFlipped={true} 
              isReversed={c.isReversed} 
              noHover
              noBorder
              className="w-full aspect-[2/3.5]" 
            />
            <div className="text-center">
              <span className="font-cinzel text-[10px] md:text-xs text-amber-500/80 font-bold uppercase tracking-[0.2em]">
                {c.positionName}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 md:p-14 border border-amber-500/5 shadow-inner mb-16">
        <div className="flex items-center gap-4 mb-10 border-b border-amber-500/10 pb-6">
          <BookOpen className="text-amber-500/60" size={28} />
          <h2 className="font-cinzel text-xl md:text-2xl text-amber-500 tracking-[0.2em] uppercase">{t.readingTitle}</h2>
        </div>
        
        {loading && !reading.interpretation ? (
          <div className="space-y-6">
            <div className="h-4 bg-slate-800/40 rounded animate-pulse w-full" />
            <div className="h-4 bg-slate-800/40 rounded animate-pulse w-[92%]" />
            <div className="h-4 bg-slate-800/40 rounded animate-pulse w-[96%]" />
            <div className="h-4 bg-slate-800/40 rounded animate-pulse w-[88%]" />
          </div>
        ) : (
          <InterpretationRenderer text={reading.interpretation} />
        )}
      </div>

      {/* RUMİ KÖŞESİ */}
      <div className="bg-indigo-950/10 backdrop-blur-md rounded-3xl p-8 border border-indigo-500/10 shadow-xl mb-16">
        <div className="flex items-center justify-between mb-8 border-b border-amber-500/10 pb-6">
          <div className="flex items-center gap-4">
            <MessageCircle className="text-amber-500/60" size={28} />
            <h2 className="font-cinzel text-xl md:text-2xl text-amber-500 tracking-[0.2em] uppercase">{t.rumiTitle}</h2>
          </div>
          <div className="text-[10px] bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 uppercase font-bold">
            {reading.questionsRemaining} {t.questionsLeft}
          </div>
        </div>
        <p className="text-slate-400 text-sm mb-10 font-playfair italic leading-relaxed">{t.rumiDesc}</p>
        <div className="space-y-8 mb-10">
          {reading.followUpQuestions.map((q, i) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className="bg-slate-950/30 p-8 rounded-2xl border border-white/5">
              <p className="text-amber-500/60 text-xs font-bold uppercase tracking-widest mb-4 italic">Soru: {q.question}</p>
              <InterpretationRenderer text={q.answer} />
            </motion.div>
          ))}
        </div>
        {reading.questionsRemaining > 0 && (
          <div className="relative">
            <input 
              value={rumiInput}
              onChange={(e) => setRumiInput(e.target.value)}
              placeholder="..."
              className="w-full bg-slate-950/40 border border-white/10 rounded-full py-5 px-8 pr-20 focus:outline-none focus:border-amber-500/50 transition-all text-slate-100 placeholder:text-slate-700"
              onKeyDown={(e) => e.key === 'Enter' && handleRumiAsk()}
            />
            <button disabled={loading || !rumiInput.trim()} onClick={handleRumiAsk} className="absolute right-2.5 top-2.5 p-3.5 bg-amber-600/80 hover:bg-amber-500 disabled:bg-slate-800 text-white rounded-full transition-all shadow-lg">
              {loading ? <RotateCcw className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        )}
      </div>
      
      <button onClick={() => setView('welcome')} className="self-center mb-16 flex items-center gap-3 text-slate-500 hover:text-amber-500 transition-all uppercase font-bold text-xs tracking-[0.3em]">
        <RotateCcw size={18} /> {t.backBtn}
      </button>
    </div>
  );

  const renderHistory = () => (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-6 overflow-y-auto custom-scrollbar flex-1">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setView('welcome')} className="text-slate-400 hover:text-white transition-colors"><ChevronLeft /></button>
        <h2 className="font-cinzel text-xl text-amber-500 tracking-widest uppercase">{t.historyTitle}</h2><div className="w-6" />
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
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-amber-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[120px]" />
      </div>
      
      {view !== 'language-selection' && (
        <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-amber-500/5 bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('welcome')}>
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 group-hover:border-amber-500/50 transition-all"><Sparkles className="text-amber-500" size={18} /></div>
            <h1 className="font-cinzel text-sm md:text-base text-amber-500 font-bold tracking-[0.2em] uppercase hidden sm:block">Mistik Tarot</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setView('language-selection')} className="flex items-center gap-2 text-[10px] font-bold lowercase tracking-widest text-slate-400 hover:text-amber-500 transition-all px-3 py-1.5 rounded-full border border-white/5 bg-white/10"><Globe size={14} /> {lang}</button>
          </div>
        </header>
      )}

      <main className="relative z-10 flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full w-full flex flex-col">
            {view === 'language-selection' && renderLanguageSelection()}
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
        <p className="text-[8px] md:text-[10px] text-slate-600 uppercase tracking-[0.4em] font-bold opacity-60">{t.footer}</p>
      </footer>
    </div>
  );
};

export default App;
