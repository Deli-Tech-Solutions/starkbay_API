export interface SearchResult {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  rank: number;
  highlighted_title?: string;
  highlighted_content?: string;
  entity_type: string;
  metadata?: any;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  facets?: SearchFacets;
  query_time: number;
  suggestions?: string[];
}

export interface SearchFacets {
  categories: FacetItem[];
  tags: FacetItem[];
}

export interface FacetItem {
  value: string;
  count: number;
}

export interface SearchAnalyticsData {
  query: string;
  results_count: number;
  response_time: number;
  filters_applied?: any;
  user_ip?: string;
  user_agent?: string;
}

