
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
    Aşağıdaki tarot açılımını yorumla:
    Deste: ${deck}
    Açılım: ${spread}
    ${intentContext}

    Kartlar:
    ${cardsDescription}

    # KRİTİK TALİMATLAR
    
    1. AYRIŞTIRMA ADIMI: Bir kart seçildiğinde (örneğin: "Ters Joker" veya "Joker - Ters"), önce "Ters" ibaresini kartın isminden ayır ve kartın kök adını (Örn: "Joker") bul.
    
    2. GÖRSEL BULMA: Bulduğun bu kök adına karşılık gelen PostImages linkini sana yukarıda sağlanan "Görsel Linki" değerlerinden sorgula.
    
    3. SEMBOLİK YORUMLAMA: Kartları yorumlarken sadece ana anlamlarını değil, karttaki sembolleri (renkler, nesneler, figürlerin duruşu) de mutlaka yorumuna dahil et.
    
    4. YÖN KONTROLÜ VE FORMAT ZORUNLULUĞU: 
       - Eğer kart DÜZ ise: Sadece görseli ve yorumu paylaş.
       - Eğer kart TERS ise: Görseli paylaşırken Markdown formatının hemen altına "⚠️ BU KART TERS GELMİŞTİR" uyarısını ekle ve yorumu ters anlamına göre yap.
       - Kartın yönü ne olursa olsun, her bölümün başında KESİNLİKLE şu yapıyı kullan:
         ![Kart Adı](PostImages_Direct_Link)
         **Durum:** [Düz / ⚠️ BU KART TERS GELMİŞTİR]
         **Yorum:** [Kartın sembolik ve konumsal yorumu]

    5. HATA ÖNLEME: "Ters [Kart Adı]" şeklinde bir görsel linki arama; her zaman listenizdeki orijinal düz kart linkini kullan.
    
    6. DİL VE TON: Yanıtın tamamı ${getLanguageName(language)} dilinde olmalıdır. Bilge, mistik ve yol gösterici bir ton kullan.
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
    1. GÖRSEL KULLANMA. Kesinlikle Markdown görsel etiketi (![...](...)) kullanma.
    2. Yanıtın başında seçtiğin kartın adını büyük harflerle belirt: "KART: [RUMİ KARTI ADI]"
    3. Seçtiğin kartın Rumi bilgeliğindeki karşılığını, Mevlana'nın bir sözüyle veya o derin felsefeyle harmanlayarak anlat.
    4. Kullanıcının sorusuna doğrudan ve ruhani bir derinlikle cevap ver.
    5. Dil: ${getLanguageName(language)}.
    6. Format:
       KART: [KART ADI]
       **Cevap:** [Rumi bilgeliğiyle harmanlanmış derin yorum]
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
