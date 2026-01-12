
export enum Language {
  TR = 'tr',
  EN = 'en',
  FR = 'fr'
}

export enum DeckType {
  RIDER_WAITE = 'Rider-Waite',
  RUMI = 'Rumi'
}

export enum SpreadType {
  THREE_CARD = 'THREE_CARD',
  SIX_CARD = 'SIX_CARD',
  NINE_CARD = 'NINE_CARD',
  CELTIC_CROSS = 'CELTIC_CROSS'
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
  userIntent?: string;
}

export interface ReadingState {
  deck: DeckType | null;
  spread: SpreadType | null;
  cards: CardSelection[];
  interpretation: string;
  questionsRemaining: number;
  followUpQuestions: FollowUp[];
  userIntent: string;
}
