import type { ExtractedData } from './extractor';
import type { AIAnalysis } from '../types/analysis';
import { analyzeWithGemini, analyzeWithGroq } from './llm-client';
import { LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from './prompts';

export async function analyzeWithAI(data: ExtractedData, apiKey?: string): Promise<AIAnalysis | null> {
  try {
    const prompt = buildAnalysisPrompt(data);
    const response = apiKey
      ? await analyzeWithGemini(LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT, prompt, apiKey)
      : await analyzeWithGroq(LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT, prompt);

    if (!response) return null;

    const cleaned = response
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed: AIAnalysis = JSON.parse(cleaned);

    if (!parsed.summary || !parsed.overallVerdict || !Array.isArray(parsed.recommendations)) {
      console.warn('AI analysis response missing required fields');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Error in AI analysis:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}
