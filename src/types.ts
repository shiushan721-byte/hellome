export interface VisibilityDetail {
  modelName: string;
  score: number;
}

export interface BrandMention {
  context: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface ActionableSuggestion {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface GeoResultData {
  visibilityRate: number;
  recommendationRate: number;
  competitorShare: number;
  visibilityDetails: VisibilityDetail[];
  keyCompetitors: string[];
  brandMentions: BrandMention[];
  dynamicAnalysis: string;
  actionableSuggestions: ActionableSuggestion[];
}

export interface HermesLog {
  id: string;
  timestamp: string;
  status: 'pending' | 'success' | 'active' | 'info';
  message: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
