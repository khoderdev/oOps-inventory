import type { ColumnDef } from "@tanstack/react-table";
import { clsx } from "clsx";
import { AlertTriangle, Edit, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { categoriesApi } from "../../data/categories.api";
import { useStockLevels } from "../../hooks/useStock";
import { useSuppliers } from "../../hooks/useSuppliers";
import type { CategoryResponse, RawMaterial } from "../../types";
import Button from "../ui/Button";
import Table from "../ui/Table";

type RawMaterialsTableProps = {
  data: RawMaterial[];
  loading: boolean;
  userRole?: string;
  onEdit: (material: RawMaterial) => void;
  onDelete: (material: RawMaterial) => void;
};

export const RawMaterialsTable = ({ data, loading, userRole, onEdit, onDelete }: RawMaterialsTableProps) => {
  const { data: stockLevels = [] } = useStockLevels();
  const { data: suppliersData } = useSuppliers();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getCategories();
        setCategories(data as CategoryResponse[]);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  const getStockStatus = useCallback(
    (materialId: string) => {
      const stockLevel = stockLevels.find(level => level.rawMaterial?.id === parseInt(materialId));
      if (!stockLevel) return { status: "no-stock", quantity: 0, unit: "" };

      return {
        status: stockLevel.isLowStock ? "low" : "normal",
        quantity: stockLevel.availableUnitsQuantity,
        unit: stockLevel.rawMaterial?.unit || "",
        isLowStock: stockLevel.isLowStock
      };
    },
    [stockLevels]
  );

  const getSupplierName = useCallback(
    (supplierId: string | null) => {
      if (!supplierId || !suppliersData?.suppliers) return "";

      const supplier = suppliersData.suppliers.find(s => s.id.toString() === supplierId.toString());
      return supplier ? supplier.name : "";
    },
    [suppliersData]
  );

  const columns: ColumnDef<RawMaterial>[] = useMemo(() => {
    const baseColumns: ColumnDef<RawMaterial>[] = [
      {
        id: "name",
        accessorKey: "name",
        header: "Material",
        size: 250,
        minSize: 200,
        maxSize: 400,
        enableSorting: true,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate" title={item.name}>
                {item.name}
              </p>
              {item.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={item.description}>
                  {item.description}
                </p>
              )}
            </div>
          );
        }
      },
      {
        id: "category",
        accessorKey: "category",
        header: "Category",
        size: 140,
        minSize: 120,
        maxSize: 180,
        enableSorting: true,
        cell: ({ row }) => {
          const categoryId = row.original.category.id;
          const category = categories.find(cat => cat.id === categoryId);
          const label = category?.name.replace("_", " ").toLowerCase() || "Uncategorized";

          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 capitalize whitespace-nowrap">{label}</span>;
        },
        meta: {
          align: "center"
        }
      },
      {
        id: "unit",
        accessorKey: "unit",
        header: "Unit",
        size: 80,
        minSize: 60,
        maxSize: 120,
        enableSorting: true,
        cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span>,
        meta: {
          align: "center"
        }
      },
      {
        id: "unitCost",
        accessorKey: "unitCost",
        header: "Unit Cost",
        size: 110,
        minSize: 90,
        maxSize: 140,
        enableSorting: true,
        cell: ({ row }) => {
          const material = row.original;
          const unit = material.unit;
          const cost = material.unitCost;
          const smallUnits = ["GRAMS", "PIECES", "BOTTLES"];
          const isSmallUnit = smallUnits.includes(unit);
          const formatted = isSmallUnit
            ? `$${Math.ceil(cost * 10000) / 10000}` // Rounded up to 4 digits
            : `$${cost.toFixed(2)}`;

          return <span className="font-mono text-sm font-medium text-green-600 dark:text-green-400">{formatted}</span>;
        },
        meta: {
          align: "right"
        }
      },
      {
        id: "supplier",
        accessorKey: "supplier",
        header: "Supplier",
        size: 150,
        minSize: 120,
        maxSize: 200,
        enableSorting: true,
        cell: ({ row }) => {
          const supplierId = row.original.supplier;
          const supplierName = getSupplierName(supplierId?.toString() || null);
          return (
            <span className="truncate" title={supplierName || "No supplier"}>
              {supplierName || "-"}
            </span>
          );
        }
      },
      {
        id: "stock",
        accessorKey: "stock",
        header: "Current Stock",
        size: 140,
        minSize: 120,
        maxSize: 180,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const stock = getStockStatus(item.id.toString());
          return (
            <div className="flex items-center justify-center space-x-2">
              <span
                className={clsx("font-medium text-sm", {
                  "text-red-600 dark:text-red-400": stock.status === "low",
                  "text-gray-400 dark:text-gray-500": stock.status === "no-stock",
                  "text-green-600 dark:text-green-400": stock.status === "normal"
                })}
              >
                {stock.quantity} {stock.unit}
              </span>
              {stock.isLowStock && (
                <div title="Low stock warning">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                </div>
              )}
            </div>
          );
        },
        meta: {
          align: "center"
        }
      },
      {
        id: "isActive",
        accessorKey: "isActive",
        header: "Status",
        size: 90,
        minSize: 80,
        maxSize: 120,
        enableSorting: true,
        cell: ({ row }) => {
          const item = row.original;
          return <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", item.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400")}>{item.isActive ? "Active" : "Inactive"}</span>;
        },
        meta: {
          align: "center"
        }
      }
    ];

    const actionColumn: ColumnDef<RawMaterial> = {
      id: "actions",
      header: "Actions",
      size: 140,
      minSize: 120,
      maxSize: 180,
      enableSorting: false,
      enableResizing: true,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-end space-x-1">
            <Button size="sm" variant="ghost" onClick={() => onEdit(item)} leftIcon={<Edit className="w-3 h-3" />} className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors">
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(item)} leftIcon={<Trash2 className="w-3 h-3" />} className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-colors">
              Delete
            </Button>
          </div>
        );
      },
      meta: {
        align: "right"
      }
    };

    return userRole === "MANAGER" || userRole === "ADMIN" ? [...baseColumns, actionColumn] : baseColumns;
  }, [userRole, getStockStatus, getSupplierName, onEdit, onDelete]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <Table data={data} columns={columns} loading={loading} emptyMessage="No raw materials found. Add your first material to get started." enableColumnResizing={true} enableSorting={true} maxHeight="600px" stickyHeader={true} className="rounded-lg" />
    </div>
  );
};
