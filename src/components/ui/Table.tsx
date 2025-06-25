import { clsx } from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type ReactNode } from "react";
import type { SortConfig } from "../../types";

interface Column<T> {
  key: string;
  title: string;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  sortConfig?: SortConfig;
  onSort?: (field: string) => void;
  className?: string;
}

function Table<T extends Record<string, unknown>>({ data, columns, loading = false, emptyMessage = "No data available", sortConfig, onSort, className }: TableProps<T>) {
  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  const getSortIcon = (field: string) => {
    if (!sortConfig || sortConfig.field !== field) {
      return null;
    }
    return sortConfig.order === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className={clsx("overflow-x-auto", className)}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map(column => (
              <th key={column.key} className={clsx("px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", column.align === "center" && "text-center", column.align === "right" && "text-right", column.sortable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700")} style={{ width: column.width }} onClick={column.sortable ? () => handleSort(column.key) : undefined}>
                <div className="flex items-center space-x-1">
                  <span>{column.title}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={String(item.id) || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {columns.map(column => (
                  <td key={column.key} className={clsx("px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100", column.align === "center" && "text-center", column.align === "right" && "text-right")}>
                    {column.render ? column.render(item, index) : item[column.key]?.toString() || "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
