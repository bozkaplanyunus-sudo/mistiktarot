
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
  const model = 'gemini-3-pro-preview';
  
  const cardsDescription = cards.map((c, i) => 
    `${i+1}. Kart (${c.positionName}): ${c.card.name} ${c.isReversed ? '(Ters)' : '(Düz)'}`
  ).join('\n');

  const prompt = `
    Aşağıdaki tarot açılımını yorumla:
    Deste: ${deck}
    Açılım: ${spread}
    Kartlar:
    ${cardsDescription}

    YAZIM VE FORMAT KURALLARI (BU KURALLARA UYMAMAK KRİTİK HATADIR):
    1. Tüm ana başlıklar ve alt başlıklar KESİNLİKLE sadece _**Başlık Metni**_ formatında olmalıdır (Yani Markdown'da hem alt tire hem çift yıldız kullanılarak kalın+italik yapılmalıdır).
    2. Başlıkların başında, sonunda veya içinde ASLA yıldız simgesi (*), parıltı (✨), emoji, nokta veya herhangi bir ikon kullanma. 
    3. Örnek doğru format: _**Geçmişin Esintileri**_
    4. Örnek yanlış format: * **Geçmiş**, ✨ Başlık ✨, **Başlık**.
    5. Yanıtın tamamı ${getLanguageName(language)} dilinde olmalıdır.
    6. Maddeler için sadece "-" sembolünü kullan.
    7. Ton: Bilge, mistik ve derinlemesine.
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
    return "Mistik kanallarla bağlantı kurulamadı.";
  }
};

export const getRumiFollowUpAnswer = async (
  question: string,
  rumiCard: CardSelection,
  language: Language
): Promise<string> => {
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    Danışan Sorusu: "${question}"
    Rumi Kartı: "${rumiCard.card.name}" ${rumiCard.isReversed ? '(Ters)' : '(Düz)'}

    Sen Mevlana Celaleddin Rumi'nin bilgeliğini taşıyan bir rehbersin.
    
    YAZIM VE FORMAT KURALLARI:
    1. Başlıklar kesinlikle ve sadece _**Başlık Metni**_ formatında olmalıdır.
    2. Başlıklarda ASLA yıldız (*), parıltı, ikon veya emoji kullanma.
    3. Yanıtın tamamı ${getLanguageName(language)} dilinde olmalıdır.
    4. Cevabını şu üç başlık altında ver: _**Gönül Gözü**_, _**Mesnevi'den Hikmet**_, _**Cevap**_.
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
