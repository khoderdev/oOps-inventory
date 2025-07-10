import { AlertTriangle, Package } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "green" | "red" | "purple";
};

const StatsCard = ({ title, value, icon, color }: StatsCardProps) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/10",
      text: "text-blue-600 dark:text-blue-400",
      textDark: "text-blue-900 dark:text-blue-400"
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/10",
      text: "text-green-600 dark:text-green-400",
      textDark: "text-green-900 dark:text-green-400"
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/10",
      text: "text-red-600 dark:text-red-400",
      textDark: "text-red-900 dark:text-red-400"
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/10",
      text: "text-purple-600 dark:text-purple-400",
      textDark: "text-purple-900 dark:text-purple-400"
    }
  };

  return (
    <div className={`p-6 rounded-lg dark:text-white ${colorClasses[color].bg}`}>
      <div className="flex items-center">
        <div className={`w-8 h-8 ${colorClasses[color].text}`}>{icon}</div>
        <div className="ml-4">
          <p className={`text-sm font-medium ${colorClasses[color].text}`}>{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color].textDark}`}>{value}</p>
        </div>
      </div>
    </div>
  );
};

type RawMaterialsStatsProps = {
  totalMaterials: number;
  activeCount: number;
  lowStockCount: number;
  categoryCount: number;
};

export const RawMaterialsStats = ({ totalMaterials, activeCount, lowStockCount, categoryCount }: RawMaterialsStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatsCard title="Total Materials" value={totalMaterials} icon={<Package className="w-8 h-8" />} color="blue" />
      <StatsCard title="Active Materials" value={activeCount} icon={<Package className="w-8 h-8" />} color="green" />
      <StatsCard title="Low Stock" value={lowStockCount} icon={<AlertTriangle className="w-8 h-8" />} color="red" />
      <StatsCard title="Categories" value={categoryCount} icon={<Package className="w-8 h-8" />} color="purple" />
    </div>
  );
};
