import type { ColumnDef } from "@tanstack/react-table";
import { Activity, ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useStockMovements } from "../../hooks/useStock";
import { MovementType, type SortConfig, type StockMovement } from "../../types";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Table from "../ui/Table";

const StockMovementsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<MovementType | "">("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "createdAt", order: "desc" });

  const { data: stockMovements = [], isLoading } = useStockMovements();

  const typeOptions = Object.values(MovementType).map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1)
  }));

  const filteredData = useMemo(() => {
    const filtered = stockMovements.filter(movement => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const reason = movement.reason ? String(movement.reason).toLowerCase() : "";
        const performedBy = movement.performedBy ? String(movement.performedBy).toLowerCase() : "";

        if (!reason.includes(searchLower) && !performedBy.includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (typeFilter && movement.type !== typeFilter) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[sortConfig.field];
      const bValue = (b as unknown as Record<string, unknown>)[sortConfig.field];

      if (aValue && bValue && typeof aValue === "number" && typeof bValue === "number" && aValue < bValue) return sortConfig.order === "asc" ? -1 : 1;
      if (aValue && bValue && typeof aValue === "number" && typeof bValue === "number" && aValue > bValue) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stockMovements, searchTerm, typeFilter, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  const getTypeColor = (type: MovementType) => {
    switch (type) {
      case MovementType.IN:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case MovementType.OUT:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case MovementType.TRANSFER:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case MovementType.ADJUSTMENT:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case MovementType.EXPIRED:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      case MovementType.DAMAGED:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getTypeTextColor = (type: MovementType) => {
    switch (type) {
      case MovementType.IN:
        return "text-green-600 dark:text-green-400";
      case MovementType.OUT:
        return "text-red-600 dark:text-red-400";
      case MovementType.TRANSFER:
        return "text-blue-600 dark:text-blue-400";
      case MovementType.ADJUSTMENT:
        return "text-yellow-600 dark:text-yellow-400";
      case MovementType.EXPIRED:
        return "text-gray-600 dark:text-gray-400";
      case MovementType.DAMAGED:
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const columns: ColumnDef<StockMovement>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: info => {
        const item = info.row.original;
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>;
      }
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: info => {
        const item = info.row.original;
        return `${item.quantity}`;
      }
    },
    {
      accessorKey: "direction",
      header: "Direction",
      cell: info => {
        const item = info.row.original;
        if (item.type === MovementType.TRANSFER) {
          return (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{item.fromSectionId || "Stock"}</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{item.toSectionId || "Stock"}</span>
            </div>
          );
        }
        return item.type === MovementType.IN ? "Incoming" : "Outgoing";
      }
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: info => {
        const item = info.row.original;
        return item.reason;
      }
    },
    {
      accessorKey: "performedBy",
      header: "Performed By",
      cell: info => {
        const item = info.row.original;
        if (item.user) {
          const fullName = `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim();
          return fullName || item.user.username || item.user.email || `User #${item.performedBy}`;
        }
        return `User #${item.performedBy}`;
      }
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: info => {
        const item = info.row.original;
        return new Date(item.createdAt).toLocaleString();
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.values(MovementType).map(type => {
          const count = stockMovements.filter(m => m.type === type).length;
          const totalQuantity = stockMovements.filter(m => m.type === type).reduce((sum, m) => sum + m.quantity, 0);

          return (
            <div key={type} className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Activity className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <div className="ml-3">
                  <p className={`text-sm font-medium ${getTypeTextColor(type)}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total: {totalQuantity}</p>
                </div>
              </div>{" "}
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input placeholder="Search movements..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />

        <Select placeholder="Filter by type" options={[{ value: "", label: "All Types" }, ...typeOptions]} value={typeFilter} onChange={value => setTypeFilter(value as MovementType | "")} />

        <div></div>
      </div>

      {/* Table */}
      <Table data={filteredData} columns={columns} loading={isLoading} emptyMessage="No stock movements found." sortConfig={sortConfig} onSort={handleSort} />

      {/* <Table data={filteredData as unknown as Record<string, unknown>[]} columns={columns} loading={isLoading} emptyMessage="No stock movements found." sortConfig={sortConfig} onSort={handleSort} /> */}
    </div>
  );
};

export default StockMovementsTab;
