export type Project = {
  id: string;
  name: string;
  category: string;
  brand: string;
  keywords: string[];
  created_at: string;
};

export type PeriodType = "weekly" | "monthly" | "yearly";

export type RawSource = {
  url: string;
  title: string;
};

export type Report = {
  id: string;
  project_id: string;
  period_type: PeriodType;
  period_start: string;
  category_summary: string;
  brand_summary: string;
  key_insights: string[];
  raw_sources: RawSource[];
  created_at: string;
};
