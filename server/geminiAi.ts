import { GoogleGenAI, Type, Schema } from '@google/genai';
import { FoodReport, FoodComponent } from '../src/types';

// Fast, highly economical production Gemini model
const FAST_LOW_COST_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

/**
 * Safely strips markdown codeblocks or trailing text and parses JSON output from LLM.
 */
function cleanAndParseJson<T = any>(rawText: string | undefined): T | null {
  if (!rawText) return null;
  try {
    let clean = rawText.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    return JSON.parse(clean.trim());
  } catch (err) {
    console.error('Failed to parse JSON response from Gemini:', err, 'Raw text was:', rawText);
    return null;
  }
}

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Using local rule-based heuristic fallback.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ParsedComponent {
  name: string;
  quantityValue: number;
  quantityUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  isEstimated: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export interface AnalysisSuccessResult {
  status: 'saved';
  confidence: 'high' | 'medium' | 'low';
  transcribedText?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  components: ParsedComponent[];
}

export interface ClarificationResult {
  status: 'needs_clarification';
  clarificationQuestion: string;
}

export type FoodAnalysisResponse = AnalysisSuccessResult | ClarificationResult;

export interface RefinementResponse {
  status: 'saved';
  confidence: 'high' | 'medium' | 'low';
  changeSummary: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  components: ParsedComponent[];
}

const foodAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isFood: {
      type: Type.BOOLEAN,
      description: 'True if the input text describes food, drinks, meals, snacks or ingredients. False otherwise.',
    },
    clarificationQuestion: {
      type: Type.STRING,
      description: 'If isFood is false or highly ambiguous, provide ONE short friendly question in Hebrew asking what food was consumed.',
    },
    confidence: {
      type: Type.STRING,
      enum: ['high', 'medium', 'low'],
      description: 'Confidence in the estimation.',
    },
    components: {
      type: Type.ARRAY,
      description: 'List of individual food components/items identified in the meal.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Hebrew name of the item (e.g. ביצה קשה, לחם מלא, טחינה)' },
          quantityValue: { type: Type.NUMBER, description: 'Numerical amount (e.g. 2, 150, 1)' },
          quantityUnit: { type: Type.STRING, description: 'Hebrew unit of measurement (e.g. יחידות, גרם, פרוסה, כף, כוס, קערה)' },
          calories: { type: Type.NUMBER, description: 'Estimated calories for this item' },
          proteinG: { type: Type.NUMBER, description: 'Grams of protein' },
          carbsG: { type: Type.NUMBER, description: 'Grams of carbohydrates' },
          fatG: { type: Type.NUMBER, description: 'Grams of fat' },
          fiberG: { type: Type.NUMBER, description: 'Grams of dietary fiber' },
          isEstimated: { type: Type.BOOLEAN, description: 'True if quantity or exact food type was estimated/guessed without specific user mention' },
          confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
        },
        required: ['name', 'quantityValue', 'quantityUnit', 'calories', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'isEstimated', 'confidence'],
      },
    },
  },
  required: ['isFood', 'confidence', 'components'],
};

const foodAudioAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isFood: {
      type: Type.BOOLEAN,
      description: 'True if the audio describes food, drinks, meals, snacks or ingredients. False otherwise.',
    },
    transcription: {
      type: Type.STRING,
      description: 'Accurate Hebrew transcription of what the user said in the recording.',
    },
    clarificationQuestion: {
      type: Type.STRING,
      description: 'If isFood is false or audio is unclear, provide ONE short friendly question in Hebrew.',
    },
    confidence: {
      type: Type.STRING,
      enum: ['high', 'medium', 'low'],
      description: 'Confidence in estimation and transcription.',
    },
    components: {
      type: Type.ARRAY,
      description: 'List of individual food components identified.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Hebrew name of the item' },
          quantityValue: { type: Type.NUMBER, description: 'Numerical amount' },
          quantityUnit: { type: Type.STRING, description: 'Hebrew unit of measurement' },
          calories: { type: Type.NUMBER, description: 'Estimated calories' },
          proteinG: { type: Type.NUMBER, description: 'Grams of protein' },
          carbsG: { type: Type.NUMBER, description: 'Grams of carbohydrates' },
          fatG: { type: Type.NUMBER, description: 'Grams of fat' },
          fiberG: { type: Type.NUMBER, description: 'Grams of dietary fiber' },
          isEstimated: { type: Type.BOOLEAN, description: 'True if estimated' },
          confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
        },
        required: ['name', 'quantityValue', 'quantityUnit', 'calories', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'isEstimated', 'confidence'],
      },
    },
  },
  required: ['isFood', 'transcription', 'confidence', 'components'],
};

const foodImageAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isFood: {
      type: Type.BOOLEAN,
      description: 'True if the image contains food, drinks, a meal or ingredients. False otherwise.',
    },
    mealDescription: {
      type: Type.STRING,
      description: 'Short descriptive Hebrew summary of the meal (e.g. "ארוחת צהריים: חזה עוף עם אורז וסלט")',
    },
    clarificationQuestion: {
      type: Type.STRING,
      description: 'If isFood is false or image is completely unclear, provide ONE short friendly question in Hebrew.',
    },
    confidence: {
      type: Type.STRING,
      enum: ['high', 'medium', 'low'],
      description: 'Confidence in visual identification.',
    },
    components: {
      type: Type.ARRAY,
      description: 'Visual breakdown of all individual food items identified in the dish.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Hebrew name of the food item' },
          quantityValue: { type: Type.NUMBER, description: 'Estimated quantity' },
          quantityUnit: { type: Type.STRING, description: 'Hebrew unit of measurement' },
          calories: { type: Type.NUMBER, description: 'Estimated calories' },
          proteinG: { type: Type.NUMBER, description: 'Grams of protein' },
          carbsG: { type: Type.NUMBER, description: 'Grams of carbohydrates' },
          fatG: { type: Type.NUMBER, description: 'Grams of fat' },
          fiberG: { type: Type.NUMBER, description: 'Grams of dietary fiber' },
          isEstimated: { type: Type.BOOLEAN, description: 'True if quantity was visually estimated' },
          confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
        },
        required: ['name', 'quantityValue', 'quantityUnit', 'calories', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'isEstimated', 'confidence'],
      },
    },
  },
  required: ['isFood', 'mealDescription', 'confidence', 'components'],
};

const foodRefinementSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    changeSummary: {
      type: Type.STRING,
      description: 'Brief friendly Hebrew summary of what was modified (e.g. "הסרתי את הסלט ועדכנתי את כמות האורז ל-200 גרם")',
    },
    confidence: {
      type: Type.STRING,
      enum: ['high', 'medium', 'low'],
      description: 'Confidence in the refined estimation.',
    },
    components: {
      type: Type.ARRAY,
      description: 'Updated complete list of components after applying the user refinement.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Hebrew name of the item' },
          quantityValue: { type: Type.NUMBER, description: 'Numerical amount' },
          quantityUnit: { type: Type.STRING, description: 'Hebrew unit of measurement' },
          calories: { type: Type.NUMBER, description: 'Estimated calories' },
          proteinG: { type: Type.NUMBER, description: 'Grams of protein' },
          carbsG: { type: Type.NUMBER, description: 'Grams of carbohydrates' },
          fatG: { type: Type.NUMBER, description: 'Grams of fat' },
          fiberG: { type: Type.NUMBER, description: 'Grams of dietary fiber' },
          isEstimated: { type: Type.BOOLEAN, description: 'True if estimated' },
          confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
        },
        required: ['name', 'quantityValue', 'quantityUnit', 'calories', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'isEstimated', 'confidence'],
      },
    },
  },
  required: ['changeSummary', 'confidence', 'components'],
};

export interface FoodMemoryItem {
  triggerName: string;
  resolvedDescription: string;
}

