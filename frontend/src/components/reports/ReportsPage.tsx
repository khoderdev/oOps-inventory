import { BarChart3, Calendar, DollarSign, Download, Filter, Package, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useRawMaterials } from "../../hooks/useRawMaterials";
import { useSections } from "../../hooks/useSections";
import { useStockEntries, useStockLevels, useStockMovements } from "../../hooks/useStock";
import { MovementType } from "../../types";
import Button from "../ui/Button";
import Select from "../ui/Select";
import CategoryBreakdown from "./CategoryBreakdown";
import ConsumptionReport from "./ConsumptionReport";
import ExpenseReport from "./ExpenseReport";
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
  const { data: stockEntries = [] } = useStockEntries();
  const { data: stockMovements = [] } = useStockMovements();

  const reports = [
    { id: "overview" as ReportType, label: "Overview", icon: BarChart3 },
    { id: "stock-levels" as ReportType, label: "Stock Levels", icon: TrendingUp },
    { id: "consumption" as ReportType, label: "Consumption", icon: Calendar },
    { id: "expenses" as ReportType, label: "Expenses", icon: DollarSign }
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

  // Date filtering helper
  const getDateFilter = () => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return cutoffDate;
  };

  // Filtered data based on date range
  const filteredStockEntries = useMemo(() => {
    const cutoffDate = getDateFilter();
    return stockEntries.filter(entry => new Date(entry.receivedDate) >= cutoffDate);
  }, [stockEntries, dateRange]);

  const filteredStockMovements = useMemo(() => {
    const cutoffDate = getDateFilter();
    const filtered = stockMovements.filter(movement => new Date(movement.createdAt) >= cutoffDate);
    return filtered;
  }, [stockMovements, dateRange]);

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const totalInventoryValue = stockLevels.reduce((sum, level) => sum + level.availableUnitsQuantity * (level.rawMaterial?.unitCost || 0), 0);

    const lowStockItems = stockLevels.filter(level => level.isLowStock);

    const totalPurchaseValue = filteredStockEntries.reduce((sum, entry) => sum + entry.totalCost, 0);

    const consumptionMovements = filteredStockMovements.filter(movement => movement.type === MovementType.OUT || movement.type === MovementType.EXPIRED || movement.type === MovementType.DAMAGED);

    const totalConsumptionValue = consumptionMovements.reduce((sum, movement) => {
      const material = rawMaterials.find(m => {
        const entry = stockEntries.find(e => e.id === movement.stockEntryId);
        return entry?.rawMaterialId === m.id;
      });
      return sum + movement.quantity * (material?.unitCost || 0);
    }, 0);

    const wasteValue = filteredStockMovements
      .filter(movement => movement.type === MovementType.EXPIRED || movement.type === MovementType.DAMAGED)
      .reduce((sum, movement) => {
        const material = rawMaterials.find(m => {
          const entry = stockEntries.find(e => e.id === movement.stockEntryId);
          return entry?.rawMaterialId === m.id;
        });
        return sum + movement.quantity * (material?.unitCost || 0);
      }, 0);

    return {
      totalInventoryValue,
      lowStockCount: lowStockItems.length,
      totalPurchaseValue,
      totalConsumptionValue,
      wasteValue,
      totalMovements: filteredStockMovements.length,
      totalEntries: filteredStockEntries.length
    };
  }, [stockLevels, filteredStockEntries, filteredStockMovements, rawMaterials, stockEntries]);

  // Category breakdown with real values
  const categoryBreakdown = useMemo(() => {
    return rawMaterials.reduce(
      (acc, material) => {
        const level = stockLevels.find(l => l.rawMaterial?.id === material.id);
        const value = level ? level.availableUnitsQuantity * material.unitCost : 0;
        acc[material.category] = (acc[material.category] || 0) + value;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [rawMaterials, stockLevels]);

  // Consumption by category
  const consumptionByCategory = useMemo(() => {
    return filteredStockMovements
      .filter(movement => movement.type === MovementType.OUT)
      .reduce(
        (acc, movement) => {
          const entry = stockEntries.find(e => e.id === movement.stockEntryId);
          const material = rawMaterials.find(m => m.id === entry?.rawMaterialId);
          if (material) {
            const value = movement.quantity * material.unitCost;
            acc[material.category] = (acc[material.category] || 0) + value;
          }
          return acc;
        },
        {} as Record<string, number>
      );
  }, [filteredStockMovements, stockEntries, rawMaterials]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const purchasesByCategory = filteredStockEntries.reduce(
      (acc, entry) => {
        const material = rawMaterials.find(m => m.id === entry.rawMaterialId);
        if (material) {
          acc[material.category] = (acc[material.category] || 0) + entry.totalCost;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const totalPurchases = Object.values(purchasesByCategory).reduce((sum, val) => sum + val, 0);

    return {
      purchases: purchasesByCategory,
      totalPurchases,
      averageOrderValue: filteredStockEntries.length > 0 ? totalPurchases / filteredStockEntries.length : 0,
      topSuppliers: [...new Set(filteredStockEntries.map(e => e.supplier).filter(Boolean))]
        .map(supplier => ({
          name: supplier!,
          total: filteredStockEntries.filter(e => e.supplier === supplier).reduce((sum, e) => sum + e.totalCost, 0)
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
    };
  }, [filteredStockEntries, rawMaterials]);

  const renderReportContent = () => {
    switch (activeReport) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Enhanced Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg">
                <div className="flex items-center">
                  <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Total Inventory Value</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">${metrics.totalInventoryValue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Purchase Value ({dateRange} days)</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">${metrics.totalPurchaseValue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-red-600 dark:text-red-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-red-600">Low Stock Alerts</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-300">{metrics.lowStockCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">Consumption Value</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">${metrics.totalConsumptionValue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Materials</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-300">{rawMaterials.length}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sections</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-300">{sections.length}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Waste Value</p>
                <p className="text-xl font-bold text-yellow-900 dark:text-yellow-300">${metrics.wasteValue.toFixed(2)}</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Stock Entries</p>
                <p className="text-xl font-bold text-indigo-900 dark:text-indigo-300">{metrics.totalEntries}</p>
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
        return <ConsumptionReport movements={filteredStockMovements} stockEntries={stockEntries} rawMaterials={rawMaterials} selectedSection={selectedSection} consumptionByCategory={consumptionByCategory} />;

      case "expenses":
        return <ExpenseReport stockEntries={filteredStockEntries} rawMaterials={rawMaterials} expenseBreakdown={expenseBreakdown} dateRange={parseInt(dateRange)} />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive insights into your inventory performance</p>
        </div>
        <Button leftIcon={<Download className="w-4 h-4" />} variant="outline">
          Export Reports
        </Button>
      </div>

      {/* Report Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {reports.map(report => {
              const IconComponent = report.icon;
              return (
                <button key={report.id} onClick={() => setActiveReport(report.id)} className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeReport === report.id ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600"}`}>
                  <IconComponent className="w-4 h-4" />
                  <span>{report.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
