import { DocumentFormat } from './document-format.model';

export interface DashboardStatsResponse {
  summary: DashboardSummary;
  categoryDistribution: CategoryDistributionItem[];
  recentDocuments: RecentDocumentItem[];
}

export interface DashboardSummary {
  totalActiveDocuments: number;
  documentsUploadedThisMonth: number;
  topCategory: TopCategory | null;
}

export interface TopCategory {
  name: string;
  count: number;
}

export interface CategoryDistributionItem {
  categoryName: string;
  count: number;
  percentage: number;
}

export interface RecentDocumentItem {
  id: number;
  title: string;
  category: string;
  responsibleArea: string;
  fileFormat: DocumentFormat;
  createdAt: string;
}
