// // RecipeCostBreakdownModal.tsx

// import React from "react";
// import type { Recipe } from "../../../types";
// import { formatCurrency } from "../../../utils/quantity";
// import { Modal } from "../../ui";

// interface Props {
//   recipe: Recipe;
//   isOpen: boolean;
//   onClose: () => void;
// }

// export const RecipeCostBreakdownModal: React.FC<Props> = ({ recipe, isOpen, onClose }) => {
//   const costAnalysis = recipe.costAnalysis?.breakdown;

//   if (!costAnalysis) {
//     return (
//       <Modal isOpen={isOpen} onClose={onClose} title={`Cost Breakdown - ${recipe.name}`} size="lg">
//         <div className="p-6 text-center text-gray-500 dark:text-gray-300">No cost data available for this recipe.</div>
//       </Modal>
//     );
//   }

//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title={`Cost Breakdown - ${recipe.name}`} size="lg">
//       <div className="p-4 space-y-4">
//         <p className="text-gray-700 dark:text-gray-200">
//           <strong>Total Cost:</strong> {formatCurrency(costAnalysis.reduce((total, item) => total + item.totalCost, 0))}
//         </p>
//         <div className="space-y-2 divide-y divide-gray-200 dark:divide-gray-700">
//           {costAnalysis.map((item, index) => (
//             <div key={index} className="py-2 flex justify-between text-sm text-gray-800 dark:text-gray-100">
//               <span>{item.materialName}</span>
//               <span>
//                 {item.quantity} {item.unit} × {formatCurrency(item.unitCost)} = {formatCurrency(item.totalCost)}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </Modal>
//   );
// };
import React from "react";
import type { Recipe } from "../../../types";
import { formatCurrency, roundToTwoDecimals } from "../../../utils/quantity";
import { Modal } from "../../ui";

interface Props {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
}

export const RecipeCostBreakdownModal: React.FC<Props> = ({ recipe, isOpen, onClose }) => {
  const costAnalysis = recipe.costAnalysis?.breakdown;

  // Precise calculation of total cost using individual item costs
  const calculateAccurateTotal = () => {
    if (!costAnalysis) return 0;
    return costAnalysis.reduce((total, item) => {
      const quantity = typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity || 0;
      const unitCost = typeof item.unitCost === "string" ? parseFloat(item.unitCost) : item.unitCost || 0;
      const itemTotal = roundToTwoDecimals(quantity * unitCost);
      return total + itemTotal;
    }, 0);
  };

  const accurateTotal = calculateAccurateTotal();

  if (!costAnalysis || costAnalysis.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={`Cost Breakdown - ${recipe.name}`} size="lg">
        <div className="p-6 text-center text-gray-500 dark:text-gray-300">No cost data available for this recipe.</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cost Breakdown - ${recipe.name}`} size="lg">
      <div className="p-4 space-y-4">
        <p className="text-gray-700 dark:text-gray-200">
          <strong>Total Cost:</strong> {formatCurrency(accurateTotal)}
        </p>
        <div className="space-y-2 divide-y divide-gray-200 dark:divide-gray-700">
          {costAnalysis.map((item, index) => {
            const quantity = typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity || 0;
            const unitCost = typeof item.unitCost === "string" ? parseFloat(item.unitCost) : item.unitCost || 0;
            const calculatedTotal = roundToTwoDecimals(quantity * unitCost);

            return (
              <div key={index} className="py-2 flex justify-between text-sm text-gray-800 dark:text-gray-100">
                <span>{item.materialName || "Unknown Material"}</span>
                <span>
                  {quantity} {item.unit || ""} × {formatCurrency(unitCost)} = {formatCurrency(calculatedTotal)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
