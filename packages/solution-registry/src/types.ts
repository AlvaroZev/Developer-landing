import type { Complexity, LocaleText } from "@triunder/domain";

export interface NavigationItem {
  id: string;
  labelKey: string;
  path: string;
  icon?: string;
  minComplexity?: Complexity;
}

export interface DashboardWidget {
  id: string;
  type: "metric" | "chart" | "table" | "list" | "status";
  titleKey: string;
  dataKey: string;
  minComplexity?: Complexity;
}

export interface SolutionDefinition {
  id: string;
  slug: string;
  category:
    | "business-management"
    | "commerce"
    | "operations"
    | "data-intelligence"
    | "hardware-engineering";
  name: LocaleText;
  description: LocaleText;
  icon: string;
  compatibleIndustryIds: string[];
  navigation: NavigationItem[];
  dashboard: DashboardWidget[];
  availableModuleIds: string[];
  defaultComplexity: Complexity;
  demoTemplateId: string;
  /** When true, the interactive demo engine has a full implementation. */
  complete?: boolean;
}
