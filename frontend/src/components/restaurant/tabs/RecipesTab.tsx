import React, { useState } from "react";
import { useRawMaterials } from "../../../hooks/useRawMaterials";
import { useCreateRecipe, useRecipes, useUpdateRecipe } from "../../../hooks/useRecipes";
import type { CreateRecipeRequest, Recipe, RecipeFilters, UpdateRecipeRequest } from "../../../types";
import { RecipeForm } from "../../forms/RecipeForm";
import { Modal } from "../../ui";
import { CostingView } from "../components/CostingView";
import { RecipeCostBreakdownModal } from "../components/RecipeCostBreakdownModal";
import { RecipeDetailsModal } from "../components/RecipeDetailsModal";
import { RecipesView } from "../components/RecipesView";

export const RecipesTab: React.FC = () => {
  const [filters] = useState<RecipeFilters>({
    search: "",
    category: "",
    is_active: true,
    page: 1,
    limit: 10
  });
  const [viewMode, setViewMode] = useState<"recipes" | "costing">("recipes");

  const [modalState, setModalState] = useState<{
    create: boolean;
    edit: boolean;
    view: boolean;
    selectedRecipe: Recipe | null;
    costAnalysis: boolean;
  }>({
    create: false,
    edit: false,
    view: false,
    costAnalysis: false,
    selectedRecipe: null
  });

  const { data: recipesData } = useRecipes(filters);
  const recipes = recipesData?.recipes || [];
  const rawMaterials = useRawMaterials({}).data || [];
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();

  const closeAllModals = () =>
    setModalState({
      create: false,
      edit: false,
      view: false,
      costAnalysis: false,
      selectedRecipe: null
    });

  const handleCreateRecipe = async (data: CreateRecipeRequest) => {
    await createRecipe.mutateAsync(data);
    closeAllModals();
  };

  const handleUpdateRecipe = async (data: UpdateRecipeRequest) => {
    if (!modalState.selectedRecipe) return;
    await updateRecipe.mutateAsync({ id: modalState.selectedRecipe.id, data });
    closeAllModals();
  };

  const openEditModal = (recipe: Recipe) => setModalState({ create: false, edit: true, view: false, selectedRecipe: recipe, costAnalysis: false });
  const openViewModal = (recipe: Recipe) => setModalState({ create: false, edit: false, view: true, selectedRecipe: recipe, costAnalysis: false });
  const openCostAnalysisModal = (recipe: Recipe) => setModalState({ create: false, edit: false, view: false, selectedRecipe: recipe, costAnalysis: true });

  const renderContent = () => {
    switch (viewMode) {
      case "costing":
        return <CostingView recipes={recipes} onBack={() => setViewMode("recipes")} onViewCostBreakdown={openCostAnalysisModal} />;
      default:
        return <RecipesView onOpenCreate={() => setModalState({ ...modalState, create: true })} onOpenEdit={openEditModal} onOpenView={openViewModal} onSwitchView={view => setViewMode(view)} />;
    }
  };

  return (
    <>
      {renderContent()}

      {/* Create Modal */}
      <Modal isOpen={modalState.create} onClose={closeAllModals} title="Create New Recipe" size="lg">
        <div className="p-6">
          <RecipeForm onSubmit={handleCreateRecipe} onCancel={closeAllModals} isLoading={createRecipe.isPending} rawMaterials={rawMaterials} />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={modalState.edit} onClose={closeAllModals} title={`Edit ${modalState.selectedRecipe?.name}`} size="lg">
        <div className="p-6">
          <RecipeForm recipe={modalState.selectedRecipe} onSubmit={handleUpdateRecipe} onCancel={closeAllModals} isLoading={updateRecipe.isPending} rawMaterials={rawMaterials} />
        </div>
      </Modal>

      {/* View Recipe Details Modal */}
      <RecipeDetailsModal
        recipe={modalState.selectedRecipe}
        isOpen={modalState.view}
        onClose={closeAllModals}
        onEdit={() => setModalState(prev => ({ ...prev, view: false, edit: true }))}
        onCostAnalysis={() => {
          setViewMode("costing");
          closeAllModals();
        }}
      />

      {modalState.costAnalysis && modalState.selectedRecipe && <RecipeCostBreakdownModal recipe={modalState.selectedRecipe} isOpen={modalState.costAnalysis} onClose={closeAllModals} />}
    </>
  );
};
