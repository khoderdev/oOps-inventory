export interface CostAnalyticsOverview {
  totalPurchaseCosts: number;
  totalConsumptionCosts: number;
  totalWasteCosts: number;
  currentInventoryValue: number;
  foodCostPercentage: number;
  wastePercentage: number;
  inventoryTurnoverRatio: number;
  costEfficiencyRatio: number;
  netCostSavings: number;
  averageDailyCost: number;
  projectedMonthlyCost: number;
}

export interface CategoryBreakdown {
  [category: string]: {
    purchaseCosts: number;
    consumptionCosts: number;
    wasteCosts: number;
    inventoryValue: number;
    itemCount: number;
    avgCostPerUnit: number;
    turnoverRate: number;
    profitabilityScore: number;
  };
}

export interface MaterialPerformance {
  id: number;
  name: string;
  category: string;
  unitCost: number;
  consumptionValue: number;
  inventoryValue: number;
  turnoverRate: number;
  performanceScore: number;
  usage: number;
  lastUsed: number | null;
}

export interface MaterialPerformanceData {
  topPerformers: MaterialPerformance[];
  underPerformers: MaterialPerformance[];
  averagePerformanceScore: number;
}

export interface WeeklyTrend {
  week: string;
  startDate: Date;
  endDate: Date;
  purchaseCosts: number;
  consumptionCosts: number;
  efficiency: number;
}

export interface TrendData {
  weeklyTrends: WeeklyTrend[];
  trendDirection: "increasing" | "decreasing" | "stable";
}

export interface CostAnalyticsData {
  overview: CostAnalyticsOverview;
  categoryBreakdown: CategoryBreakdown;
  materialPerformance: MaterialPerformanceData;
  trends: TrendData;
  period: {
    days: number;
    startDate: Date;
    endDate: Date;
  };
}

export interface SupplierScorecard {
  overall: number;
  priceConsistency: number;
  volumeReliability: number;
  competitiveness: number;
  grade: "A" | "B" | "C" | "D";
}

export interface SupplierMaterial {
  name: string;
  category: string;
  totalCost: number;
  totalQuantity: number;
  orderCount: number;
  avgUnitCost: number;
  priceHistory: Array<{
    date: Date;
    unitCost: number;
    quantity: number;
  }>;
  costVariance: number;
  reliability: number;
}

export interface SupplierAnalysisData {
  supplier: string;
  totalCost: number;
  orderCount: number;
  avgOrderValue: number;
  categoryCount: number;
  materialCount: number;
  lastOrderDate: Date;
  scorecard: SupplierScorecard;
  materials: SupplierMaterial[];
  costPerCategory: { [category: string]: number };
  trends: {
    costTrend: Array<{ date: Date; cost: number }>;
    recentPerformance: string;
  };
}

export interface OptimizationOpportunity {
  materialName: string;
  category: string;
  currentSupplier: string;
  currentPrice: number;
  recommendedSupplier: string;
  recommendedPrice: number;
  potentialSavings: number;
  annualSavings: number;
  riskScore: "LOW" | "MEDIUM" | "HIGH";
  reliabilityDiff: number;
  savingsPercentage: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

export interface SupplierAnalysisResponse {
  supplierScorecards: SupplierAnalysisData[];
  optimizationOpportunities: OptimizationOpportunity[];
  totalPotentialSavings: number;
  totalAnnualSavings: number;
  summary: {
    totalSuppliers: number;
    averageScore: number;
    topPerformers: number;
    needsAttention: number;
  };
}

export interface OverstockItem {
  name: string;
  section: string;
  currentStock: number;
  maxLevel: number;
  excessQuantity: number;
  excessValue: number;
  daysToClear: number;
}

export interface SupplierOptimizationItem extends OptimizationOpportunity {
  implementationRisk: string;
  timeToImplement: string;
  nextSteps: string;
}

export interface SlowMovingItem {
  name: string;
  category: string;
  stockValue: number;
  daysInInventory: number;
  usageFrequency: number;
  recommendedAction: string;
}

export interface WasteItem {
  name: string;
  wasteValue: number;
  reason: string;
  date: Date;
}

export interface WasteCategoryData {
  category: string;
  wasteValue: number;
  frequency: number;
  topWasteItems: WasteItem[];
}

export interface CostOptimizationRecommendation {
  type: "OVERSTOCK_ALERT" | "SUPPLIER_OPTIMIZATION" | "SLOW_MOVING_INVENTORY" | "WASTE_REDUCTION";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  impact: number;
  action: string;
  items: OverstockItem[] | SupplierOptimizationItem[] | SlowMovingItem[] | WasteCategoryData[];
  urgency: string;
  estimatedTimeToResolve: string;
}

export interface OptimizationRecommendationsData {
  recommendations: CostOptimizationRecommendation[];
  totalPotentialSavings: number;
  summary: {
    totalRecommendations: number;
    highPriority: number;
    estimatedAnnualSavings: number;
    implementationTimeline: string;
  };
}

export interface DetailedWeeklyTrend {
  week: string;
  date: Date;
  purchaseCosts: number;
  consumptionCosts: number;
  orderCount: number;
  avgOrderValue: number;
  costEfficiency: number;
  categories: { [category: string]: number };
}

export interface TrendAnalysis {
  direction: "increasing" | "decreasing" | "stable";
  volatility: number;
  seasonality: string;
  forecast: {
    nextWeekPrediction: number;
    confidence: string;
  };
}

export interface CostTrendData {
  weeklyTrends: DetailedWeeklyTrend[];
  trendAnalysis: TrendAnalysis;
  period: {
    days: number;
    startDate: Date;
    endDate: Date;
  };
}

export interface CostControlDashboardData {
  analytics: CostAnalyticsData;
  supplierAnalysis: SupplierAnalysisResponse;
  trends: CostTrendData;
  recommendations: OptimizationRecommendationsData;
}

export interface CostControlFilters {
  days?: number;
  category?: string;
}

// Chart data interfaces
export interface CostTrendData {
  date: string;
  purchaseCosts: number;
  consumptionCosts: number;
  wasteCosts: number;
}

export interface CategoryCostData {
  category: string;
  purchaseCosts: number;
  consumptionCosts: number;
  wasteCosts: number;
  efficiency: number;
}

export interface SupplierComparisonData {
  supplier: string;
  totalCost: number;
  orderCount: number;
  avgOrderValue: number;
  efficiency: number;
}
