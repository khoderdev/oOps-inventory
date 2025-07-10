import { MovementType } from "../types";

export const getTypeColor = (type: MovementType) => {
  switch (type) {
    case MovementType.IN:
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 ring-green-500 dark:ring-green-400";
    case MovementType.OUT:
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 ring-red-500 dark:ring-red-400";
    case MovementType.TRANSFER:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 ring-blue-500 dark:ring-blue-400";
    case MovementType.ADJUSTMENT:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 ring-yellow-500 dark:ring-yellow-400";
    case MovementType.EXPIRED:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 ring-gray-500 dark:ring-gray-400";
    case MovementType.DAMAGED:
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 ring-red-500 dark:ring-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 ring-gray-500 dark:ring-gray-400";
  }
};

// Helper function to get color for stat cards based on movement type
export function getColorForType(type: MovementType): string {
  switch (type) {
    case MovementType.IN:
      return "green";
    case MovementType.OUT:
      return "red";
    case MovementType.TRANSFER:
      return "blue";
    case MovementType.ADJUSTMENT:
      return "yellow";
    case MovementType.EXPIRED:
      return "gray";
    case MovementType.DAMAGED:
      return "red";
    default:
      return "gray";
  }
}
