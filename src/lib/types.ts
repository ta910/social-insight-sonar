export type Project = {
  id: string;
  name: string;
  category: string;
  brand: string;
  keywords: string[];
  competitor_brands: string[];
  created_at: string;
};

export type PeriodType = "weekly" | "monthly" | "yearly";

export type RawSource = {
  url: string;
  title: string;
};

export type CompetitorSummary = {
  summary: string;
  sources: RawSource[];
};

export type PeriodComparison = {
  new_category_insights: string[];
  lost_category_insights: string[];
  new_brand_insights: string[];
  lost_brand_insights: string[];
  summary: string;
};

export type Report = {
  id: string;
  project_id: string;
  period_type: PeriodType;
  period_start: string;
  category_summary: string;
  brand_summary: string;
  key_insights: string[];           // legacy
  category_insights: string[];
  brand_insights: string[];
  competitor_summaries: Record<string, CompetitorSummary>;
  period_comparison: PeriodComparison | null;
  raw_sources: RawSource[];
  created_at: string;
};
