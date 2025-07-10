import type { MenuCategory } from "../../../types";
import { MenuCategoryLabels } from "../../../types";

interface CategoryBadgeProps {
  category: MenuCategory;
}

export const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const label = MenuCategoryLabels[category] || category;
  const colors = {
    APPETIZER: "bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-100",
    MAIN_COURSE: "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100",
    DESSERT: "bg-pink-100 text-pink-800 dark:bg-pink-700 dark:text-pink-100",
    BEVERAGE: "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100",
    SIDE_DISH: "bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100",
    SAUCE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100",
    SALAD: "bg-lime-100 text-lime-800 dark:bg-lime-700 dark:text-lime-100",
    SOUP: "bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-100",
    SPECIAL: "bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100",
    BREAKFAST: "bg-rose-100 text-rose-800 dark:bg-rose-700 dark:text-rose-100",
    LUNCH: "bg-teal-100 text-teal-800 dark:bg-teal-700 dark:text-teal-100",
    DINNER: "bg-sky-100 text-sky-800 dark:bg-sky-700 dark:text-sky-100"
  };

  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[category] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"}`}>{label}</span>;
};
