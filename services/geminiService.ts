
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
  language: Language,
  userIntent: string
): Promise<string> => {
  const model = 'gemini-3-pro-preview';
  
  const cardsDescription = cards.map((c, i) => 
    `${i+1}. Kart (${c.positionName}): ${c.card.name} ${c.isReversed ? '(Ters)' : '(Düz)'} - Görsel Linki: ${c.card.imageUrl}`
  ).join('\n');

  const intentContext = userIntent 
    ? `Kullanıcının niyeti/sorusu: "${userIntent}"\nLütfen yorumu bu niyet çerçevesinde, kullanıcıya özel bir rehberlik sunacak şekilde derinleştir.`
    : "Genel bir enerji okuması yap.";

  const prompt = `
    Aşağıdaki tarot açılımını derinlemesine yorumla:
    Deste: ${deck}
    Açılım: ${spread}
    ${intentContext}

    Kartlar:
    ${cardsDescription}

    # FORMAT VE GÖRÜNÜM TALİMATLARI (HAYATİ ÖNEMDE)
    
    1. YAPI: Her kart için önce başlık, sonra görsel, sonra durum ve en son uzun, edebi bir paragraf kullan.
    2. MADDE İŞARETİ KULLANMA: Yanıtında kesinlikle liste, madde işareti (- veya *) kullanma. Tüm metni düzgün paragraflar halinde yaz.
    3. BAŞLIKLAR: Her bölüm başlığını (Örn: "1. KART: GEÇMİŞ - JOKER") büyük harflerle ve tek satırda yaz.
    4. GÖRSEL KONTROLÜ: 
       ![Kart Adı](Sağlanan_Görsel_Linki) formatını kullan.
    5. PARAGRAF DERİNLİĞİ: Her kartın yorumu en az 4-5 uzun cümleden oluşan, akıcı ve derin bir paragraf olmalıdır. Sezgisel bir dil kullan.
    6. DİL: Yanıtın tamamı ${getLanguageName(language)} dilinde olmalıdır.
    7. TERS KARTLAR: Eğer kart ters ise, görselin hemen altına "Durum: ⚠️ BU KART TERS GELMİŞTİR" yaz ve yorumu buna göre kurgula. Düz ise "Durum: Düz" yaz.

    Yorumun sonunda genel bir sentez (SONUÇ) bölümü ekle.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });
    return response.text || "Mistik sisler şu an çok yoğun, yanıt alınamadı.";
  } catch (error) {
    console.error("Tarot error:", error);
    throw error;
  }
};

export const getRumiFollowUpAnswer = async (
  question: string,
  baseCard: CardSelection,
  language: Language
): Promise<string> => {
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    Sen Rumi (Mevlana) bilgeliğiyle konuşan bir mistik rehbersin. 
    Kullanıcı sana şu soruyu soruyor: "${question}"
    
    Lütfen bu soruya yanıt vermek için Rumi Tarot (Sufi Wisdom) destesinden sezgisel olarak bir kart seç.
    
    TALİMATLAR:
    1. GÖRSEL KULLANMA.
    2. Yanıtın başında seçtiğin kartın adını büyük harflerle belirt: "KART: [RUMİ KARTI ADI]"
    3. Seçtiğin kartın Rumi bilgeliğindeki karşılığını, Mevlana'nın bir sözüyle veya o derin felsefeyle harmanlayarak anlat.
    4. Yanıtını tek bir derin ve akıcı paragraf olarak yaz. Madde işareti kullanma.
    5. Dil: ${getLanguageName(language)}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });
    return response.text || "Rumi'nin sesi rüzgarda kayboldu...";
  } catch (error) {
    console.error("Rumi error:", error);
    return "Mistik bir hata oluştu.";
  }
};
