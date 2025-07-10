// import { AlertTriangle, Package } from "lucide-react";

// type StatsCardProps = {
//   title: string;
//   value: number | string;
//   icon: React.ReactNode;
//   color: "blue" | "green" | "red" | "purple";
// };

// const StatsCard = ({ title, value, icon, color }: StatsCardProps) => {
//   const colorClasses = {
//     blue: {
//       bg: "bg-blue-50 dark:bg-blue-900/10",
//       text: "text-blue-600 dark:text-blue-400",
//       textDark: "text-blue-900 dark:text-blue-400"
//     },
//     green: {
//       bg: "bg-green-50 dark:bg-green-900/10",
//       text: "text-green-600 dark:text-green-400",
//       textDark: "text-green-900 dark:text-green-400"
//     },
//     red: {
//       bg: "bg-red-50 dark:bg-red-900/10",
//       text: "text-red-600 dark:text-red-400",
//       textDark: "text-red-900 dark:text-red-400"
//     },
//     purple: {
//       bg: "bg-purple-50 dark:bg-purple-900/10",
//       text: "text-purple-600 dark:text-purple-400",
//       textDark: "text-purple-900 dark:text-purple-400"
//     }
//   };

//   return (
//     <div className={`p-6 rounded-lg dark:text-white ${colorClasses[color].bg}`}>
//       <div className="flex items-center">
//         <div className={`w-8 h-8 ${colorClasses[color].text}`}>{icon}</div>
//         <div className="ml-4">
//           <p className={`text-sm font-medium ${colorClasses[color].text}`}>{title}</p>
//           <p className={`text-2xl font-bold ${colorClasses[color].textDark}`}>{value}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// type RawMaterialsStatsProps = {
//   totalMaterials: number;
//   activeCount: number;
//   lowStockCount: number;
//   categoryCount: number;
// };

// export const RawMaterialsStats = ({ totalMaterials, activeCount, lowStockCount, categoryCount }: RawMaterialsStatsProps) => {
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//       <StatsCard title="Total Materials" value={totalMaterials} icon={<Package className="w-8 h-8" />} color="blue" />
//       <StatsCard title="Active Materials" value={activeCount} icon={<Package className="w-8 h-8" />} color="green" />
//       <StatsCard title="Low Stock" value={lowStockCount} icon={<AlertTriangle className="w-8 h-8" />} color="red" />
//       <StatsCard title="Categories" value={categoryCount} icon={<Package className="w-8 h-8" />} color="purple" />
//     </div>
//   );
// };
import { AlertTriangle, Package } from "lucide-react";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "green" | "red" | "purple";
};

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/10 dark:text-green-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/10 dark:text-purple-400"
  };

  const textClasses = {
    blue: "text-blue-900 dark:text-blue-300",
    green: "text-green-900 dark:text-green-300",
    red: "text-red-900 dark:text-red-300",
    purple: "text-purple-900 dark:text-purple-300"
  };

  return (
    <div className={`p-6 rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center">
        <div className="w-8 h-8">{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${textClasses[color]}`}>{value}</p>
        </div>
      </div>
    </div>
  );
};

type RawMaterialsStatsProps = {
  total: number;
  active: number;
  lowStock: number;
  categories: number;
};

export const RawMaterialsStats = ({ total, active, lowStock, categories }: RawMaterialsStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard title="Total Materials" value={total} icon={<Package className="w-8 h-8" />} color="blue" />
      <StatCard title="Active" value={active} icon={<Package className="w-8 h-8" />} color="green" />
      <StatCard title="Low Stock" value={lowStock} icon={<AlertTriangle className="w-8 h-8" />} color="red" />
      <StatCard title="Categories" value={categories} icon={<Package className="w-8 h-8" />} color="purple" />
    </div>
  );
};
