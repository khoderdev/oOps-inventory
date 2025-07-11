import { useSectionRecipesConsumption } from "../../hooks/useSections";

interface RecipeConsumptionHistoryProps {
  recipeId: string;
  sectionId?: string;
}

export const RecipeConsumptionHistory = ({ recipeId, sectionId }: RecipeConsumptionHistoryProps) => {
  const { data: consumptions = [], isLoading } = useSectionRecipesConsumption(sectionId || "", {
    recipeId
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Consumption History</h3>
      {isLoading ? (
        <div>Loading...</div>
      ) : consumptions.length === 0 ? (
        <div className="text-gray-500">No consumption records found</div>
      ) : (
        <div className="space-y-3">
          {consumptions.map(consumption => (
            <div key={consumption.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{new Date(consumption.consumedDate).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Section: {consumption.section?.name}</p>
                  {consumption.orderId && <p className="text-sm">Order: {consumption.orderId}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm">By: {consumption.user?.username}</p>
                </div>
              </div>
              {consumption.notes && <p className="mt-2 text-sm text-gray-600">{consumption.notes}</p>}
              <div className="mt-3 pt-3 border-t">
                <h4 className="text-sm font-medium mb-2">Ingredients Used:</h4>
                <ul className="space-y-1">
                  {consumption.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="flex justify-between text-sm">
                      <span>{ingredient.rawMaterial?.name}</span>
                      <span>
                        {ingredient.quantity} {ingredient.rawMaterial?.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
