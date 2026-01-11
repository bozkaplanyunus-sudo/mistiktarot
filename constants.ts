import { TarotCard, SpreadType, DeckType } from './types';

export const MAJOR_ARCANA_NAMES = [
  "Fool", "Magician", "High Priestess", "Empress", "Emperor", "Hierophant", "Lovers", 
  "Chariot", "Strength", "Hermit", "Wheel of Fortune", "Justice", "Hanged Man", "Death", 
  "Temperance", "Devil", "Tower", "Star", "Moon", "Sun", "Judgement", "World"
];

const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];
const RANKS = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Page", "Knight", "Queen", "King"];

/**
 * Google Drive linkini doğrudan görünebilir thumbnail linkine çevirir.
 */
const transformDriveUrl = (url: string): string => {
  if (!url || !url.includes('drive.google.com')) return url;
  const match = url.match(/id=([^&]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600`;
  }
  return url;
};

export const MAJOR_ARCANA_LINKS: Record<string, string> = {
  "Fool": "https://i.postimg.cc/cKXvc63f/0-joker.jpg",
  "Magician": "https://i.postimg.cc/gXjntdyX/1-buyucu.jpg",
  "High Priestess": "https://i.postimg.cc/k6GBY9NS/2-azize.jpg",
  "Empress": "https://i.postimg.cc/G8tHgrPs/3-imparatorice.jpg",
  "Emperor": "https://i.postimg.cc/G8tHgrPT/4-imparator.jpg",
  "Hierophant": "https://i.postimg.cc/ftyJqZ7j/5-aziz.jpg",
  "Lovers": "https://i.postimg.cc/MMHv3x0D/6-asiklar.jpg",
  "Chariot": "https://i.postimg.cc/cgCrkZ77/7-araba.jpg",
  "Strength": "https://i.postimg.cc/62qybwVh/8-guc.jpg",
  "Hermit": "https://i.postimg.cc/N9F5CY8n/9-ermis.jpg",
  "Wheel of Fortune": "https://i.postimg.cc/KkjRpF7V/10-kader-carki.jpg",
  "Justice": "https://i.postimg.cc/BLbX7s5V/11-adalet.jpg",
  "Hanged Man": "https://i.postimg.cc/zbvV25wP/12-asilan-adam.jpg",
  "Death": "https://i.postimg.cc/zbQ39Mpx/13-olum.jpg",
  "Temperance": "https://i.postimg.cc/cgz6VjTk/14-denge.jpg",
  "Devil": "https://i.postimg.cc/S2Pjw5V3/15-seytan.jpg",
  "Tower": "https://i.postimg.cc/dkfDzXnb/16-kule.jpg",
  "Star": "https://i.postimg.cc/34qWP6nM/17-yildiz.jpg",
  "Moon": "https://i.postimg.cc/JDFt9gPC/18-ay.jpg",
  "Sun": "https://i.postimg.cc/JDFt9gPL/19-gunes.jpg",
  "Judgement": "https://i.postimg.cc/tZc7Lf2p/20-mahkeme.jpg",
  "World": "https://i.postimg.cc/gX7rf5NY/21-dunya.jpg"
};

export const MINOR_ARCANA_LINKS: Record<string, string> = {
  // Değnek (Wands) serisi
  "Ace of Wands": "https://i.postimg.cc/DSth3hKd/01-degnek-asi.png",
  "2 of Wands": "https://i.postimg.cc/Bjd3f3Gw/02-degnek-ikilisi.png",
  "3 of Wands": "https://i.postimg.cc/NymcgngC/03-degnek-uclusu.png",
  "4 of Wands": "https://i.postimg.cc/bGkhz5z6/04-degnek-dortlusu.png",
  "5 of Wands": "https://i.postimg.cc/sB7rVLVT/05-degnek-beslisi.png",
  "6 of Wands": "https://i.postimg.cc/cKwSszsz/06-degnek-altilisi.png",
  "7 of Wands": "https://i.postimg.cc/Ff3496rQ/07-degnek-yedilisi.png",
  "8 of Wands": "https://i.postimg.cc/CZkgF2h0/08-degnek-sekizlisi.png",
  "9 of Wands": "https://i.postimg.cc/PLYjt7Xh/09-degnek-dokuzlusu.png",
  "10 of Wands": "https://i.postimg.cc/R3KBMYS4/10-degnek-onlusu.png",
  "Page of Wands": "https://i.postimg.cc/3ymTKq88/11-degnek-prensi.png",
  "Knight of Wands": "https://i.postimg.cc/cKwSszx4/12-degnek-sovalyesi.png",
  "Queen of Wands": "https://i.postimg.cc/3ymTKq8w/13-degnek-kralicesi.png",
  "King of Wands": "https://i.postimg.cc/qtyTkFJR/14-degnek-krali.png",

  // Kupa (Cups) serisi
  "Ace of Cups": "https://i.postimg.cc/NKvD3Cz8/01-kupa-asi.png",
  "2 of Cups": "https://i.postimg.cc/0z1nTXBf/02-kupa-ikilisi.png",
  "3 of Cups": "https://i.postimg.cc/21NGs9KG/03-kupa-uclusu.png",
  "4 of Cups": "https://i.postimg.cc/G4nKWg5M/04-kupa-dortlusu.png",
  "5 of Cups": "https://i.postimg.cc/pmMCwc6s/05-kupa-beslisi.png",
  "6 of Cups": "https://i.postimg.cc/sMPmsPkJ/06-kupa-altilisi.png",
  "7 of Cups": "https://i.postimg.cc/rDGjMGBJ/07-kupa-yedilisi.png",
  "8 of Cups": "https://i.postimg.cc/k2NsqN0s/08-kupa-sekizlisi.png",
  "9 of Cups": "https://i.postimg.cc/9DPbCP6J/09-kupa-dokuzlusu.png",
  "10 of Cups": "https://i.postimg.cc/nXK2pKyd/10-kupa-onlusu.png",
  "Page of Cups": "https://i.postimg.cc/VJ9gm9xG/11-kupa-prensi.png",
  "Knight of Cups": "https://i.postimg.cc/CRC7SC3Q/12-kupa-sovalyesi.png",
  "Queen of Cups": "https://i.postimg.cc/NK8DB83n/13-kupa-kralicesi.png",
  "King of Cups": "https://i.postimg.cc/nXK2pKyN/14-kupa-krali.png",
  
  // Tılsım (Pentacles) serisi
  "Ace of Pentacles": "https://i.postimg.cc/HJ7wZwpr/tilsim-asi.png",
  "2 of Pentacles": "https://i.postimg.cc/phbDgmT5/tilsim-ikilisi.png",
  "3 of Pentacles": "https://i.postimg.cc/PpsmBCxR/tilsim-uclusu.png",
  "4 of Pentacles": "https://i.postimg.cc/mcFYXYbc/tilsim-dortlusu.png",
  "5 of Pentacles": "https://i.postimg.cc/zLRCtCJh/tilsim-beslisi.png",
  "6 of Pentacles": "https://i.postimg.cc/bG2xCxzy/tilsim-altilisi.png",
  "7 of Pentacles": "https://i.postimg.cc/yg4FwDd5/tilsim-yedilisi.png",
  "8 of Pentacles": "https://i.postimg.cc/xJDKWXC6/tilsim-sekizlisi.png",
  "9 of Pentacles": "https://i.postimg.cc/d7T2H2qT/tilsim-dokuzlusu.png",
  "10 of Pentacles": "https://i.postimg.cc/47kzrYdp/tilsim-onlusu.png",
  "Page of Pentacles": "https://i.postimg.cc/Fd5j2YRp/tilsim-prensi.png",
  "Knight of Pentacles": "https://i.postimg.cc/ZBtr1WRf/tilsim-sovalyesi.png",
  "Queen of Pentacles": "https://i.postimg.cc/tZQhLsTW/tilsim-kralicesi.png",
  "King of Pentacles": "https://i.postimg.cc/cgyQVvHY/tilsim-krali.png",

  // Kılıç (Swords) serisi
  "Ace of Swords": "https://i.postimg.cc/2qw0FdTd/01-kilic-asi.png",
  "2 of Swords": "https://i.postimg.cc/t15BtdDk/02-kilic-ikilisi.png",
  "3 of Swords": "https://i.postimg.cc/p9ZsYQkq/03-kilic-uclusu.png",
  "4 of Swords": "https://i.postimg.cc/Q9d06Bn1/04-kilic-dortlusu.png",
  "5 of Swords": "https://i.postimg.cc/qhvjmtZ2/05-kilic-beslisi.png",
  "6 of Swords": "https://i.postimg.cc/ftRBH3g7/06-kilic-altilisi.png",
  "7 of Swords": "https://i.postimg.cc/HckBSJP3/07-kilic-yedilisi.png",
  "8 of Swords": "https://i.postimg.cc/TL3CkyHk/08-kilic-sekizlisi.png",
  "9 of Swords": "https://i.postimg.cc/vgZ3P1S2/09-kilic-dokuzlusu.png",
  "10 of Swords": "https://i.postimg.cc/mzg8dc6n/10-kilic-onlusu.png",
  "Page of Swords": "https://i.postimg.cc/CBxmvZQp/11-kilic-prensi.png",
  "Knight of Swords": "https://i.postimg.cc/vgZ3P1Nd/12-kilic-sovalyesi.png",
  "Queen of Swords": "https://i.postimg.cc/9RQJx4n2/13-kilic-kralicesi.png",
  "King of Swords": "https://i.postimg.cc/R6ZXP3D4/14-kilic-krali.png",
};

/**
 * Kart ismine ve deste türüne göre görsel linkini döndürür.
 */
export const getCardImageUrl = (name: string, deck: DeckType): string => {
  let url = "";
  if (MAJOR_ARCANA_LINKS[name]) {
    url = MAJOR_ARCANA_LINKS[name];
  } else if (MINOR_ARCANA_LINKS[name]) {
    url = MINOR_ARCANA_LINKS[name];
  }
  return transformDriveUrl(url);
};

/**
 * Seçilen deste türüne göre tüm kartları (78 kart) oluşturur.
 */
export const getFullDeck = (deckType: DeckType): TarotCard[] => {
  const cards: TarotCard[] = [];
  
  // Büyük Arkana (Majors)
  MAJOR_ARCANA_NAMES.forEach((name, index) => {
    cards.push({
      id: `major-${index}`,
      name: name,
      meaning: "",
      imageUrl: getCardImageUrl(name, deckType)
    });
  });

  // Küçük Arkana (Minors)
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      const name = `${rank} of ${suit}`;
      cards.push({
        id: `minor-${rank}-${suit}`,
        name: name,
        meaning: "",
        imageUrl: getCardImageUrl(name, deckType)
      });
    });
  });

  return cards;
};

/**
 * Açılım türlerinin konfigürasyonlarını (kart sayısı ve pozisyon isimleri) tutar.
 */
export const SPREAD_CONFIGS: Record<SpreadType, { count: number; positions: string[] }> = {
  [SpreadType.THREE_CARD]: { 
    count: 3, 
    positions: ['past', 'present', 'future'] 
  },
  [SpreadType.SIX_CARD]: { 
    count: 6, 
    positions: ['you', 'expectation', 'obstacles', 'path', 'mind', 'result'] 
  },
  [SpreadType.NINE_CARD]: { 
    count: 9, 
    positions: ['inner', 'outer', 'hopes', 'fears', 'nearPast', 'nearFuture', 'potential', 'essence', 'consciousness'] 
  },
  [SpreadType.CELTIC_CROSS]: { 
    count: 10, 
    positions: ['self', 'obstacles', 'consciousness', 'subconscious', 'nearPast', 'nearFuture', 'you', 'environment', 'hopes', 'result'] 
  }
};