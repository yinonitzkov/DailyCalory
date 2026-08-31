import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  analyzeFoodTextWithGemini,
  refineFoodReportWithGemini,
  analyzeFoodAudioWithGemini,
  analyzeFoodImageWithGemini,
} from './server/geminiAi';

dotenv.config();

const app = express();
const PORT = 3000;

// Allow larger payload for audio & image base64
app.use(express.json({ limit: '20mb' }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});


// Analyze Text endpoint (PR-04)
app.post('/api/reports/analyze-text', async (req, res) => {
  try {
    const { text, clientRequestId, userId, foodMemories } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "text" in request body',
      });
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text cannot be empty',
      });
    }

    if (trimmed.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Text exceeds maximum permitted length of 1000 characters',
      });
    }

    const analysis = await analyzeFoodTextWithGemini(trimmed, foodMemories);

    if (analysis.status === 'needs_clarification') {
      return res.json({
        success: true,
        data: {
          id: `clarify-${Date.now()}`,
          clientRequestId: clientRequestId || `req-${Date.now()}`,
          status: 'needs_clarification',
          clarificationQuestion: analysis.clarificationQuestion,
          originalText: trimmed,
          recordedAt: new Date().toISOString(),
        },
      });
    }

    const reportId = `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullReport = {
      id: reportId,
      userId: userId || 'local-user-1',
      clientRequestId: clientRequestId || `req-${Date.now()}`,
      inputType: 'text',
      originalText: trimmed,
      status: 'saved',
      confidence: analysis.confidence,
      calories: analysis.calories,
      proteinG: analysis.proteinG,
      carbsG: analysis.carbsG,
      fatG: analysis.fatG,
      fiberG: analysis.fiberG,
      recordedAt: new Date().toISOString(),
      components: analysis.components.map((c, i) => ({
        id: `comp-${reportId}-${i + 1}`,
        reportId,
        ...c,
      })),
    };

    return res.json({
      success: true,
      data: fullReport,
    });
  } catch (error: any) {
    console.error('Error analyzing food report:', error);
    return res.status(500).json({
      success: false,
      error: 'שגיאה בעיבוד הדיווח בשרת',
    });
  }
});

// Analyze Direct Audio endpoint (PR-08)
app.post('/api/reports/analyze-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType, clientRequestId, userId, foodMemories } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "audioBase64" in request body',
      });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, '');

    const analysis = await analyzeFoodAudioWithGemini(
      cleanBase64,
      mimeType || 'audio/webm',
      foodMemories
    );

    if (analysis.status === 'needs_clarification') {
      return res.json({
        success: true,
        data: {
          id: `clarify-${Date.now()}`,
          clientRequestId: clientRequestId || `req-${Date.now()}`,
          status: 'needs_clarification',
          clarificationQuestion: analysis.clarificationQuestion,
          originalText: 'הקלטה קולית',
          recordedAt: new Date().toISOString(),
        },
      });
    }

    const reportId = `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullReport = {
      id: reportId,
      userId: userId || 'local-user-1',
      clientRequestId: clientRequestId || `req-${Date.now()}`,
      inputType: 'voice',
      originalText: analysis.transcribedText || 'דיווח קולי',
      status: 'saved',
      confidence: analysis.confidence,
      calories: analysis.calories,
      proteinG: analysis.proteinG,
      carbsG: analysis.carbsG,
      fatG: analysis.fatG,
      fiberG: analysis.fiberG,
      recordedAt: new Date().toISOString(),
      components: analysis.components.map((c, i) => ({
        id: `comp-${reportId}-${i + 1}`,
        reportId,
        ...c,
      })),
    };

    return res.json({
      success: true,
      data: fullReport,
    });
  } catch (error: any) {
    console.error('Error analyzing audio report:', error);
    return res.status(500).json({
      success: false,
      error: 'שגיאה בפענוח ההקלטה הקולית בשרת',
    });
  }
});

// Analyze Direct Image / Camera endpoint (PR-09) - Zero Storage!
app.post(['/api/reports/analyze-image', '/api/reports/analyze-media'], async (req, res) => {
  try {
    const { imageBase64, mimeType, clientRequestId, userId, foodMemories } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "imageBase64" in request body',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9]+;base64,/, '');

    const analysis = await analyzeFoodImageWithGemini(
      cleanBase64,
      mimeType || 'image/jpeg',
      foodMemories
    );

    if (analysis.status === 'needs_clarification') {
      return res.json({
        success: true,
        data: {
          id: `clarify-${Date.now()}`,
          clientRequestId: clientRequestId || `req-${Date.now()}`,
          status: 'needs_clarification',
          clarificationQuestion: analysis.clarificationQuestion,
          originalText: 'צילום ארוחה',
          recordedAt: new Date().toISOString(),
        },
      });
    }

    const reportId = `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullReport = {
      id: reportId,
      userId: userId || 'local-user-1',
      clientRequestId: clientRequestId || `req-${Date.now()}`,
      inputType: 'photo',
      originalText: analysis.transcribedText || 'צילום ארוחה',
      status: 'saved',
      confidence: analysis.confidence,
      calories: analysis.calories,
      proteinG: analysis.proteinG,
      carbsG: analysis.carbsG,
      fatG: analysis.fatG,
      fiberG: analysis.fiberG,
      recordedAt: new Date().toISOString(),
      components: analysis.components.map((c, i) => ({
        id: `comp-${reportId}-${i + 1}`,
        reportId,
        ...c,
      })),
    };

    return res.json({
      success: true,
      data: fullReport,
    });
  } catch (error: any) {
    console.error('Error analyzing image report:', error);
    return res.status(500).json({
      success: false,
      error: 'שגיאה בפענוח תמונת הארוחה בשרת',
    });
  }
});

// Refine Existing Report endpoint (PR-07)
app.post('/api/reports/refine', async (req, res) => {
  try {
    const { refinementText, currentReport, foodMemories } = req.body;

    if (!refinementText || typeof refinementText !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "refinementText" in request body',
      });
    }

    if (!currentReport || !currentReport.id || !Array.isArray(currentReport.components)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "currentReport" object in request body',
      });
    }

    const trimmed = refinementText.trim();
    if (trimmed.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Refinement text exceeds maximum permitted length of 1000 characters',
      });
    }

    const refinedResult = await refineFoodReportWithGemini(trimmed, currentReport, foodMemories);

    const reportId = currentReport.id;
    const updatedReport = {
      ...currentReport,
      originalText: `${currentReport.originalText} (תיקון: ${trimmed})`,
      confidence: refinedResult.confidence,
      calories: refinedResult.calories,
      proteinG: refinedResult.proteinG,
      carbsG: refinedResult.carbsG,
      fatG: refinedResult.fatG,
      fiberG: refinedResult.fiberG,
      components: refinedResult.components.map((c, i) => ({
        id: (c as any).id || `comp-${reportId}-${Date.now()}-${i + 1}`,
        reportId,
        ...c,
      })),
    };

    return res.json({
      success: true,
      data: {
        updatedReport,
        changeSummary: refinedResult.changeSummary,
      },
    });
  } catch (error: any) {
    console.error('Error refining food report:', error);
    return res.status(500).json({
      success: false,
      error: 'שגיאה בתיקון הדיווח בשרת',
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
