import { FoodReport, UserFoodMemory } from '../types';

export interface ClarificationResponse {
  id: string;
  clientRequestId: string;
  status: 'needs_clarification';
  clarificationQuestion: string;
  originalText: string;
  recordedAt: string;
}

export type AnalyzeTextResult =
  | { status: 'success'; data: FoodReport }
  | { status: 'needs_clarification'; question: string }
  | { status: 'error'; error: string };

export type RefineReportResult =
  | { status: 'success'; data: FoodReport; changeSummary: string }
  | { status: 'error'; error: string };

export async function analyzeFoodTextApi(
  text: string,
  userId?: string,
  foodMemories?: UserFoodMemory[]
): Promise<AnalyzeTextResult> {
  const clientRequestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  try {
    const response = await fetch('/api/reports/analyze-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        clientRequestId,
        userId: userId || 'local-user-1',
        foodMemories: foodMemories?.map((m) => ({
          triggerName: m.triggerName,
          resolvedDescription: m.resolvedDescription,
        })),
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        status: 'error',
        error: errData.error || `Server responded with status ${response.status}`,
      };
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      return {
        status: 'error',
        error: json.error || 'Failed to process report',
      };
    }

    if (json.data.status === 'needs_clarification') {
      return {
        status: 'needs_clarification',
        question:
          json.data.clarificationQuestion || 'לא הצלחנו לזהות מזון. תוכל לפרט מה אכלת?',
      };
    }

    return {
      status: 'success',
      data: json.data as FoodReport,
    };
  } catch (error: any) {
    console.error('API call analyzeFoodTextApi failed:', error);
    return {
      status: 'error',
      error: error.message || 'שגיאת תקשורת עם השרת',
    };
  }
}

/**
 * PR-08: Direct Audio Analysis API
 */
export async function analyzeFoodAudioApi(
  audioBase64: string,
  mimeType: string,
  userId?: string,
  foodMemories?: UserFoodMemory[]
): Promise<AnalyzeTextResult> {
  const clientRequestId = `req-audio-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  try {
    const response = await fetch('/api/reports/analyze-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64,
        mimeType,
        clientRequestId,
        userId: userId || 'local-user-1',
        foodMemories: foodMemories?.map((m) => ({
          triggerName: m.triggerName,
          resolvedDescription: m.resolvedDescription,
        })),
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        status: 'error',
        error: errData.error || `Server responded with status ${response.status}`,
      };
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      return {
        status: 'error',
        error: json.error || 'Failed to process voice recording',
      };
    }

    if (json.data.status === 'needs_clarification') {
      return {
        status: 'needs_clarification',
        question:
          json.data.clarificationQuestion || 'לא הצלחנו לזהות מזון בהקלטה. נסה שוב או כתוב בטקסט.',
      };
    }

    return {
      status: 'success',
      data: json.data as FoodReport,
    };
  } catch (error: any) {
    console.error('API call analyzeFoodAudioApi failed:', error);
    return {
      status: 'error',
      error: error.message || 'שגיאת תקשורת עם השרת בפענוח הקלטה',
    };
  }
}

/**
 * PR-09: Direct Photo / Camera Meal Analysis API (Zero-Storage)
 */
export async function analyzeFoodImageApi(
  imageBase64: string,
  mimeType: string,
  userId?: string,
  foodMemories?: UserFoodMemory[]
): Promise<AnalyzeTextResult> {
  const clientRequestId = `req-image-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  try {
    const response = await fetch('/api/reports/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        clientRequestId,
        userId: userId || 'local-user-1',
        foodMemories: foodMemories?.map((m) => ({
          triggerName: m.triggerName,
          resolvedDescription: m.resolvedDescription,
        })),
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        status: 'error',
        error: errData.error || `Server responded with status ${response.status}`,
      };
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      return {
        status: 'error',
        error: json.error || 'Failed to process meal photo',
      };
    }

    if (json.data.status === 'needs_clarification') {
      return {
        status: 'needs_clarification',
        question:
          json.data.clarificationQuestion ||
          'לא הצלחנו לזהות מזון בתמונה. נסה לצלם שוב או לתאר בטקסט.',
      };
    }

    return {
      status: 'success',
      data: json.data as FoodReport,
    };
  } catch (error: any) {
    console.error('API call analyzeFoodImageApi failed:', error);
    return {
      status: 'error',
      error: error.message || 'שגיאת תקשורת עם השרת בפענוח תמונה',
    };
  }
}

/**
 * PR-07: Conversational refinement API call
 */
export async function refineFoodReportApi(
  refinementText: string,
  currentReport: FoodReport,
  userId?: string,
  foodMemories?: UserFoodMemory[]
): Promise<RefineReportResult> {
  try {
    const response = await fetch('/api/reports/refine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refinementText,
        currentReport,
        userId: userId || 'local-user-1',
        foodMemories: foodMemories?.map((m) => ({
          triggerName: m.triggerName,
          resolvedDescription: m.resolvedDescription,
        })),
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        status: 'error',
        error: errData.error || `Server responded with status ${response.status}`,
      };
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      return {
        status: 'error',
        error: json.error || 'Failed to refine report',
      };
    }

    return {
      status: 'success',
      data: json.data.updatedReport as FoodReport,
      changeSummary: json.data.changeSummary || 'המנה עודכנה',
    };
  } catch (error: any) {
    console.error('API call refineFoodReportApi failed:', error);
    return {
      status: 'error',
      error: error.message || 'שגיאת תקשורת עם השרת',
    };
  }
}
