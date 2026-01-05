
import { TarotCard, SpreadType, DeckType } from './types';

export const MAJOR_ARCANA_NAMES = [
  "Fool", "Magician", "High Priestess", "Empress", "Emperor", "Hierophant", "Lovers", 
  "Chariot", "Strength", "Hermit", "Wheel of Fortune", "Justice", "Hanged Man", "Death", 
  "Temperance", "Devil", "Tower", "Star", "Moon", "Sun", "Judgement", "World"
];

const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];
const RANKS = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Page", "Knight", "Queen", "King"];

/**
 * Minör Arkana Manuel Link Haritası
 * Kullanıcıdan gelen Google Drive linkleri doğrudan görüntülenebilir formata dönüştürülerek eklendi.
 */
export const MINOR_ARCANA_LINKS_MAP: Record<string, string> = {
  // Değnek (Wands)
  "Ace of Wands": "https://drive.google.com/uc?export=view&id=1jStlkTMmJpRwBMTbtCv0GyvT4B6ItLRM",
  "2 of Wands": "https://drive.google.com/uc?export=view&id=1py472hrru5L-WGr8w4dGTL97CSQoOoRI",
  "3 of Wands": "https://drive.google.com/uc?export=view&id=10PNy7KD9XDFG_vAO-9mkrd8DGqM_bvBD",
  "4 of Wands": "https://drive.google.com/uc?export=view&id=14TzOuR_9GvF5PEl0ka-Do5CSOZnfidNe",
  "5 of Wands": "https://drive.google.com/uc?export=view&id=1Nc0JxI2_RWUMKKKXGd-iXQeV31HW1deo",
  "6 of Wands": "https://drive.google.com/uc?export=view&id=13jIwpH_j15f8JRQyLDGfoSLyVr4reTI_",
  "7 of Wands": "https://drive.google.com/uc?export=view&id=1oqBfWxELknU0dFvvlcU__0GLTp3fsWus",
  "8 of Wands": "https://drive.google.com/uc?export=view&id=1qnZvVagPTZHqKWBP4JGMX1ymxpwiQxJg",
  "9 of Wands": "https://drive.google.com/uc?export=view&id=1FrY-9yGWv56ZIoshmRxGQpSOiFIUPO3f",
  "10 of Wands": "https://drive.google.com/uc?export=view&id=1vjAoQ9dR7H7q0Imxif2Hh1LyfVuJuQPv",
  "Page of Wands": "https://drive.google.com/uc?export=view&id=1M6hb-X7PknVZ-M5cpwsIXZeQkKi-F-bS",
  "Knight of Wands": "https://drive.google.com/uc?export=view&id=1EfxSlriNkEg0YFsv5dwJi9ZU4yV8dxxn",
  "Queen of Wands": "https://drive.google.com/uc?export=view&id=1KbfXpLLFLng3uMT95pJTjvcO-BBudPJE",
  "King of Wands": "https://drive.google.com/uc?export=view&id=1MU4hzN33rb0GHilKH1xygpq7sM-NyZXt",

  // Kupa (Cups)
  "Ace of Cups": "https://drive.google.com/uc?export=view&id=1TsQBc21e-OwXmqoU4LwC6Zm0P6o_sqSf",
  "2 of Cups": "https://drive.google.com/uc?export=view&id=1EYk94fFRO3CKRpHv5DiAPlkzHsqC0sue",
  "3 of Cups": "https://drive.google.com/uc?export=view&id=1Zq1wlybkDfj5pTtZHI2Jstrf7OBA9ovd",
  "4 of Cups": "https://drive.google.com/uc?export=view&id=1cmwPZGm0jx3HKEkGfrW5aqrycCDB3_qz",
  "5 of Cups": "https://drive.google.com/uc?export=view&id=1RcwtLdnOuw0-csCM4SL6ZHqM2DIj0MIS",
  "6 of Cups": "https://drive.google.com/uc?export=view&id=1M2W4qbEg0_dKtsI36o4-sdVlBlhBxa2X",
  "7 of Cups": "https://drive.google.com/uc?export=view&id=1tmhaTbhdAhqfYmVtcGC8sn0wxsRagbv9",
  "8 of Cups": "https://drive.google.com/uc?export=view&id=1VkyDac_vCx1S7KAirwz4XAO15b06vxNw",
  "9 of Cups": "https://drive.google.com/uc?export=view&id=1k5Fbf2KXTZzLiLa-s7VAOEdWRpiOIV28",
  "10 of Cups": "https://drive.google.com/uc?export=view&id=18kQPjeC9K_o5zLoHoLqunNaRe8kJRRqF",
  "Page of Cups": "https://drive.google.com/uc?export=view&id=14JXHYs81n3yOn0NTRf_jYT-r-9LE2zoo",
  "Knight of Cups": "https://drive.google.com/uc?export=view&id=1j3uVlK2bIr2nzCVbkWSIMbitVambGA2d",
  "Queen of Cups": "https://drive.google.com/uc?export=view&id=15TL3AhckV2D7ZAhHngnXS5rhHtRv3Akd",
  "King of Cups": "https://drive.google.com/uc?export=view&id=1eyyfCYtkvZ_O8pAwCBHgfA_hGIpU5Ynm",

  // Tılsım (Pentacles)
  "Ace of Pentacles": "https://drive.google.com/uc?export=view&id=1b3Q8K78ccXD2o7wx0OY7pVFHoXjNxrs1",
  "2 of Pentacles": "https://drive.google.com/uc?export=view&id=1stxLOrGofW1Nc3qbm3sE9DRD8irWdWmU",
  "3 of Pentacles": "https://drive.google.com/uc?export=view&id=19meTqgQsuczquDjvnCUpmIbd1LCgh-9_",
  "4 of Pentacles": "https://drive.google.com/uc?export=view&id=1mkeRZdKHUfIILVljD2WyMqfM8z9wpyMM",
  "5 of Pentacles": "https://drive.google.com/uc?export=view&id=1IURdT9iCVte_h1Kfr4RTUoxPJkUtyQLg",
  "6 of Pentacles": "https://drive.google.com/uc?export=view&id=1malWOWEg8KvYOzWBOrCNl1crxEsYfSn8",
  "7 of Pentacles": "https://drive.google.com/uc?export=view&id=1IcV5Ean8EGG6UvzhSakPw7kg161L5uWf",
  "8 of Pentacles": "https://drive.google.com/uc?export=view&id=12itvQnv4sWPtrGfonk-2-hjfZOhACoSM",
  "9 of Pentacles": "https://drive.google.com/uc?export=view&id=17jxel9hd8vOWBMdDotXggbBC_dpzFAf_",
  "10 of Pentacles": "https://drive.google.com/uc?export=view&id=1_tQSuaxgBM-DjwFsEWRExMq0NBPkURhq",
  "Page of Pentacles": "https://drive.google.com/uc?export=view&id=1tlzRFNyxyagDS2yZNUF2gRQFq8IM2MRr",
  "Knight of Pentacles": "https://drive.google.com/uc?export=view&id=1TWYZwchteheQZgYaHrvYeG8z2Migqnis",
  "Queen of Pentacles": "https://drive.google.com/uc?export=view&id=1p0ovaanuMpBXYJoLfc-oXMtjdagxj34p",
  "King of Pentacles": "https://drive.google.com/uc?export=view&id=1B6AuRYDZSPbMSRHrb649ZWrs7om_Lx6p",

  // Kılıç (Swords)
  "Ace of Swords": "https://drive.google.com/uc?export=view&id=1PJ66l-VHYOtVpp6vczqektZfjYjfF6OX",
  "2 of Swords": "https://drive.google.com/uc?export=view&id=1Mnm-u0jq387ExwWQyoWY8n89fh48dSen",
  "3 of Swords": "https://drive.google.com/uc?export=view&id=1hCTH_XdsIo5Q3BJpWqhOMbCarUZ2FNq3",
  "4 of Swords": "https://drive.google.com/uc?export=view&id=1rsvUf4NorYE2Pm5e1oKq99DbdJ5sZV3P",
  "5 of Swords": "https://drive.google.com/uc?export=view&id=15cca7skfMSyLPN-b200HtH71kbUarnGe",
  "6 of Swords": "https://drive.google.com/uc?export=view&id=1EvBn3ED9XolrcU8BbaawjyeSdh6ReT63",
  "7 of Swords": "https://drive.google.com/uc?export=view&id=1S5jYmbS6JMSBcgAzKdgvFmZvwAGgn33f",
  "8 of Swords": "https://drive.google.com/uc?export=view&id=1f5lErB9AJbeIuSwHRM4xT6Qj3GvszqTU",
  "9 of Swords": "https://drive.google.com/uc?export=view&id=1XhKqrwm429qAqyHI-DU3jX9iNVqG0y-f",
  "10 of Swords": "https://drive.google.com/uc?export=view&id=1z2o_olfWyWL0fQZhP_eK-Tb6qwSJ7L6a",
  "Page of Swords": "https://drive.google.com/uc?export=view&id=1nNF0vajABEK4H_yWTGvBnsb1a9tV1lZL",
  "Knight of Swords": "https://drive.google.com/uc?export=view&id=1EjSDzfUWJgqcMleXTLfqTSep6w1voATD",
  "Queen of Swords": "https://drive.google.com/uc?export=view&id=1gQEIPQ6gPxqVY-daIHYceNQsu9fX3xCF",
  "King of Swords": "https://drive.google.com/uc?export=view&id=1Rb-Ktg2iN-NnGlPPeo8vbqsBbskYLktU",
};

