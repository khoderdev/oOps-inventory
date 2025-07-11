import { format } from "date-fns";
import { FileText, Package, Truck, User, Warehouse } from "lucide-react";
import type { StockMovement } from "../../types/stock.types";
import { Modal } from "../ui";
import { Accordion } from "../ui/Accordion";

interface MovementDetailsProps {
  movement: StockMovement | null;
  onClose: () => void;
}

export const MovementDetails = ({ movement, onClose }: MovementDetailsProps) => {
  if (!movement) return null;

  const sections = [
    {
      key: "movement",
      title: "Movement Details",
      icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ID</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">{movement.id || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{movement.type?.toLowerCase() || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.createdAt ? format(new Date(movement.createdAt), "dd-MM-yyyy") : "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated At</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.updatedAt ? format(new Date(movement.updatedAt), "dd-MM-yyyy") : "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quantity</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.quantity ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reason</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{movement.reason || "Unknown"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reference ID</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">{movement.referenceId || "-"}</p>
          </div>
        </div>
      ),
      defaultOpen: true
    },
    {
      key: "material",
      title: "Material Details",
      icon: <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.material?.name || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{movement.material?.category?.toLowerCase() || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unit</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.material?.unit || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unit Cost</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.material?.unitCost ? `$${movement.material.unitCost.toFixed(3)}` : "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 truncate" title={movement.material?.supplier}>
              {movement.material?.supplier || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Min Stock Level</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.material?.minStockLevel ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Stock Level</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.material?.maxStockLevel ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.material?.createdAt ? format(new Date(movement.material.createdAt), "dd-MM-yyyy") : "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated At</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.material?.updatedAt ? format(new Date(movement.material.updatedAt), "dd-MM-yyyy") : "-"}</p>
          </div>
        </div>
      ),
      defaultOpen: true
    },
    {
      key: "stockEntry",
      title: "Stock Entry Details",
      icon: <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ID</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">{movement.stockEntry?.id || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Batch Number</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.stockEntry?.batchNumber || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quantity</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.stockEntry?.quantity ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unit Cost</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.stockEntry?.unitCost ? `$${movement.stockEntry.unitCost.toFixed(2)}` : "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.stockEntry?.totalCost ? `$${movement.stockEntry.totalCost.toFixed(2)}` : "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 truncate" title={movement.stockEntry?.supplier}>
              {movement.stockEntry?.supplier || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Received Date</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.stockEntry?.receivedDate ? format(new Date(movement.stockEntry.receivedDate), "dd-MM-yyyy") : "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.stockEntry?.notes || "-"}</p>
          </div>
        </div>
      ),
      defaultOpen: true
    },
    {
      key: "fromSection",
      title: "From Section Details",
      icon: <Warehouse className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.fromSection?.name || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{movement.fromSection?.type?.toLowerCase() || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Manager ID</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.fromSection?.managerId ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.fromSection?.createdAt ? format(new Date(movement.fromSection.createdAt), "dd-MM-yyyy") : "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated At</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.fromSection?.updatedAt ? format(new Date(movement.fromSection.updatedAt), "dd-MM-yyyy") : "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.fromSection?.description || "-"}</p>
          </div>
        </div>
      ),
      defaultOpen: true
    },
    {
      key: "user",
      title: "Performed By",
      icon: <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{movement.user?.firstName + " " + movement.user?.lastName || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{movement.user?.role?.toLowerCase() || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 truncate" title={movement.user?.email}>
              {movement.user?.email || "-"}
            </p>
          </div>
        </div>
      ),
      defaultOpen: true
    }
  ];

  return (
    <Modal isOpen={!!movement} onClose={onClose} title="Movement Details" size="lg">
      <Accordion sections={sections} />
    </Modal>
  );
};
