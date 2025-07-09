export interface Recipe {
  id: number;
  name: string;
  description?: string;
  category?: string;
  serving_size: number;
  prep_time?: number;
  cook_time?: number;
  instructions?: string;
  cost_per_serving?: number;
  margin_percentage?: number;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  ingredients: RecipeIngredient[];
  menu_items?: MenuItem[];
  creator?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  costAnalysis?: RecipeCostAnalysis;
}

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  raw_material_id: number;
  quantity: number;
  baseUnit: string;
  cost_per_unit?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  raw_material?: {
    id: number;
    name: string;
    unit: string;
    category: string;
    unit_cost: number;
  };
}

export interface RecipeCostAnalysis {
  totalCost: number;
  costPerServing: number;
  breakdown: CostBreakdownItem[];
}

export interface CostBreakdownItem {
  materialId: number;
  materialName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  percentage: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  category: MenuCategory;
  recipe_id?: number;
  cost_price: number;
  selling_price: number;
  margin_amount: number;
  margin_percentage: number;
  is_available: boolean;
  is_popular: boolean;
  allergens?: string;
  nutritional_info?: string;
  created_at: string;
  updated_at: string;
  recipe?: Recipe;
  sales?: Sale[];
}

export interface Sale {
  id: number;
  order_number: string;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  section_id?: number;
  served_by?: number;
  created_at: string;
}

export interface MenuEngineering {
  matrix: {
    stars: MenuItemAnalysis[];
    plowhorses: MenuItemAnalysis[];
    puzzles: MenuItemAnalysis[];
    dogs: MenuItemAnalysis[];
  };
  menuItems: MenuItemAnalysis[];
  analysis: {
    stars: MenuItemAnalysis[];
    plowhorses: MenuItemAnalysis[];
    puzzles: MenuItemAnalysis[];
    dogs: MenuItemAnalysis[];
  };
  summary: {
    totalItems: number;
    totalRevenue: number;
    averageMargin: number;
    averageSales: number;
    recommendations: MenuRecommendation[];
  };
}

export interface MenuItemAnalysis {
  id: number;
  name: string;
  category: MenuCategory;
  costPrice: number;
  sellingPrice: number;
  marginAmount: number;
  marginPercentage: number;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  profitContribution: number;
  isHighSales: boolean;
  isHighMargin: boolean;
  classification: "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";
}

export interface MenuRecommendation {
  category: string;
  action: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  items: string[];
}

export interface CreateRecipeRequest {
  name: string;
  description?: string;
  category?: string;
  serving_size: number;
  prep_time?: number;
  cook_time?: number;
  instructions?: string;
  margin_percentage?: number;
  ingredients: CreateRecipeIngredient[];
}

export interface CreateRecipeIngredient {
  raw_material_id: number;
  quantity: number;
  baseUnit: string;
}

export interface CreateMenuItemRequest {
  name: string;
  description?: string;
  category: MenuCategory;
  recipe_id?: number;
  cost_price?: number;
  selling_price: number;
  is_popular?: boolean;
  allergens?: string;
  nutritional_info?: string;
}

export interface RecipeFilters {
  search: string;
  category?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedRecipes {
  recipes: Recipe[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export enum MenuCategory {
  APPETIZER = "APPETIZER",
  MAIN_COURSE = "MAIN_COURSE",
  DESSERT = "DESSERT",
  BEVERAGE = "BEVERAGE",
  SIDE_DISH = "SIDE_DISH",
  SALAD = "SALAD",
  SOUP = "SOUP",
  SPECIAL = "SPECIAL",
  BREAKFAST = "BREAKFAST",
  LUNCH = "LUNCH",
  DINNER = "DINNER"
}

export const MenuCategoryLabels: Record<MenuCategory, string> = {
  [MenuCategory.APPETIZER]: "Appetizer",
  [MenuCategory.MAIN_COURSE]: "Main Course",
  [MenuCategory.DESSERT]: "Dessert",
  [MenuCategory.BEVERAGE]: "Beverage",
  [MenuCategory.SIDE_DISH]: "Side Dish",
  [MenuCategory.SALAD]: "Salad",
  [MenuCategory.SOUP]: "Soup",
  [MenuCategory.SPECIAL]: "Special",
  [MenuCategory.BREAKFAST]: "Breakfast",
  [MenuCategory.LUNCH]: "Lunch",
  [MenuCategory.DINNER]: "Dinner"
};
