export type ScriptCategory =
  | 'shooter'
  | 'rpg'
  | 'simulator'
  | 'tycoon'
  | 'fighting'
  | 'adventure'
  | 'misc';

export type ScriptStatus = 'active' | 'patched' | 'private' | 'archived';

export interface ScriptSeo {
  title: string;
  description: string;
  keywords: string[];
}

export interface ScriptCompatibility {
  pc: boolean;
  mobile: boolean;
  executor_required: boolean;
}

export interface Script {
  slug: string;
  title: string;
  short: string;
  category: ScriptCategory;
  tags: string[];
  features: string[];
  thumbnail: string;
  workink_url: string;
  status: ScriptStatus;
  compatibility: ScriptCompatibility;
  version: string;
  release_date: string;
  updated_at: string;
  seo: ScriptSeo;
  description: string;
  views?: number;
  featured?: boolean;
}
