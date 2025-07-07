import { Building2, Edit, Eye, Package, Users } from "lucide-react";
import { useSectionInventory } from "../../hooks/useSections";
import type { Section } from "../../types";
import { MeasurementUnit } from "../../types";
import Button from "../ui/Button";

interface SectionCardProps {
  section: Section;
  onView: () => void;
  onEdit: () => void;
}

const SectionCard = ({ section, onView, onEdit }: SectionCardProps) => {
  const { data: inventory = [] } = useSectionInventory(section.id);

  const getManagerName = (section: Section) => {
    if (section.manager) {
      if (section.manager.firstName && section.manager.lastName) {
        return `${section.manager.firstName} ${section.manager.lastName}`;
      }
      if (section.manager.name) {
        return section.manager.name;
      }
      return section.manager.email;
    }
    return `Manager ${section.managerId}`;
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case "kitchen":
        return "🍳";
      case "bar":
        return "🍺";
      case "storage":
        return "📦";
      case "preparation":
        return "🔪";
      default:
        return "🏢";
    }
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case "kitchen":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "bar":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "storage":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "preparation":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const totalItems = inventory.length;

  // Calculate total quantity with proper pack/box handling
  const totalQuantity = inventory.reduce((sum, item) => {
    const material = item.rawMaterial;
    if (material && (material.unit === MeasurementUnit.PACKS || material.unit === MeasurementUnit.BOXES)) {
      // For pack materials, show pack quantity (convert from base units)
      const packInfo = material as unknown as { unitsPerPack?: number };
      const unitsPerPack = packInfo.unitsPerPack || 1;
      const packQuantity = item.quantity / unitsPerPack;
      return sum + packQuantity;
    } else {
      // For regular materials, use quantity directly
      return sum + item.quantity;
    }
  }, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getSectionIcon(section.type)}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.name}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSectionColor(section.type)}`}>{section.type.charAt(0).toUpperCase() + section.type.slice(1)}</span>
            </div>
          </div>
          <Building2 className="w-5 h-5 text-gray-400" />
        </div>

        {/* Description */}
        {section.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{section.description}</p>}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Items</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Qty</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalQuantity.toFixed(0)}</p>
          </div>
        </div>

        {/* Manager Info */}
        <div className="flex items-center space-x-2 mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manager</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{getManagerName(section)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onView} leftIcon={<Eye className="w-4 h-4" />} className="flex-1">
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit} leftIcon={<Edit className="w-4 h-4" />} className="flex-1">
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SectionCard;
