import type { ColumnDef } from "@tanstack/react-table";
import { Activity, ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useStockMovements } from "../../hooks/useStock";
import { MovementType, type StockMovement } from "../../types";
import { getColorForType, getTypeColor } from "../../utils/getColorForType";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SummaryStatCards from "../ui/SummaryStatCards";
import Table from "../ui/Table";

const StockMovementsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<MovementType | "">("");
  const [activeStatFilter, setActiveStatFilter] = useState<MovementType | "ALL">("ALL");
  const { data: stockMovements = [], isLoading } = useStockMovements();
  const typeOptions = Object.values(MovementType).map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }));

  const filteredData = useMemo(() => {
    let filtered = stockMovements;
    // Apply stat filter
    if (activeStatFilter !== "ALL") {
      filtered = filtered.filter(movement => movement.type === activeStatFilter);
    }
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(movement => {
        const reason = movement.reason ? String(movement.reason).toLowerCase() : "";
        const performedBy = movement.performedBy ? String(movement.performedBy).toLowerCase() : "";
        return reason.includes(searchLower) || performedBy.includes(searchLower);
      });
    }
    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(movement => movement.type === typeFilter);
    }
    return filtered;
  }, [stockMovements, searchTerm, typeFilter, activeStatFilter]);

  const stats = useMemo(() => {
    return [
      {
        id: "ALL",
        icon: <Activity className="w-5 h-5" />,
        title: "All Movements",
        value: stockMovements.length,
        color: "gray"
      },
      ...Object.values(MovementType).map(type => {
        const count = stockMovements.filter(m => m.type === type).length;
        const totalQuantity = stockMovements.filter(m => m.type === type).reduce((sum, m) => sum + m.quantity, 0);

        return {
          id: type,
          icon: <Activity className="w-5 h-5" />,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
          value: `${count} (${totalQuantity})`,
          color: getColorForType(type)
        };
      })
    ];
  }, [stockMovements]);

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
      cell: info => `${info.row.original.quantity}`
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
      cell: info => info.row.original.reason
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
      cell: info => new Date(info.row.original.createdAt).toLocaleString()
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <SummaryStatCards stats={stats} activeId={activeStatFilter} onChange={setActiveStatFilter as (id: string) => void} />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input placeholder="Search movements..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />

        <Select placeholder="Filter by type" options={[{ value: "", label: "All Types" }, ...typeOptions]} value={typeFilter} onChange={value => setTypeFilter(value as MovementType | "")} />
      </div>

      {/* Table */}
      <Table data={filteredData} columns={columns} loading={isLoading} emptyMessage="No stock movements found." />
    </div>
  );
};

export default StockMovementsTab;
