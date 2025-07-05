import { AlertCircle, AlertTriangle, Award, BarChart3, CheckCircle, Clock, DollarSign, RefreshCw, Star, Target, TrendingDown, TrendingUp, Users } from "lucide-react";
import React, { useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useCostControl } from "../../hooks/useCostControl";
import { formatCurrency } from "../../utils/quantity";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Tabs from "../ui/Tabs";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  colorClass?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, trend, trendValue, colorClass = "bg-blue-500", onClick }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${onClick ? "cursor-pointer" : ""}`} onClick={onClick}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{typeof value === "number" ? formatCurrency(value) : value}</p>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        {trend && trendValue && (
          <div className={`flex items-center mt-2 text-sm ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"}`}>
            {trend === "up" ? <TrendingUp className="w-4 h-4 mr-1" /> : trend === "down" ? <TrendingDown className="w-4 h-4 mr-1" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${colorClass} text-white`}>{icon}</div>
    </div>
  </div>
);

interface DetailsModalData {
  type: string;
  data: unknown[];
}

const CostControlPage: React.FC = () => {
  const { state } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");
  const [detailsModal, setDetailsModal] = useState<DetailsModalData | null>(null);

  const { analytics, suppliers, recommendations, isLoading, refetchAll } = useCostControl(selectedPeriod);

  // Check if user has admin access
  if (state.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Cost Control panel is only available to administrators.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading cost control data...</p>
        </div>
      </div>
    );
  }

  const overviewData = analytics.data?.overview;
  const categoryBreakdown = analytics.data?.categoryBreakdown;
  const materialPerformance = analytics.data?.materialPerformance;
  const supplierScorecards = suppliers.data?.supplierScorecards;
  const optimizationOpportunities = suppliers.data?.optimizationOpportunities;
  const recommendationsData = recommendations.data?.recommendations;

  const tabsData = [
    {
      id: "overview",
      label: "Overview"
    },
    {
      id: "suppliers",
      label: "Suppliers"
    },
    {
      id: "optimization",
      label: "Optimization"
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Purchase Costs" value={overviewData?.totalPurchaseCosts || 0} subtitle={`${selectedPeriod} days`} icon={<DollarSign className="w-6 h-6" />} colorClass="bg-blue-500" />
              <MetricCard title="Food Cost %" value={`${(overviewData?.foodCostPercentage || 0).toFixed(1)}%`} subtitle="Industry target: 28-35%" icon={<BarChart3 className="w-6 h-6" />} colorClass={(overviewData?.foodCostPercentage || 0) <= 35 ? "bg-green-500" : (overviewData?.foodCostPercentage || 0) <= 40 ? "bg-yellow-500" : "bg-red-500"} />
              <MetricCard title="Inventory Turnover" value={`${(overviewData?.inventoryTurnoverRatio || 0).toFixed(1)}x`} subtitle="Annual turnover rate" icon={<RefreshCw className="w-6 h-6" />} colorClass="bg-purple-500" />
              <MetricCard title="Waste Percentage" value={`${(overviewData?.wastePercentage || 0).toFixed(1)}%`} subtitle="Target: <3%" icon={<AlertTriangle className="w-6 h-6" />} colorClass={(overviewData?.wastePercentage || 0) <= 3 ? "bg-green-500" : "bg-red-500"} />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard title="Current Inventory Value" value={overviewData?.currentInventoryValue || 0} subtitle="Total stock value" icon={<Target className="w-6 h-6" />} colorClass="bg-indigo-500" />
              <MetricCard title="Average Daily Cost" value={overviewData?.averageDailyCost || 0} subtitle="Consumption cost per day" icon={<Clock className="w-6 h-6" />} colorClass="bg-teal-500" />
              <MetricCard title="Projected Monthly Cost" value={overviewData?.projectedMonthlyCost || 0} subtitle="Based on current rate" icon={<TrendingUp className="w-6 h-6" />} colorClass="bg-orange-500" />
            </div>

            {/* Category Performance */}
            {categoryBreakdown && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(categoryBreakdown).map(([category, data]) => (
                    <div key={category} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{category}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Purchase:</span>
                          <span className="font-medium">{formatCurrency(data.purchaseCosts)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Consumption:</span>
                          <span className="font-medium">{formatCurrency(data.consumptionCosts)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Turnover:</span>
                          <span className="font-medium">{data.turnoverRate.toFixed(1)}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Profitability:</span>
                          <span className={`font-medium ${data.profitabilityScore >= 85 ? "text-green-600" : data.profitabilityScore >= 70 ? "text-yellow-600" : "text-red-600"}`}>{data.profitabilityScore.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Material Performance */}
            {materialPerformance && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Top Performers
                  </h3>
                  <div className="space-y-3">
                    {materialPerformance.topPerformers.slice(0, 5).map(material => (
                      <div key={material.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{material.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{material.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{material.performanceScore.toFixed(1)}</p>
                          <p className="text-sm text-gray-500">{material.turnoverRate.toFixed(1)}x turnover</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                    Needs Attention
                  </h3>
                  <div className="space-y-3">
                    {materialPerformance.underPerformers.slice(0, 5).map(material => (
                      <div key={material.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{material.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{material.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">{material.performanceScore.toFixed(1)}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(material.inventoryValue)} stock</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "suppliers":
        return (
          <div className="space-y-6">
            {/* Supplier Summary */}
            {suppliers.data?.summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard title="Total Suppliers" value={suppliers.data.summary.totalSuppliers} icon={<Users className="w-6 h-6" />} colorClass="bg-blue-500" />
                <MetricCard title="Average Score" value={`${suppliers.data.summary.averageScore.toFixed(1)}/100`} icon={<Award className="w-6 h-6" />} colorClass="bg-green-500" />
                <MetricCard title="Top Performers" value={suppliers.data.summary.topPerformers} subtitle="Grade A suppliers" icon={<Star className="w-6 h-6" />} colorClass="bg-yellow-500" />
                <MetricCard title="Need Attention" value={suppliers.data.summary.needsAttention} subtitle="Below 70 score" icon={<AlertTriangle className="w-6 h-6" />} colorClass="bg-red-500" />
              </div>
            )}

            {/* Supplier Scorecards */}
            {supplierScorecards && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Supplier Scorecards</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Supplier</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Grade</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Overall Score</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Price Consistency</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Volume Reliability</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Total Spend</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierScorecards.slice(0, 10).map(supplier => (
                        <tr key={supplier.supplier} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{supplier.supplier}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${supplier.scorecard.grade === "A" ? "bg-green-100 text-green-800" : supplier.scorecard.grade === "B" ? "bg-blue-100 text-blue-800" : supplier.scorecard.grade === "C" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{supplier.scorecard.grade}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">{supplier.scorecard.overall.toFixed(1)}</td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">{supplier.scorecard.priceConsistency.toFixed(1)}%</td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">{supplier.scorecard.volumeReliability.toFixed(1)}%</td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">{formatCurrency(supplier.totalCost)}</td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">{supplier.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Optimization Opportunities */}
            {optimizationOpportunities && optimizationOpportunities.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost Optimization Opportunities</h3>
                <div className="space-y-4">
                  {optimizationOpportunities.slice(0, 8).map((opportunity, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{opportunity.materialName}</h4>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(opportunity.potentialSavings)}/month</p>
                          <p className="text-sm text-gray-500">{formatCurrency(opportunity.annualSavings)}/year</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Current: </span>
                          <span className="font-medium">
                            {opportunity.currentSupplier} - {formatCurrency(opportunity.currentPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Recommended: </span>
                          <span className="font-medium">
                            {opportunity.recommendedSupplier} - {formatCurrency(opportunity.recommendedPrice)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${opportunity.riskScore === "LOW" ? "bg-green-100 text-green-800" : opportunity.riskScore === "MEDIUM" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{opportunity.riskScore} Risk</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{opportunity.savingsPercentage.toFixed(1)}% savings</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "optimization":
        return (
          <div className="space-y-6">
            {/* Recommendations Summary */}
            {recommendations.data?.summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard title="Total Recommendations" value={recommendations.data.summary.totalRecommendations} icon={<CheckCircle className="w-6 h-6" />} colorClass="bg-blue-500" />
                <MetricCard title="High Priority" value={recommendations.data.summary.highPriority} subtitle="Requires immediate attention" icon={<AlertTriangle className="w-6 h-6" />} colorClass="bg-red-500" />
                <MetricCard title="Estimated Annual Savings" value={recommendations.data.summary.estimatedAnnualSavings} icon={<DollarSign className="w-6 h-6" />} colorClass="bg-green-500" />
                <MetricCard title="Implementation Time" value={recommendations.data.summary.implementationTimeline} icon={<Clock className="w-6 h-6" />} colorClass="bg-purple-500" />
              </div>
            )}

            {/* Detailed Recommendations */}
            {recommendationsData && (
              <div className="space-y-4">
                {recommendationsData.map((recommendation, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <span className={`px-2 py-1 rounded text-sm font-medium mr-3 ${recommendation.priority === "HIGH" ? "bg-red-100 text-red-800" : recommendation.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>{recommendation.priority} PRIORITY</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${recommendation.type === "OVERSTOCK_ALERT" ? "bg-orange-100 text-orange-800" : recommendation.type === "SUPPLIER_OPTIMIZATION" ? "bg-blue-100 text-blue-800" : recommendation.type === "SLOW_MOVING_INVENTORY" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>{recommendation.type.replace("_", " ")}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{recommendation.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{recommendation.description}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <strong>Action:</strong> {recommendation.action}
                        </p>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          {recommendation.estimatedTimeToResolve}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(recommendation.impact)}</p>
                        <p className="text-sm text-gray-500">Potential impact</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Urgency: {recommendation.urgency}</p>
                      {recommendation.items && Array.isArray(recommendation.items) && recommendation.items.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setDetailsModal({ type: recommendation.type, data: recommendation.items as unknown[] })}>
                          View Details ({recommendation.items.length} items)
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cost Control Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive cost analysis and optimization for restaurant operations</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedPeriod} onChange={e => setSelectedPeriod(Number(e.target.value))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={refetchAll} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs tabs={tabsData} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-6">{renderTabContent()}</div>

      {/* Details Modal */}
      {detailsModal && (
        <Modal isOpen={true} onClose={() => setDetailsModal(null)} title={`${detailsModal.type.replace("_", " ")} Details`} size="lg">
          <div className="max-h-96 overflow-y-auto">
            <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded">{JSON.stringify(detailsModal.data, null, 2)}</pre>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CostControlPage;
