
import { TarotCard, SpreadType, DeckType } from './types';

export const MAJOR_ARCANA_NAMES = [
  "Fool", "Magician", "High Priestess", "Empress", "Emperor", "Hierophant", "Lovers", 
  "Chariot", "Strength", "Hermit", "Wheel of Fortune", "Justice", "Hanged Man", "Death", 
  "Temperance", "Devil", "Tower", "Star", "Moon", "Sun", "Judgement", "World"
];

const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];
const RANKS = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Page", "Knight", "Queen", "King"];

const getJSDelivrUrl = (repo: string, path: string) => {
  return `https://cdn.jsdelivr.net/gh/${repo}@master/${path}`;
};

const getStaticRiderWaiteUrl = (name: string) => {
  const majorIndex = MAJOR_ARCANA_NAMES.indexOf(name);
  let fileName = "";
  
  if (majorIndex !== -1) {
    // Majör arkana: m00.jpg - m21.jpg
    fileName = `m${majorIndex.toString().padStart(2, '0')}.jpg`;
  } else {
    // Minör arkana: w01.jpg, c01.jpg, s01.jpg, p01.jpg vb.
    const parts = name.split(' of ');
    if (parts.length === 2) {
      const rank = parts[0];
      const suit = parts[1];
      
      const suitLetterMap: Record<string, string> = {
        "Wands": "w",
        "Cups": "c",
        "Swords": "s",
        "Pentacles": "p"
      };
      
      const rankMap: Record<string, string> = {
        "Ace": "01", "2": "02", "3": "03", "4": "04", "5": "05", "6": "06", "7": "07",
        "8": "08", "9": "09", "10": "10", "Page": "11", "Knight": "12", "Queen": "13", "King": "14"
      };
      
      const s = suitLetterMap[suit] || "w";
      const r = rankMap[rank] || "01";
      fileName = `${s}${r}.jpg`;
    }
  }
  
  return getJSDelivrUrl('ekelen/tarot', `assets/cards/${fileName}`);
};

const getMarseilleUrl = (name: string) => {
  const majorIndex = MAJOR_ARCANA_NAMES.indexOf(name);
  if (majorIndex !== -1) {
    const code = majorIndex.toString().padStart(2, '0');
    return getJSDelivrUrl('Gideon-Stark/tarot-api', `static/cards/m${code}.jpg`);
  }
  return getStaticRiderWaiteUrl(name);
};

export const getFullDeck = (prefix: string): TarotCard[] => {
  const deck: TarotCard[] = [];

  MAJOR_ARCANA_NAMES.forEach((name, index) => {
    let imageUrl = '';
    if (prefix === DeckType.RIDER_WAITE) imageUrl = getStaticRiderWaiteUrl(name);
    else if (prefix === DeckType.MARSEILLE) imageUrl = getMarseilleUrl(name);
    else imageUrl = `https://loremflickr.com/400/700/mystic,rumi/all?lock=${index}`;
    
    deck.push({
      id: `${prefix}-major-${index}`,
      name: name,
      meaning: "...",
      imageUrl: imageUrl
    });
  });

  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      const name = `${rank} of ${suit}`;
      let imageUrl = '';
      if (prefix === DeckType.RIDER_WAITE) imageUrl = getStaticRiderWaiteUrl(name);
      else if (prefix === DeckType.MARSEILLE) imageUrl = getMarseilleUrl(name);
      else imageUrl = `https://loremflickr.com/400/700/wisdom,spirit/all?lock=${Math.random()}`;

      deck.push({
        id: `${prefix}-minor-${rank}-${suit}`,
        name: name,
        meaning: "...",
        imageUrl: imageUrl
      });
    });
  });

  return deck;
};

export const SPREAD_CONFIGS = {
  [SpreadType.THREE_CARD]: { count: 3, majorCount: 1, positions: ["past", "present", "future"] },
  [SpreadType.SIX_CARD]: { count: 6, majorCount: 2, positions: ["you", "expectation", "obstacles", "path", "mind", "result"] },
  [SpreadType.NINE_CARD]: { count: 9, majorCount: 3, positions: ["inner", "outer", "hopes", "fears", "nearPast", "present", "nearFuture", "potential", "result"] },
  [SpreadType.CELTIC_CROSS]: { count: 10, majorCount: 5, positions: ["essence", "obstacles", "consciousness", "subconscious", "past", "future", "self", "environment", "hopes", "result"] }
};
