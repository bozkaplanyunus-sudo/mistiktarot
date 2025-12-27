
import { TarotCard, SpreadType } from './types';

export const MAJOR_ARCANA_NAMES = [
  "Mecnun", "Büyücü", "Azize", "İmparatoriçe", "İmparator", "Aziz", "Aşıklar", 
  "Araba", "Adalet", "Ermiş", "Kader Çarkı", "Güç", "Asılan Adam", "Ölüm", 
  "Denge", "Şeytan", "Yıkılan Kule", "Yıldız", "Ay", "Güneş", "Mahkeme", "Dünya"
];

// Simplified for simulation. In a real app, this would include all 78 cards.
export const getFullDeck = (prefix: string): TarotCard[] => {
  return MAJOR_ARCANA_NAMES.map((name, index) => ({
    id: `${prefix}-${index}`,
    name,
    meaning: "Anlam yükleniyor...",
    imageUrl: `https://picsum.photos/seed/${prefix}-${index}/400/700`
  }));
};

export const SPREAD_CONFIGS = {
  [SpreadType.THREE_CARD]: {
    count: 3,
    positions: ["Geçmiş", "Şimdi", "Gelecek"]
  },
  [SpreadType.SIX_CARD]: {
    count: 6,
    positions: ["Sen", "Beklenti", "Engeller", "Yol", "Zihin", "Sonuç"]
  },
  [SpreadType.NINE_CARD]: {
    count: 9,
    positions: ["İç Dünya", "Dış Etkenler", "Umutlar", "Korkular", "Yakın Geçmiş", "Şu An", "Yakın Gelecek", "Potansiyel", "Nihai Sonuç"]
  },
  [SpreadType.CELTIC_CROSS]: {
    count: 10,
    positions: ["Öz", "Engel", "Bilinç", "Bilinçaltı", "Geçmiş", "Gelecek", "Benlik", "Çevre", "Umutlar/Korkular", "Sonuç"]
  }
};
