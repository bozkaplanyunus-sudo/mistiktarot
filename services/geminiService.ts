
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
  // Daha hızlı yanıt için flash modelini kullanıyoruz
  const model = 'gemini-3-flash-preview';
  
  const cardsDescription = cards.map((c, i) => 
    `${i+1}. Kart (${c.positionName}): ${c.card.name} ${c.isReversed ? '(Ters)' : '(Düz)'}`
  ).join('\n');

  const prompt = `
    Aşağıdaki tarot açılımını yorumla:
    Deste: ${deck}
    Açılım: ${spread}
    Kartlar:
    ${cardsDescription}

    YAZIM VE FORMAT KURALLARI (BU KURALLARA UYMAK ZORUNLUDUR):
    1. Tüm ana başlıklar ve alt başlıklar KESİNLİKLE kendi satırında, tamamen BÜYÜK HARFLERLE yazılmalıdır.
    2. Başlıkların başında, sonunda veya içinde ASLA yıldız simgesi (*), alt tire (_), parıltı (✨), emoji veya herhangi bir Markdown işareti kullanma. Sadece saf metin kullan.
    3. Başlıklardan sonra mutlaka bir boş satır bırak.
    4. Yanıtın tamamı ${getLanguageName(language)} dilinde olmalıdır.
    5. Paragraflar arasında boşluk bırak.
    6. Ton: Bilge, mistik ve derinlemesine.
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
    Rumi Kartı: "${rumiCard.card.name}" ${rumiCard.isReversed ? '(Ters)' : '(Düz)'}

    Sen Mevlana Celaleddin Rumi'nin bilgeliğini taşıyan bir rehbersin.
    
    YAZIM VE FORMAT KURALLARI:
    1. Başlıklar sadece BÜYÜK HARFLERLE ve Markdown işareti (yıldız, alt tire vb.) olmadan yazılmalıdır.
    2. Başlıklarda ASLA yıldız (*), parıltı, ikon veya emoji kullanma.
    3. Cevabını şu üç başlık altında ver: GÖNÜL GÖZÜ, MESNEVİ'DEN HİKMET, CEVAP.
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