export async function analyzeFoodTextWithGemini(
  text: string,
  foodMemories?: FoodMemoryItem[]
): Promise<FoodAnalysisResponse> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      status: 'needs_clarification',
      clarificationQuestion: 'מה אכלת או שתית? אפשר לתאר בפירוט או בקצרה.',
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return fallbackHeuristicParser(trimmed, foodMemories);
  }

  try {
    const ai = getAiClient();
    
    let memoryInstructions = '';
    if (foodMemories && foodMemories.length > 0) {
      memoryInstructions = `
הגדרות מזון מותאמות אישית של המשתמש (חובה לתת עדיפות עליונה להגדרות אלו):
${foodMemories.map((m) => `- כשנאמר או נכתב "${m.triggerName}", הכוונה היא בדיוק: "${m.resolvedDescription}"`).join('\n')}
`;
    }

    const response = await ai.models.generateContent({
      model: FAST_LOW_COST_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `אתה מנוע תזונתי מתקדם (Clinical Nutrition AI) לאפליקציית מעקב תזונה ישראלית.
נתח את דיווח המזון הבא של המשתמש בעברית:
"${trimmed}"
${memoryInstructions}
הנחיות:
1. זהה כל פריט מזון, כמות ויחידה. אם המשתמש הזכיר מילת מפתח מהגדרות המזון האישיות שלו לעיל, השתמש בתיאור המותאם אישית שלו.
2. חשב ערכים תזונתיים מדויקים: קלוריות (קק״ל), חלבון (גרם), פחמימות (גרם), שומן (גרם), סיבים (גרם) לפי מאגרי תזונה מוכרים (USDA, משרד הבריאות הישראלי).
3. אם הכמות לא צוינה במפורש, השתמש במנת הגשה ישראלית סטנדרטית וסמן isEstimated = true.
4. שמות הפריטים והיחידות חייבים להיות בעברית טבעית ותקנית.
5. אם הטקסט אינו קשור למזון (למשל ברכות, שיחת חולין, או ג'יבריש), קבע isFood = false ונסח שאלה קצרה בעברית ב-clarificationQuestion.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: foodAnalysisSchema,
        temperature: 0.1,
      },
    });

    const parsedJson = cleanAndParseJson(response.text);

    if (!parsedJson || !parsedJson.isFood || !parsedJson.components || parsedJson.components.length === 0) {
      return {
        status: 'needs_clarification',
        clarificationQuestion:
          parsedJson?.clarificationQuestion ||
          'לא הצלחתי לזהות פריטי מזון בתיאור. תוכל לתאר מה אכלת?',
      };
    }

    const components: ParsedComponent[] = parsedJson.components.map((c: any) => ({
      name: String(c.name || 'פריט מזון'),
      quantityValue: Math.max(0.1, Number(c.quantityValue) || 1),
      quantityUnit: String(c.quantityUnit || 'מנה'),
      calories: Math.max(0, Math.round(Number(c.calories) || 0)),
      proteinG: Math.max(0, Math.round((Number(c.proteinG) || 0) * 10) / 10),
      carbsG: Math.max(0, Math.round((Number(c.carbsG) || 0) * 10) / 10),
      fatG: Math.max(0, Math.round((Number(c.fatG) || 0) * 10) / 10),
      fiberG: Math.max(0, Math.round((Number(c.fiberG) || 0) * 10) / 10),
      isEstimated: Boolean(c.isEstimated),
      confidence: c.confidence === 'low' || c.confidence === 'medium' ? c.confidence : 'high',
    }));

    const totalCalories = components.reduce((sum, c) => sum + c.calories, 0);
    const totalProtein = components.reduce((sum, c) => sum + c.proteinG, 0);
    const totalCarbs = components.reduce((sum, c) => sum + c.carbsG, 0);
    const totalFat = components.reduce((sum, c) => sum + c.fatG, 0);
    const totalFiber = components.reduce((sum, c) => sum + c.fiberG, 0);

    return {
      status: 'saved',
      confidence: parsedJson.confidence || 'high',
      calories: totalCalories,
      proteinG: Math.round(totalProtein * 10) / 10,
      carbsG: Math.round(totalCarbs * 10) / 10,
      fatG: Math.round(totalFat * 10) / 10,
      fiberG: Math.round(totalFiber * 10) / 10,
      components,
    };
  } catch (error) {
    console.error('Gemini API call failed, falling back to heuristic parser:', error);
    return fallbackHeuristicParser(trimmed, foodMemories);
  }
}

/**
 * PR-08: Direct Voice / Audio Analysis with Gemini Multimodal
 */
export async function analyzeFoodAudioWithGemini(
  audioBase64: string,
  mimeType: string,
  foodMemories?: FoodMemoryItem[]
): Promise<FoodAnalysisResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return fallbackHeuristicParser('כריך חזה עוף עם סלט ירקות וטחינה', foodMemories);
  }

  try {
    const ai = getAiClient();
    let memoryInstructions = '';
    if (foodMemories && foodMemories.length > 0) {
      memoryInstructions = `
הגדרות מזון מותאמות אישית של המשתמש:
${foodMemories.map((m) => `- כשנאמר "${m.triggerName}", הכוונה היא: "${m.resolvedDescription}"`).join('\n')}
`;
    }

    const prompt = `אתה מנוע תזונתי מתקדם המסוגל להאזין להקלטה קולית בעברית, לתמלל אותה במדויק ולנתח את פרטי המזון שבה.
הוראות:
1. תמלל במדויק לעברית את מה שנאמר בהקלטה והצב ב-"transcription".
2. אם ההקלטה שקטה, לא מובנת, או אינה קשורה לאוכל, קבע isFood = false ורשום שאלה קצרה ב-clarificationQuestion.
3. זהה את כל פריטי המזון, הכמויות, היחידות וחשב ערכים תזונתיים מדויקים (קלוריות, חלבון, פחמימות, שומן, סיבים).
${memoryInstructions}
4. אם לא נאמרה כמות, השתמש בהערכה ישראלית סטנדרטית וסמן isEstimated = true.`;

    const cleanMime = mimeType ? mimeType.split(';')[0] : 'audio/webm';

    const response = await ai.models.generateContent({
      model: FAST_LOW_COST_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: audioBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: foodAudioAnalysisSchema,
        temperature: 0.1,
      },
    });

    const parsedJson = cleanAndParseJson(response.text);

    if (!parsedJson || !parsedJson.isFood || !parsedJson.components || parsedJson.components.length === 0) {
      return {
        status: 'needs_clarification',
        clarificationQuestion:
          parsedJson?.clarificationQuestion ||
          'לא הצלחתי לשמוע בבירור פריטי מזון בהקלטה. נסה להקליט שוב או לכתוב.',
      };
    }

    const components: ParsedComponent[] = parsedJson.components.map((c: any) => ({
      name: String(c.name || 'פריט מזון'),
      quantityValue: Math.max(0.1, Number(c.quantityValue) || 1),
      quantityUnit: String(c.quantityUnit || 'מנה'),
      calories: Math.max(0, Math.round(Number(c.calories) || 0)),
      proteinG: Math.max(0, Math.round((Number(c.proteinG) || 0) * 10) / 10),
      carbsG: Math.max(0, Math.round((Number(c.carbsG) || 0) * 10) / 10),
      fatG: Math.max(0, Math.round((Number(c.fatG) || 0) * 10) / 10),
      fiberG: Math.max(0, Math.round((Number(c.fiberG) || 0) * 10) / 10),
      isEstimated: Boolean(c.isEstimated),
      confidence: c.confidence === 'low' || c.confidence === 'medium' ? c.confidence : 'high',
    }));

    const totalCalories = components.reduce((sum, c) => sum + c.calories, 0);
    const totalProtein = components.reduce((sum, c) => sum + c.proteinG, 0);
    const totalCarbs = components.reduce((sum, c) => sum + c.carbsG, 0);
    const totalFat = components.reduce((sum, c) => sum + c.fatG, 0);
    const totalFiber = components.reduce((sum, c) => sum + c.fiberG, 0);

    return {
      status: 'saved',
      confidence: parsedJson.confidence || 'high',
      transcribedText: parsedJson.transcription || 'דיווח קולי',
      calories: totalCalories,
      proteinG: Math.round(totalProtein * 10) / 10,
      carbsG: Math.round(totalCarbs * 10) / 10,
      fatG: Math.round(totalFat * 10) / 10,
      fiberG: Math.round(totalFiber * 10) / 10,
      components,
    };
  } catch (error) {
    console.error('Gemini audio analysis failed:', error);
    return {
      status: 'needs_clarification',
      clarificationQuestion: 'אירעה שגיאה בפענוח ההקלטה. נסה שוב בקול ברור או כתוב בטקסט.',
    };
  }
}

/**
 * PR-09: Direct Photo / Camera Meal Analysis with Gemini Vision Multimodal
 * Zero-storage: Image buffer is passed directly to the model and never saved to disk.
 */
export async function analyzeFoodImageWithGemini(
  imageBase64: string,
  mimeType: string,
  foodMemories?: FoodMemoryItem[]
): Promise<FoodAnalysisResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return fallbackHeuristicParser('צלחת עוף ואורז עם סלט ירקות', foodMemories);
  }

  try {
    const ai = getAiClient();
    const cleanMime = mimeType ? mimeType.split(';')[0] : 'image/jpeg';
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9]+;base64,/, '');

    let memoryInstructions = '';
    if (foodMemories && foodMemories.length > 0) {
      memoryInstructions = `
הגדרות מזון מותאמות אישית של המשתמש:
${foodMemories.map((m) => `- אם מזהה "${m.triggerName}", התייחס לפירוט: "${m.resolvedDescription}"`).join('\n')}
`;
    }

    const prompt = `אתה מנוע תזונתי מתקדם מבוסס ראייה ממוחשבת (Clinical Nutrition & Vision AI) לאפליקציית מעקב תזונה ישראלית.
נתח את תמונת המזון/צלחת הבאה:
1. זהה את כל פריטי המזון, המרכיבים והמשקאות הנראים בתמונה.
2. הערך כמויות הגשה ריאליות (בגרמים, יחידות, כפות, קערה).
${memoryInstructions}
3. נסח סיכום קצר של הארוחה בעברית ב-mealDescription (לדוגמה: "ארוחת צהריים: חזה עוף צלוי עם אורז וסלט קצוץ").
4. חשב ערכים תזונתיים מדויקים: קלוריות (קק״ל), חלבון (גרם), פחמימות (גרם), שומן (גרם), סיבים (גרם) לכל רכיב בנפרד.
5. אם התמונה אינה מכילה אוכל או שתייה (או שהיא מטושטשת לגמרי), קבע isFood = false וספק שאלה קצרה ב-clarificationQuestion.`;

    const response = await ai.models.generateContent({
      model: FAST_LOW_COST_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: foodImageAnalysisSchema,
        temperature: 0.1,
      },
    });

    const parsedJson = cleanAndParseJson(response.text);

    if (!parsedJson || !parsedJson.isFood || !parsedJson.components || parsedJson.components.length === 0) {
      return {
        status: 'needs_clarification',
        clarificationQuestion:
          parsedJson?.clarificationQuestion ||
          'לא הצלחתי לזהות בבירור פריטי מזון בתמונה. תוכל לצלם מזווית אחרת או לכתוב מה אכלת?',
      };
    }

    const components: ParsedComponent[] = parsedJson.components.map((c: any) => ({
      name: String(c.name || 'פריט מזון'),
      quantityValue: Math.max(0.1, Number(c.quantityValue) || 1),
      quantityUnit: String(c.quantityUnit || 'מנה'),
      calories: Math.max(0, Math.round(Number(c.calories) || 0)),
      proteinG: Math.max(0, Math.round((Number(c.proteinG) || 0) * 10) / 10),
      carbsG: Math.max(0, Math.round((Number(c.carbsG) || 0) * 10) / 10),
      fatG: Math.max(0, Math.round((Number(c.fatG) || 0) * 10) / 10),
      fiberG: Math.max(0, Math.round((Number(c.fiberG) || 0) * 10) / 10),
      isEstimated: Boolean(c.isEstimated ?? true),
      confidence: c.confidence === 'low' || c.confidence === 'medium' ? c.confidence : 'high',
    }));

    const totalCalories = components.reduce((sum, c) => sum + c.calories, 0);
    const totalProtein = components.reduce((sum, c) => sum + c.proteinG, 0);
    const totalCarbs = components.reduce((sum, c) => sum + c.carbsG, 0);
    const totalFat = components.reduce((sum, c) => sum + c.fatG, 0);
    const totalFiber = components.reduce((sum, c) => sum + c.fiberG, 0);

    return {
      status: 'saved',
      confidence: parsedJson.confidence || 'high',
      transcribedText: parsedJson.mealDescription || 'צילום ארוחה',
      calories: totalCalories,
      proteinG: Math.round(totalProtein * 10) / 10,
      carbsG: Math.round(totalCarbs * 10) / 10,
      fatG: Math.round(totalFat * 10) / 10,
      fiberG: Math.round(totalFiber * 10) / 10,
      components,
    };
  } catch (error) {
    console.error('Gemini image analysis failed:', error);
    return {
      status: 'needs_clarification',
      clarificationQuestion: 'אירעה שגיאה בפענוח התמונה. נסה לצלם שוב באור ברור או לכתוב בטקסט.',
    };
  }
}

/**
 * PR-07: Conversational Refinement of an existing FoodReport
 */
export async function refineFoodReportWithGemini(
  refinementText: string,
  currentReport: FoodReport,
  foodMemories?: FoodMemoryItem[]
): Promise<RefinementResponse> {
  const trimmed = refinementText.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return fallbackRefinementParser(trimmed, currentReport, foodMemories);
  }

  try {
    const ai = getAiClient();
    const existingComponentsSummary = currentReport.components
      .map((c) => `- ${c.name}: ${c.quantityValue} ${c.quantityUnit} (${c.calories} קק״ל, חלבון: ${c.proteinG}ג, פחמימות: ${c.carbsG}ג, שומן: ${c.fatG}ג, סיבים: ${c.fiberG}ג)`)
      .join('\n');

    let memoryInstructions = '';
    if (foodMemories && foodMemories.length > 0) {
      memoryInstructions = `
הגדרות מזון אישיות של המשתמש:
${foodMemories.map((m) => `- "${m.triggerName}": "${m.resolvedDescription}"`).join('\n')}
`;
    }

    const prompt = `אתה מנוע תזונתי מתקדם (Conversational Nutrition AI).
המשתמש דיווח קודם לכן על המנה הבאה:
תיאור מקורי: "${currentReport.originalText}"
רכיבים קיימים:
${existingComponentsSummary}

${memoryInstructions}

כעת המשתמש מבקש לבצע תיקון/עדכון במנה:
הוראת התיקון: "${trimmed}"

הנחיות לביצוע:
1. הבן את כוונת התיקון:
   - הסרת רכיב (למשל: "בלי הסלט", "לא אכלתי את הלחם") -> הסר את הרכיב מרשימת הרכיבים.
   - שינוי כמות (למשל: "זה היה 200 גרם חזה עוף", "רק חצי פיתה") -> עדכן את הכמות והערכים התזונתיים בהתאם.
   - החלפת פריט (למשל: "לחם מלא במקום לחם לבן") -> החלף את הרכיב וחשב ערכים חדשים.
   - הוספת פריט (למשל: "תוסיף גם כוס קולה זירו", "ועוד כף טחינה") -> הוסף רכיב חדש עם ערכיו.
2. החזר את רשימת הרכיבים המלאה והמעודכנת.
3. ספק משפט סיכום קצר וברור בעברית בשדה "changeSummary" המסביר מה שונה (למשל: "הסרתי את הסלט ועדכנתי את כמות חזה העוף ל-200 גרם").`;

    const response = await ai.models.generateContent({
      model: FAST_LOW_COST_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: foodRefinementSchema,
        temperature: 0.1,
      },
    });

    const parsedJson = cleanAndParseJson(response.text);

    if (!parsedJson) {
      return fallbackRefinementParser(trimmed, currentReport, foodMemories);
    }

    const components: ParsedComponent[] = (parsedJson.components || []).map((c: any) => ({
      name: String(c.name || 'פריט מזון'),
      quantityValue: Math.max(0.1, Number(c.quantityValue) || 1),
      quantityUnit: String(c.quantityUnit || 'מנה'),
      calories: Math.max(0, Math.round(Number(c.calories) || 0)),
      proteinG: Math.max(0, Math.round((Number(c.proteinG) || 0) * 10) / 10),
      carbsG: Math.max(0, Math.round((Number(c.carbsG) || 0) * 10) / 10),
      fatG: Math.max(0, Math.round((Number(c.fatG) || 0) * 10) / 10),
      fiberG: Math.max(0, Math.round((Number(c.fiberG) || 0) * 10) / 10),
      isEstimated: Boolean(c.isEstimated),
      confidence: c.confidence === 'low' || c.confidence === 'medium' ? c.confidence : 'high',
    }));

    const totalCalories = components.reduce((sum, c) => sum + c.calories, 0);
    const totalProtein = components.reduce((sum, c) => sum + c.proteinG, 0);
    const totalCarbs = components.reduce((sum, c) => sum + c.carbsG, 0);
    const totalFat = components.reduce((sum, c) => sum + c.fatG, 0);
    const totalFiber = components.reduce((sum, c) => sum + c.fiberG, 0);

    return {
      status: 'saved',
      confidence: parsedJson.confidence || 'high',
      changeSummary: parsedJson.changeSummary || 'המנה עודכנה בהתאם לבקשתך',
      calories: totalCalories,
      proteinG: Math.round(totalProtein * 10) / 10,
      carbsG: Math.round(totalCarbs * 10) / 10,
      fatG: Math.round(totalFat * 10) / 10,
      fiberG: Math.round(totalFiber * 10) / 10,
      components,
    };
  } catch (error) {
    console.error('Gemini refinement failed, falling back to heuristic:', error);
    return fallbackRefinementParser(trimmed, currentReport, foodMemories);
  }
}

// Fallback refinement parser for local offline testing
function fallbackRefinementParser(
  text: string,
  currentReport: FoodReport,
  _foodMemories?: FoodMemoryItem[]
): RefinementResponse {
  let updatedComponents = [...currentReport.components];
  let summary = 'המנה עודכנה';

  if (text.includes('בלי') || text.includes('להוריד') || text.includes('ללא')) {
    const wordToRemove = text.replace(/בלי|להוריד|ללא/g, '').trim();
    if (wordToRemove) {
      updatedComponents = updatedComponents.filter(
        (c) => !c.name.toLowerCase().includes(wordToRemove.toLowerCase())
      );
      summary = `הוסר הרכיב לפי בקשתך`;
    }
  } else if (text.includes('תוסיף') || text.includes('ועוד') || text.includes('גם')) {
    updatedComponents.push({
      id: `comp-refine-${Date.now()}`,
      reportId: currentReport.id,
      name: text.replace(/תוסיף|ועוד|גם/g, '').trim() || 'תוספת',
      quantityValue: 1,
      quantityUnit: 'מנה',
      calories: 90,
      proteinG: 2,
      carbsG: 12,
      fatG: 3,
      fiberG: 1,
      isEstimated: true,
      confidence: 'medium',
    });
    summary = `נוספה תוספת למנה`;
  }

  const totalCalories = updatedComponents.reduce((sum, c) => sum + c.calories, 0);
  const totalProtein = updatedComponents.reduce((sum, c) => sum + c.proteinG, 0);
  const totalCarbs = updatedComponents.reduce((sum, c) => sum + c.carbsG, 0);
  const totalFat = updatedComponents.reduce((sum, c) => sum + c.fatG, 0);
  const totalFiber = updatedComponents.reduce((sum, c) => sum + c.fiberG, 0);

  return {
    status: 'saved',
    confidence: 'medium',
    changeSummary: summary,
    calories: totalCalories,
    proteinG: Math.round(totalProtein * 10) / 10,
    carbsG: Math.round(totalCarbs * 10) / 10,
    fatG: Math.round(totalFat * 10) / 10,
    fiberG: Math.round(totalFiber * 10) / 10,
    components: updatedComponents,
  };
}

// Fallback heuristic parser for local testing or when API key is offline
function fallbackHeuristicParser(
  text: string,
  foodMemories?: FoodMemoryItem[]
): FoodAnalysisResponse {
  const lower = text.toLowerCase();

  // If user has defined a personalized food memory, match it first!
  if (foodMemories && foodMemories.length > 0) {
    for (const mem of foodMemories) {
      if (lower.includes(mem.triggerName.toLowerCase())) {
        return {
          status: 'saved',
          confidence: 'high',
          calories: 120,
          proteinG: 6,
          carbsG: 9,
          fatG: 5,
          fiberG: 1,
          components: [
            {
              name: mem.resolvedDescription,
              quantityValue: 1,
              quantityUnit: 'מנה אישית',
              calories: 120,
              proteinG: 6,
              carbsG: 9,
              fatG: 5,
              fiberG: 1,
              isEstimated: false,
              confidence: 'high',
            },
          ],
        };
      }
    }
  }

  const foodDatabase: Record<string, { cal: number; p: number; c: number; f: number; fib: number; unit: string }> = {
    'ביצה': { cal: 70, p: 6, c: 0.5, f: 5, fib: 0, unit: 'יחידה' },
    'ביצים': { cal: 140, p: 12, c: 1, f: 10, fib: 0, unit: '2 יחידות' },
    'לחם': { cal: 75, p: 3, c: 14, f: 0.8, fib: 2, unit: 'פרוסה' },
    'טוסט': { cal: 250, p: 12, c: 28, f: 10, fib: 2, unit: 'יחידה' },
    'טחינה': { cal: 95, p: 3.5, c: 1.5, f: 8.5, fib: 1, unit: 'כף' },
    'עוף': { cal: 220, p: 38, c: 0, f: 4.5, fib: 0, unit: '150 גרם' },
    'חזה עוף': { cal: 230, p: 44, c: 0, f: 4.5, fib: 0, unit: '150 גרם' },
    'אורז': { cal: 180, p: 4, c: 40, f: 0.5, fib: 1, unit: '150 גרם' },
    'סלט': { cal: 65, p: 1.5, c: 5, f: 4.5, fib: 2.5, unit: 'קערה קטנה' },
    'תפוח': { cal: 80, p: 0.4, c: 21, f: 0.2, fib: 4, unit: 'יחידה' },
    'בננה': { cal: 105, p: 1.3, c: 27, f: 0.3, fib: 3, unit: 'יחידה' },
    'יוגורט': { cal: 120, p: 10, c: 8, f: 3, fib: 0, unit: 'גביע' },
    'ביו': { cal: 110, p: 9, c: 7, f: 3, fib: 0, unit: 'גביע ביו' },
    'קפה': { cal: 35, p: 1.5, c: 3, f: 1.5, fib: 0, unit: 'כוס' },
    'שניצל': { cal: 280, p: 24, c: 18, f: 12, fib: 1, unit: 'יחידה' },
    'שוקולד': { cal: 150, p: 2, c: 17, f: 9, fib: 1, unit: '4 קוביות' },
    'פיצה': { cal: 290, p: 12, c: 32, f: 11, fib: 2, unit: 'משולש' },
  };

  const matchedComponents: ParsedComponent[] = [];

  for (const [key, val] of Object.entries(foodDatabase)) {
    if (lower.includes(key)) {
      matchedComponents.push({
        name: key,
        quantityValue: 1,
        quantityUnit: val.unit,
        calories: val.cal,
        proteinG: val.p,
        carbsG: val.c,
        fatG: val.f,
        fiberG: val.fib,
        isEstimated: true,
        confidence: 'medium',
      });
    }
  }

  if (matchedComponents.length === 0) {
    if (text.length < 3 || text.includes('שלום') || text.includes('מה נשמע')) {
      return {
        status: 'needs_clarification',
        clarificationQuestion: 'מה אכלת או שתית? כתוב לדוגמה: "סלט יווני ופרוסת לחם"',
      };
    }

    matchedComponents.push({
      name: text,
      quantityValue: 1,
      quantityUnit: 'מנה',
      calories: 250,
      proteinG: 12,
      carbsG: 30,
      fatG: 8,
      fiberG: 2,
      isEstimated: true,
      confidence: 'medium',
    });
  }

  const totalCalories = matchedComponents.reduce((sum, c) => sum + c.calories, 0);
  const totalProtein = matchedComponents.reduce((sum, c) => sum + c.proteinG, 0);
  const totalCarbs = matchedComponents.reduce((sum, c) => sum + c.carbsG, 0);
  const totalFat = matchedComponents.reduce((sum, c) => sum + c.fatG, 0);
  const totalFiber = matchedComponents.reduce((sum, c) => sum + c.fiberG, 0);

  return {
    status: 'saved',
    confidence: 'medium',
    calories: totalCalories,
    proteinG: Math.round(totalProtein * 10) / 10,
    carbsG: Math.round(totalCarbs * 10) / 10,
    fatG: Math.round(totalFat * 10) / 10,
    fiberG: Math.round(totalFiber * 10) / 10,
    components: matchedComponents,
  };
}
