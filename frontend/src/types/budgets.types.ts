export interface Budget {
  id: number;
  name: string;
  description?: string;
  period_type: BudgetPeriod;
  start_date: string;
  end_date: string;
  total_budget: number;
  allocated_amount: number;
  spent_amount: number;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  allocations: BudgetAllocation[];
  creator?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  spending?: BudgetSpendingAnalysis;
}

export interface BudgetAllocation {
  id: number;
  budget_id: number;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Added by spending calculation
  actual_spent?: number;
  variance?: number;
  variancePercentage?: number;
  utilizationPercentage?: number;
  status?: "OVER_BUDGET" | "UNDER_UTILIZED" | "ON_TRACK";
}

export interface BudgetSpendingAnalysis {
  budgetId: number;
  budgetName: string;
  period: {
    type: BudgetPeriod;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalBudgeted: number;
    totalActualSpent: number;
    totalVariance: number;
    totalVariancePercentage: number;
    utilizationPercentage: number;
    status: "OVER_BUDGET" | "UNDER_UTILIZED" | "ON_TRACK";
  };
  allocations: BudgetAllocation[];
}

export interface BudgetVarianceAnalysis extends BudgetSpendingAnalysis {
  variance: {
    significantVariances: BudgetAllocation[];
    insights: VarianceInsight[];
    trends: BudgetTrends;
  };
}

export interface VarianceInsight {
  type: "OVER_BUDGET" | "UNDER_UTILIZED";
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  categories: string[];
  recommendation: string;
}

export interface BudgetTrends {
  hasPreviousData: boolean;
  comparisonPeriod?: {
    current: string;
    previous: string;
  };
  trends?: {
    totalSpendingTrend: {
      current: number;
      previous: number;
      change: number;
      changePercentage: number;
    };
    categoryTrends: CategoryTrend[];
  };
  message?: string;
}

export interface CategoryTrend {
  category: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: "INCREASING" | "DECREASING" | "STABLE";
}

export interface BudgetRecommendations {
  budgetId: number;
  generatedAt: string;
  recommendations: BudgetRecommendation[];
  summary: {
    totalRecommendations: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  };
}

export interface BudgetRecommendation {
  type: "BUDGET_CONTROL" | "CATEGORY_OPTIMIZATION" | "BUDGET_REALLOCATION" | "TREND_ANALYSIS";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  actions: string[];
  estimatedImpact: string;
  categories?: string[];
}

export interface CreateBudgetRequest {
  name: string;
  description?: string;
  period_type: BudgetPeriod;
  start_date: string;
  end_date: string;
  total_budget: number;
  allocations: CreateBudgetAllocation[];
}

export interface CreateBudgetAllocation {
  category: string;
  allocated_amount: number;
  notes?: string;
}

export interface BudgetFilters {
  period_type?: BudgetPeriod;
  is_active?: boolean;
  year?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedBudgets {
  budgets: Budget[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BudgetAnalytics {
  totalBudgets: number;
  activeBudgets: number;
  totalAllocated: number;
  totalSpent: number;
  averageUtilization: number;
}

export enum BudgetPeriod {
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY"
}

export const BudgetPeriodLabels: Record<BudgetPeriod, string> = {
  [BudgetPeriod.WEEKLY]: "Weekly",
  [BudgetPeriod.MONTHLY]: "Monthly",
  [BudgetPeriod.QUARTERLY]: "Quarterly",
  [BudgetPeriod.YEARLY]: "Yearly"
};

export const BudgetStatusColors = {
  OVER_BUDGET: "bg-red-100 text-red-800 border-red-200 dark:bg-red-800 dark:text-red-100 dark:border-red-600",
  UNDER_UTILIZED: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:border-yellow-600",
  ON_TRACK: "bg-green-100 text-green-800 border-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-600"
};

export const BudgetStatusLabels = {
  OVER_BUDGET: "Over Budget",
  UNDER_UTILIZED: "Under-Utilized",
  ON_TRACK: "On Track"
};

export const PriorityColors = {
  HIGH: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 dark:border-red-600",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 dark:border-yellow-600",
  LOW: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600"
};

// Material categories for budget allocation
export const MaterialCategories = ["MEAT", "VEGETABLES", "DAIRY", "BEVERAGES", "CONDIMENTS", "GRAINS", "SPICES", "PACKAGING", "OTHER"] as const;

export type Category = (typeof MaterialCategories)[number];
