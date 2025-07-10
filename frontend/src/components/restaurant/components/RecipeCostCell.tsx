// import { useEffect, useState } from "react";
// import { useRecipeCost } from "../../../hooks/useRecipes";

// interface RecipeCostCellProps {
//   recipeId: number;
// }

// export const RecipeCostCell: React.FC<RecipeCostCellProps> = ({ recipeId }) => {
//   const { data: costData } = useRecipeCost(recipeId);
//   const [cost, setCost] = useState<number | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     let isMounted = true;

//     const fetchCost = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         const result = costData?.cost;
//         if (isMounted) {
//           setCost(result?.totalCost);
//         }
//       } catch (err) {
//         if (isMounted) {
//           setError("Failed to load");
//         }
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//         }
//       }
//     };

//     fetchCost();

//     return () => {
//       isMounted = false;
//     };
//   }, [recipeId, costData]);

//   if (loading) return <span className="text-sm text-gray-400">Loading...</span>;
//   if (error) return <span className="text-sm text-red-500">{error}</span>;

//   return <span className="text-sm text-gray-800 dark:text-gray-200">${cost?.toFixed(2)}</span>;
// };
import { useEffect, useState } from "react";
import { useRecipeCost } from "../../../hooks/useRecipes";

interface RecipeCostCellProps {
  recipeId: number;
}

export const RecipeCostCell: React.FC<RecipeCostCellProps> = ({ recipeId }) => {
  const { data: costData, isLoading, error } = useRecipeCost(recipeId);
  const [cost, setCost] = useState<number | null>(null);

  useEffect(() => {
    if (costData) {
      setCost(costData.totalCost);
    } else {
      setCost(null);
    }
  }, [costData]);

  if (isLoading) return <span className="text-sm text-gray-400">Loading...</span>;
  if (error) return <span className="text-sm text-red-500">Failed to load</span>;

  return <span className="text-sm text-gray-800 dark:text-gray-200">${cost?.toFixed(2)}</span>;
};
