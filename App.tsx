
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, History, Star, Home, Settings, Trash2, X, ChevronRight, Bookmark } from 'lucide-react';
import { DeckType, SpreadType, CardSelection, ReadingState, SavedReading, UserProfile } from './types';
import { getFullDeck, SPREAD_CONFIGS } from './constants';
import { getTarotInterpretation, getRumiFollowUpAnswer } from './services/geminiService';
import Card from './components/Card';

const App: React.FC = () => {
  const [step, setStep] = useState<'welcome' | 'deck' | 'spread' | 'drawing' | 'reading' | 'history'>('welcome');
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
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [viewingReading, setViewingReading] = useState<SavedReading | null>(null);

  // Persistence
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
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
      isFavorite: false
    };
    setHistory(prev => [newReading, ...prev]);
  };

  const toggleFavorite = (id: string) => {
    setHistory(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
  };

  const deleteReading = (id: string) => {
    setHistory(prev => prev.filter(r => r.id !== id));
    if (viewingReading?.id === id) setViewingReading(null);
  };

  const selectDeck = (deck: DeckType) => {
    setState(prev => ({ ...prev, deck }));
    setStep('spread');
  };

  const selectSpread = (spread: SpreadType) => {
    setState(prev => ({ ...prev, spread }));
    setStep('drawing');
  };

  const drawCards = useCallback(async () => {
    if (!state.deck || !state.spread) return;
    setLoading(true);
    
    const deckCards = getFullDeck(state.deck);
    const config = SPREAD_CONFIGS[state.spread];
    const shuffled = [...deckCards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, config.count).map((card, i) => ({
      card,
      isReversed: Math.random() > 0.8,
      positionName: config.positions[i]
    }));

    setState(prev => ({ ...prev, cards: selected }));
    
    const interpretation = await getTarotInterpretation(state.deck, state.spread, selected);
    setState(prev => ({ ...prev, interpretation }));
    
    // Auto save
    saveReading({
      deckType: state.deck,
      spreadType: state.spread,
      cards: selected,
      interpretation,
      followUps: []
    });

    setLoading(false);
    setStep('reading');
  }, [state.deck, state.spread]);

  const askRumi = async () => {
    if (state.questionsRemaining <= 0 || !currentQuestion.trim()) return;
    setLoading(true);

    const rumiDeck = getFullDeck(DeckType.RUMI);
    const randomCard = rumiDeck[Math.floor(Math.random() * rumiDeck.length)];
    const selection: CardSelection = {
      card: randomCard,
      isReversed: Math.random() > 0.8
    };

    const answer = await getRumiFollowUpAnswer(currentQuestion, selection);
    
    const newFollowUp = { question: currentQuestion, card: selection, answer };
    
    setState(prev => ({
      ...prev,
      questionsRemaining: prev.questionsRemaining - 1,
      followUpQuestions: [...prev.followUpQuestions, newFollowUp]
    }));

    // Update history entry with follow-ups
    setHistory(prev => {
      const last = prev[0];
      if (!last) return prev;
      return [{ ...last, followUps: [...last.followUps, newFollowUp] }, ...prev.slice(1)];
    });
    
    setCurrentQuestion('');
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-inter">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900 rounded-full blur-[120px]"></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={reset}>
          <div className="w-10 h-10 bg-amber-600/20 rounded-full flex items-center justify-center border border-amber-600/30 group-hover:scale-110 transition-transform">
            <span className="text-xl">✨</span>
          </div>
          <div>
            <h1 className="font-cinzel text-xl text-amber-500 font-bold tracking-widest">MISTIK</h1>
            <p className="text-[10px] text-amber-600/60 uppercase tracking-tighter">Kadim Rehber</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setStep('history')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-500 transition-colors"
          >
            <History size={18} />
            <span className="hidden sm:inline">Geçmiş</span>
          </button>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <input 
              className="bg-transparent border-none text-sm w-20 focus:outline-none" 
              value={user.name} 
              onChange={(e) => setUser({...user, name: e.target.value})}
            />
            <span className="text-xl">{user.avatar}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-8 inline-block p-4 bg-amber-600/10 rounded-full border border-amber-600/20 animate-glow">
                <Bookmark className="text-amber-500" size={32} />
              </div>
              <h2 className="text-4xl md:text-6xl font-cinzel text-white mb-6">Sana Neler Söyleyeceğiz?</h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-12 font-playfair italic text-lg leading-relaxed">
                "Kader bir yol haritasıdır, semboller ise o yolu aydınlatan kandiller. Bugün hangi ışıkla yolunu bulmak istersin?"
              </p>
              <button 
                onClick={() => setStep('deck')}
                className="group relative px-10 py-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-full overflow-hidden transition-all shadow-2xl"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="flex items-center gap-2">Aydınlanmaya Başla <ChevronRight size={20} /></span>
              </button>
            </motion.div>
          )}

          {step === 'deck' && (
            <motion.div 
              key="deck"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            >
              {[DeckType.RIDER_WAITE, DeckType.MARSEILLE].map((deck, idx) => (
                <motion.div
                  key={deck}
                  initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => selectDeck(deck)}
                  className="group relative bg-slate-900/50 backdrop-blur border border-white/5 p-8 rounded-3xl cursor-pointer hover:border-amber-600/50 transition-all hover:bg-slate-900/80"
                >
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">
                    {deck === DeckType.RIDER_WAITE ? '🌞' : '⚖️'}
                  </div>
                  <h3 className="font-cinzel text-2xl text-amber-500 mb-4">{deck} Destesi</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">
                    {deck === DeckType.RIDER_WAITE 
                      ? 'Waite-Smith geleneği: Canlı semboller ve sezgisel derinlik için.' 
                      : 'Marsilya geleneği: Arketiplerin saf ve kadim gücü için.'}
                  </p>
                  <div className="h-1 w-0 group-hover:w-full bg-amber-600 transition-all duration-700"></div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {step === 'spread' && (
            <motion.div key="spread" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
              <h2 className="font-cinzel text-3xl text-center mb-12">Açılım Türünü Seç</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.values(SpreadType).map((spread, idx) => (
                  <motion.button
                    key={spread}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => selectSpread(spread)}
                    className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl hover:border-amber-600/30 text-left hover:bg-slate-900/80 transition-all flex justify-between items-center group"
                  >
                    <div>
                      <div className="font-cinzel text-amber-500 text-lg">{spread}</div>
                      <div className="text-slate-500 text-xs mt-1 uppercase tracking-tighter">
                        {SPREAD_CONFIGS[spread].count} Kartlık Rehberlik
                      </div>
                    </div>
                    <ChevronRight className="text-slate-700 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'drawing' && (
            <div className="text-center py-24">
              <div className="relative w-32 h-32 mx-auto mb-12">
                <div className="absolute inset-0 border-4 border-amber-600/10 rounded-full"></div>
                <div className="absolute inset-0 border-t-4 border-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🔮</div>
              </div>
              <h2 className="font-cinzel text-3xl text-amber-500 mb-4">Evren Hazırlanıyor...</h2>
              <p className="text-slate-500 italic mb-12">Lütfen zihnini boşalt ve niyetine odaklan.</p>
              <button 
                onClick={drawCards}
                disabled={loading}
                className="px-12 py-4 bg-amber-600 text-slate-950 font-bold rounded-full hover:scale-105 disabled:opacity-50 transition-all"
              >
                {loading ? 'Enerji Okunuyor...' : 'Kartları Dağıt'}
              </button>
            </div>
          )}

          {step === 'reading' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
              <div className="flex flex-wrap justify-center gap-4 mb-16 px-4">
                {state.cards.map((item, idx) => (
                  <Card 
                    key={idx} 
                    card={item.card} 
                    isFlipped={true} 
                    isReversed={item.isReversed} 
                    positionName={item.positionName}
                    delay={idx * 0.2}
                  />
                ))}
              </div>

              <div className="w-full max-w-4xl grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-slate-900/40 border border-white/5 p-8 rounded-3xl">
                   <div className="prose prose-invert prose-amber max-w-none text-slate-300 leading-relaxed font-serif">
                      <div className="whitespace-pre-line text-lg">
                        {state.interpretation}
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-amber-600/5 border border-amber-600/20 p-6 rounded-3xl">
                    <h4 className="font-cinzel text-amber-500 mb-4 flex items-center gap-2">
                      <Settings size={18} /> Rumi'ye Sor
                    </h4>
                    <p className="text-xs text-slate-500 mb-4 italic">
                      Derinleşmek için 3 sorunuzdan birini sorabilirsiniz. Cevaplar Rumi destesiyle verilecektir.
                    </p>
                    
                    {state.followUpQuestions.map((f, i) => (
                      <div key={i} className="mb-4 p-3 bg-black/40 rounded-xl border border-white/5 text-xs italic">
                         <div className="text-amber-600/60 mb-1">"{f.question}"</div>
                         <div className="text-slate-400 leading-relaxed">{f.answer.slice(0, 100)}...</div>
                      </div>
                    ))}

                    {state.questionsRemaining > 0 && (
                      <div className="space-y-3">
                        <textarea 
                          value={currentQuestion}
                          onChange={(e) => setCurrentQuestion(e.target.value)}
                          placeholder="Sorunu buraya yaz..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-600"
                          rows={3}
                        />
                        <button 
                          onClick={askRumi}
                          disabled={loading || !currentQuestion.trim()}
                          className="w-full py-2 bg-amber-600 text-slate-950 font-bold rounded-lg text-sm hover:bg-amber-500 transition-colors"
                        >
                          {loading ? 'Soruluyor...' : `Soruyu Gönder (${state.questionsRemaining})`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-12">
                <h2 className="font-cinzel text-3xl">Okuma Geçmişin</h2>
                <button onClick={() => setStep('welcome')} className="text-slate-500 hover:text-white"><X /></button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-20 text-slate-600 italic">Henüz bir okuma yapmadın.</div>
              ) : (
                <div className="grid gap-6">
                  {history.map((reading) => (
                    <motion.div 
                      key={reading.id}
                      layoutId={reading.id}
                      className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start hover:bg-slate-900/60 transition-all group"
                    >
                      <div className="flex -space-x-8 overflow-hidden pr-4 group-hover:-space-x-4 transition-all duration-500">
                        {reading.cards.slice(0, 3).map((c, i) => (
                          <div key={i} className="w-16 h-24 rounded border border-white/10 overflow-hidden shadow-2xl rotate-[-5deg]">
                            <img src={c.card.imageUrl} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-amber-500 font-cinzel text-lg">{reading.spreadType}</span>
                            <p className="text-xs text-slate-500 mt-1">{reading.date} • {reading.deckType} Destesi</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => toggleFavorite(reading.id)}
                              className={`p-2 rounded-full transition-colors ${reading.isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-slate-700 bg-white/5'}`}
                            >
                              <Star size={18} fill={reading.isFavorite ? 'currentColor' : 'none'} />
                            </button>
                            <button 
                              onClick={() => deleteReading(reading.id)}
                              className="p-2 rounded-full text-slate-700 hover:text-red-500 bg-white/5 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm line-clamp-2 italic">
                          {reading.interpretation.slice(0, 150)}...
                        </p>
                        <button 
                          onClick={() => setViewingReading(reading)}
                          className="mt-4 text-xs font-bold text-amber-600/80 hover:text-amber-500 flex items-center gap-1"
                        >
                          Tümünü Gör <ChevronRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Reading Detail Overlay */}
      <AnimatePresence>
        {viewingReading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl p-6 md:p-12 overflow-y-auto custom-scrollbar"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
                <div>
                  <h2 className="font-cinzel text-3xl text-amber-500">{viewingReading.spreadType}</h2>
                  <p className="text-slate-500 text-sm">{viewingReading.date} okuması</p>
                </div>
                <button onClick={() => setViewingReading(null)} className="p-3 bg-white/5 rounded-full hover:bg-white/10"><X /></button>
              </div>

              <div className="flex flex-wrap gap-4 mb-12">
                {viewingReading.cards.map((c, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-24 h-36 rounded-lg border border-white/20 overflow-hidden">
                      <img src={c.card.imageUrl} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-cinzel uppercase">{c.positionName}</span>
                  </div>
                ))}
              </div>

              <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-line leading-loose text-lg font-serif mb-12">
                {viewingReading.interpretation}
              </div>

              {viewingReading.followUps.length > 0 && (
                <div className="space-y-6 pt-12 border-t border-white/10">
                  <h4 className="font-cinzel text-xl text-amber-600">Soru & Cevaplar (Rumi)</h4>
                  {viewingReading.followUps.map((f, i) => (
                    <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5">
                      <p className="text-amber-500 italic mb-4">Soru: {f.question}</p>
                      <p className="text-slate-400 italic font-serif leading-relaxed">{f.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 border-t border-white/5 text-center text-slate-700 text-xs">
        <p>© 2024 Mistik Tarot Rehberi - Yıldızların Işığıyla Tasarlandı</p>
      </footer>
    </div>
  );
};

export default App;
