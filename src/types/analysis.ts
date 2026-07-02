export interface AIRecommendation {
  section: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIAnalysis {
  summary: string;
  overallVerdict: string;
  recommendations: AIRecommendation[];
  copySuggestions: {
    headline?: string;
    subheadline?: string;
    ctaText?: string[];
  };
}

export interface AIAnalysisResponse {
  success: boolean;
  analysis: AIAnalysis | null;
  error?: string;
}
