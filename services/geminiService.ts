
import { GoogleGenAI } from "@google/genai";
import { DeckType, SpreadType, CardSelection } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTarotInterpretation = async (
  deck: DeckType,
  spread: SpreadType,
  cards: CardSelection[]
): Promise<string> => {
  const model = 'gemini-3-pro-preview';
  
  const cardsDescription = cards.map((c, i) => 
    `${i+1}. Kart (${c.positionName}): ${c.card.name} ${c.isReversed ? '(Ters)' : '(Düz)'}`
  ).join('\n');

  const prompt = `
    Sen dünya çapında tanınan uzman bir tarot arkeoloğu ve yorumcususun. Aşağıdaki detaylara göre her bir kartın sembolizmini, o desteye özgü çizim özelliklerini ve konumundaki anlamını içeren derinlemesine bir analiz yap.

    Deste Türü: ${deck}
    Açılım Stratejisi: ${spread}
    
    Çekilen Kartlar:
    ${cardsDescription}

    Yorumlama Kuralları:
    1. ${deck === DeckType.RIDER_WAITE ? 'Rider-Waite destesi için A.E. Waite ve Pamela Colman Smith\'in sembolizmine (renkler, astrolojik bağlantılar, figürler) odaklan.' : 'Marsilya destesi için Ortaçağ ikonografisine, ham sembolizme ve numarolojik yapıya odaklan.'}
    2. Her kartı bulunduğu KONUMUN (${spread} içindeki yeri) bağlamında yorumla. 
    3. Kartların birbirleriyle olan elementel ve görsel etkileşimlerini (dignities) analiz et.
    4. Sonuç bölümünde danışan için somut bir eylem planı veya derin bir meditasyon cümlesi öner.
    5. Dil: Türkçe. Üslup: Şiirsel, ağırbaşlı, mistik ama anlaşılır.

    Markdown formatında başlıklar kullanarak yanıt ver.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.85,
        topP: 0.9,
      }
    });
    return response.text || "Yorum alınamadı. Lütfen tekrar deneyin.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Mistik kanallarda bir parazit var. Lütfen tekrar deneyin.";
  }
};

export const getRumiFollowUpAnswer = async (
  question: string,
  rumiCard: CardSelection
): Promise<string> => {
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    Danışan Sorusu: "${question}"
    Rumi Tarot Kartı: "${rumiCard.card.name}" ${rumiCard.isReversed ? '(Ters)' : '(Düz)'}

    Mevlana Celaleddin Rumi'nin "Mesnevi" ve "Divan-ı Kebir" bilgeliğiyle konuş. 
    Kartın Rumi destesinde temsil ettiği hikayeyi anlat ve bu hikayeyi danışanın sorusuna bir şifa cümlesi olarak bağla.
    Kısa, öz, vurucu ve ruhu dinlendiren bir üslup kullan.
    
    Dil: Türkçe.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.9 }
    });
    return response.text || "Rumi sessizliği seçti...";
  } catch (error) {
    return "Gönül kapısı şu an kapalı.";
  }
};