const getRiderWaiteUrl = (name: string) => {
  if (MINOR_ARCANA_LINKS_MAP[name]) return MINOR_ARCANA_LINKS_MAP[name];

  const majorIndex = MAJOR_ARCANA_NAMES.indexOf(name);
  let fileName = "";
  
  if (majorIndex !== -1) {
    fileName = `m${majorIndex.toString().padStart(2, '0')}.jpg`;
  } else {
    const parts = name.split(' of ');
    if (parts.length === 2) {
      const rank = parts[0];
      const suit = parts[1];
      const suitMap: Record<string, string> = { "Wands": "w", "Cups": "c", "Swords": "s", "Pentacles": "p" };
      const rankMap: Record<string, string> = {
        "Ace": "01", "2": "02", "3": "03", "4": "04", "5": "05", "6": "06", "7": "07",
        "8": "08", "9": "09", "10": "10", "Page": "11", "Knight": "12", "Queen": "13", "King": "14"
      };
      fileName = `${suitMap[suit]}${rankMap[rank]}.jpg`;
    }
  }
  return `https://raw.githubusercontent.com/ekelen/tarot/master/assets/cards/${fileName}`;
};

const getMarseilleUrl = (name: string) => {
  if (MINOR_ARCANA_LINKS_MAP[name]) return MINOR_ARCANA_LINKS_MAP[name];
  
  const majorIndex = MAJOR_ARCANA_NAMES.indexOf(name);
  if (majorIndex !== -1) {
    const code = majorIndex.toString().padStart(2, '0');
    return `https://raw.githubusercontent.com/Gideon-Stark/tarot-api/master/static/cards/m${code}.jpg`;
  }
  return getRiderWaiteUrl(name);
};

export const getFullDeck = (prefix: string): TarotCard[] => {
  const deck: TarotCard[] = [];

  MAJOR_ARCANA_NAMES.forEach((name, index) => {
    let imageUrl = '';
    if (prefix === DeckType.RIDER_WAITE) imageUrl = getRiderWaiteUrl(name);
    else if (prefix === DeckType.MARSEILLE) imageUrl = getMarseilleUrl(name);
    else {
      imageUrl = `https://picsum.photos/seed/rumi-${index}-gold/400/700`;
    }
    
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
      if (prefix === DeckType.RIDER_WAITE) imageUrl = getRiderWaiteUrl(name);
      else if (prefix === DeckType.MARSEILLE) imageUrl = getMarseilleUrl(name);
      else {
        imageUrl = `https://picsum.photos/seed/rumi-${suit}-${rank}-mystic/400/700`;
      }

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
