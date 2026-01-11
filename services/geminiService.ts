
import { GoogleGenAI } from "@google/genai";
import { DeckType, SpreadType, CardSelection, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (lang: Language) => {
  switch(lang) {
    case Language.TR: return 'Turkish (Türkçe)';
    case Language.EN: return 'English';
    case Language.FR: return 'French (Français)';
    default: return 'English';
  }
};

export const getTarotInterpretation = async (
  deck: DeckType,
  spread: SpreadType,
  cards: CardSelection[],
  language: Language
): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  
  // Kart açıklamalarına görselleri de ekliyoruz ki AI bunlara referans verebilsin
  const cardsDescription = cards.map((c, i) => 
    `${i+1}. Kart (${c.positionName}): ${c.card.name} ${c.isReversed ? '(Ters)' : '(Düz)'} - Görsel Linki: ${c.card.imageUrl}`
  ).join('\n');

  const prompt = `
    Aşağıdaki tarot açılımını yorumla:
    Deste: ${deck}
    Açılım: ${spread}
    Kartlar:
    ${cardsDescription}

    GÖRSEL TALİMATI:
    - Her kartın yorumunu yaparken, o kartın yanına veya yorumunun başına mutlaka ![Kart Adı](GÖRSEL_LINKI) formatında görseli ekle.
    - Sadece sana yukarıda verilen "Görsel Linki" değerlerini kullan.
    - Bir kart 'Ters' (Reversed) olarak çekildiğinde, yine o kartın düz hali için sana tanımlanan görsel linkini kullan. 
    - Görseli Markdown formatında gösterirken, yorum kısmında '(Ters)' notunu düş. Yeni bir link arama, mevcut linki kullan.
    - Metin içinde görsellerin görünmesi çok önemlidir.

    YAZIM VE FORMAT KURALLARI:
    1. Tüm ana başlıklar KESİNLİKLE kendi satırında, tamamen BÜYÜK HARFLERLE yazılmalıdır.
    2. Başlıkların başında veya sonunda yıldız (*) veya başka Markdown işaretleri kullanma.
    3. Yanıtın tamamı ${getLanguageName(language)} dilinde olmalıdır.
    4. Ton: Bilge, mistik ve derinlemesine.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });
    return response.text || "Yorum alınamadı.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Mistik kanallarla bağlantı kurulamadı. Lütfen tekrar deneyin.";
  }
};

export const getRumiFollowUpAnswer = async (
  question: string,
  rumiCard: CardSelection,
  language: Language
): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Danışan Sorusu: "${question}"
    Rumi Kartı: "${rumiCard.card.name}" ${rumiCard.isReversed ? '(Ters)' : '(Düz)'} - Görsel: ${rumiCard.card.imageUrl}

    Sen Mevlana Celaleddin Rumi'nin bilgeliğini taşıyan bir rehbersin.
    
    YAZIM VE FORMAT KURALLARI:
    1. Yanıtın başında mutlaka Rumi kartının görselini ![Rumi](GÖRSEL) şeklinde ekle.
    2. Cevabını şu üç başlık altında ver: GÖNÜL GÖZÜ, MESNEVİ'DEN HİKMET, CEVAP.
    3. Bir kart 'Ters' (Reversed) olarak çekildiğinde, yine o kartın düz hali için sana tanımlanan görsel linkini kullan. 
    4. Yanıtın tamamı ${getLanguageName(language)} dilinde olmalıdır.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { 
        temperature: 0.75,
        topP: 0.9
      }
    });
    return response.text || "Rumi sükut etmeyi seçti.";
  } catch (error) {
    return "Gönül kapısı şu an kapalı.";
  }
};
