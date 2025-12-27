
export enum DeckType {
  RIDER_WAITE = 'Rider-Waite',
  MARSEILLE = 'Marsilya',
  RUMI = 'Rumi'
}

export enum SpreadType {
  THREE_CARD = 'Üç Kağıt Açılımı',
  SIX_CARD = 'Altı Kağıt Açılımı',
  NINE_CARD = 'Dokuz Kağıt Açılımı',
  CELTIC_CROSS = 'Kelt Açılımı'
}

export interface TarotCard {
  name: string;
  id: string;
  meaning: string;
  imageUrl: string;
}

export interface CardSelection {
  card: TarotCard;
  isReversed: boolean;
  positionName?: string;
}

export interface FollowUp {
  question: string;
  card: CardSelection;
  answer: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
}

export interface SavedReading {
  id: string;
  date: string;
  deckType: DeckType;
  spreadType: SpreadType;
  cards: CardSelection[];
  interpretation: string;
  followUps: FollowUp[];
  isFavorite: boolean;
}

export interface ReadingState {
  deck: DeckType | null;
  spread: SpreadType | null;
  cards: CardSelection[];
  interpretation: string;
  questionsRemaining: number;
  followUpQuestions: FollowUp[];
}
