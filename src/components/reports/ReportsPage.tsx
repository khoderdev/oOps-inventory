import { BarChart3, Calendar, Download, Filter, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useRawMaterials } from "../../hooks/useRawMaterials";
import { useSections } from "../../hooks/useSections";
import { useStockLevels } from "../../hooks/useStock";
import Button from "../ui/Button";
import Select from "../ui/Select";
import CategoryBreakdown from "./CategoryBreakdown";
import LowStockReport from "./LowStockReport";
import StockValueChart from "./StockValueChart";

type ReportType = "overview" | "stock-levels" | "consumption" | "expenses";

const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState<ReportType>("overview");
  const [dateRange, setDateRange] = useState("30");
  const [selectedSection, setSelectedSection] = useState("");

  const { data: stockLevels = [] } = useStockLevels();
  const { data: rawMaterials = [] } = useRawMaterials({ isActive: true });
  const { data: sections = [] } = useSections({ isActive: true });

  const reports = [
    { id: "overview" as ReportType, label: "Overview", icon: BarChart3 },
    { id: "stock-levels" as ReportType, label: "Stock Levels", icon: TrendingUp },
    { id: "consumption" as ReportType, label: "Consumption", icon: Calendar },
    { id: "expenses" as ReportType, label: "Expenses", icon: BarChart3 }
  ];

  const sectionOptions = sections.map(section => ({
    value: section.id,
    label: section.name
  }));

  const dateRangeOptions = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 3 months" },
    { value: "365", label: "Last year" }
  ];

  // Calculate key metrics
  const totalInventoryValue = stockLevels.reduce((sum, level) => sum + level.availableQuantity * (level.rawMaterial?.unitCost || 0), 0);

  const lowStockItems = stockLevels.filter(level => level.isLowStock);
  const categoryBreakdown = rawMaterials.reduce(
    (acc, material) => {
      const level = stockLevels.find(l => l.rawMaterialId === material.id);
      const value = level ? level.availableQuantity * material.unitCost : 0;

      acc[material.category] = (acc[material.category] || 0) + value;
      return acc;
    },
    {} as Record<string, number>
  );

  const renderReportContent = () => {
    switch (activeReport) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Total Inventory Value</p>
                    <p className="text-2xl font-bold text-blue-900">${totalInventoryValue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Active Materials</p>
                    <p className="text-2xl font-bold text-green-900">{rawMaterials.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-red-600">Low Stock Alerts</p>
                    <p className="text-2xl font-bold text-red-900">{lowStockItems.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">Active Sections</p>
                    <p className="text-2xl font-bold text-purple-900">{sections.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StockValueChart data={categoryBreakdown} />
              <CategoryBreakdown data={categoryBreakdown} />
            </div>
          </div>
        );

      case "stock-levels":
        return <LowStockReport stockLevels={stockLevels} />;

      case "consumption":
        return (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Consumption Reports</h3>
            <p className="text-gray-600">Detailed consumption analytics will be available here</p>
          </div>
        );

      case "expenses":
        return (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Expense Reports</h3>
            <p className="text-gray-600">Cost analysis and expense tracking will be available here</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Insights into your inventory performance</p>
        </div>
        <Button leftIcon={<Download className="w-4 h-4" />} variant="outline">
          Export Reports
        </Button>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {reports.map(report => {
              const IconComponent = report.icon;
              return (
                <button key={report.id} onClick={() => setActiveReport(report.id)} className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeReport === report.id ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                  <IconComponent className="w-4 h-4" />
                  <span>{report.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select placeholder="Date range" options={dateRangeOptions} value={dateRange} onChange={e => setDateRange(e.target.value)} />

            <Select placeholder="All sections" options={[{ value: "", label: "All Sections" }, ...sectionOptions]} value={selectedSection} onChange={e => setSelectedSection(e.target.value)} />

            <div></div>

            <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
              Advanced Filters
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6">{renderReportContent()}</div>
      </div>
    </div>
  );
};

export default ReportsPage;
