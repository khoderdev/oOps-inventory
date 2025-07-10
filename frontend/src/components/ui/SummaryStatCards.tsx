import React from "react";

type StatCard<T extends string> = {
  id: T;
  icon: React.ReactNode;
  title: string;
  value: number | string;
  color: string;
};

type Props<T extends string> = {
  stats: ReadonlyArray<StatCard<T>>;
  activeId: T;
  onChange: (id: T) => void;
};

function SummaryStatCards<T extends string>({ stats, activeId, onChange }: Props<T>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map(stat => {
        const isActive = activeId === stat.id;
        return (
          <div key={stat.id} onClick={() => onChange(stat.id)} className={`cursor-pointer transition-all p-4 rounded-lg ${isActive ? `ring-2 ring-${stat.color}-500 bg-${stat.color}-100 dark:ring-${stat.color}-400 dark:bg-${stat.color}-900/20 scale-105` : `bg-${stat.color}-50 dark:bg-${stat.color}-900/10`}`}>
            <div className="flex items-center">
              <div className={`w-8 h-8 text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.icon}</div>
              <div className="ml-3">
                <p className={`text-sm font-medium text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.title}</p>
                <p className={`text-2xl font-bold text-${stat.color}-900 dark:text-${stat.color}-300`}>{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SummaryStatCards;
