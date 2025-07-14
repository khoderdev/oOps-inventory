import * as Select from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import { CreditCard, DollarSign, Minus, Package, Plus, Search, ShoppingCart, Trash2, Utensils, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { PosSalesAPI } from "../../data/pos.api";
import { SectionsAPI } from "../../data/sections.api";
import { UsersAPI } from "../../data/users.api";
import type { CartItem, Section, SectionInventory, SectionRecipe, User } from "../../types";
import { formatCurrency } from "../../utils/formatting";
import "./pos.css";

const POSScreen = () => {
  const [activeTab, setActiveTab] = useState<"items" | "recipes">("items");
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [inventory, setInventory] = useState<SectionInventory[]>([]);
  const [recipes, setRecipes] = useState<SectionRecipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashier, setCashier] = useState<User | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // Fetch sections on mount
  useEffect(() => {
    const fetchSections = async () => {
      const response = await SectionsAPI.getAll({ isActive: true });
      if (response.success && response.data.length > 0) {
        setSections(response.data);
        setSelectedSection(response.data[0]);
      }
    };
    fetchSections();
  }, []);

  // Fetch inventory and recipes when section changes
  useEffect(() => {
    if (!selectedSection) return;

    const fetchData = async () => {
      const [inventoryRes, recipesRes] = await Promise.all([SectionsAPI.getSectionInventory(selectedSection.id), SectionsAPI.getSectionRecipes(selectedSection.id)]);

      if (inventoryRes.success) setInventory(inventoryRes.data);
      if (recipesRes.success) setRecipes(recipesRes.data);
    };

    fetchData();
  }, [selectedSection]);

  // Set current user as cashier
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const response = await UsersAPI.getCurrent();
      console.log("User API response:", response);
      if (response.success && response.data) {
        setCashier(response.data);
        console.log("Cashier set:", response.data);
      } else {
        setCashier(null);
        console.log("No cashier found");
      }
    };

    fetchCurrentUser();
  }, []);

  const filteredInventory = inventory.filter(item => item.rawMaterial?.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredRecipes = recipes.filter(recipe => recipe.recipe?.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const addToCart = (item: { id: string; name: string; price: number; type: "item" | "recipe"; sectionId: number }) => {
    setCart(prev => {
      const existingItem = prev.find(i => i.id === item.id && i.type === item.type);
      if (existingItem) {
        return prev.map(i => (i.id === item.id && i.type === item.type ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          ...item,
          quantity: 1
        }
      ];
    });
  };

  const removeFromCart = (id: string, type: "item" | "recipe") => {
    setCart(prev => prev.filter(item => !(item.id === id && item.type === type)));
  };

  const updateQuantity = (id: string, type: "item" | "recipe", quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id, type);
      return;
    }
    setCart(prev => prev.map(item => (item.id === id && item.type === type ? { ...item, quantity } : item)));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (!paymentMethod || !selectedSection || !cashier) {
      alert("Please select a payment method and ensure section/cashier are set");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    try {
      // Transform cart items to match backend expectations
      const items = cart.map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        cost: item.price * 0.8 // Default cost calculation
      }));

      // Prepare sale data
      const saleData = {
        sectionId: selectedSection.id,
        cashierId: cashier.id,
        items,
        subtotal,
        total,
        tax,
        paymentMethod,
        status: "COMPLETED",
        saleDate: new Date()
      };

      // Step 1: Record sale in sales DB
      const saleResponse = await PosSalesAPI.create(saleData);

      if (!saleResponse.success) throw new Error(saleResponse.message);

      // Step 2: Record inventory consumption
      for (const item of cart) {
        if (item.type === "item") {
          await SectionsAPI.recordConsumption(selectedSection.id, item.id, item.quantity, cashier.id, "POS Sale", saleResponse.data.id);
        } else {
          await SectionsAPI.recordRecipeConsumption({
            sectionId: selectedSection.id,
            recipeId: parseInt(item.id),
            quantity: item.quantity,
            consumedBy: cashier.id,
            orderId: saleResponse.data.id,
            source: "POS"
          });
        }
      }

      alert(`Payment of ${formatCurrency(total)} successful via ${paymentMethod}`);

      // Reset cart and payment method to default (CASH)
      setCart([]);
      setPaymentMethod("CASH");
    } catch (error) {
      alert("Checkout failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Panel - Products */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <Select.Root value={selectedSection?.id?.toString()} onValueChange={value => setSelectedSection(sections.find(s => s.id.toString() === value) || null)}>
            <Select.Trigger className="w-64 p-2 border rounded flex items-center justify-between">
              <Select.Value placeholder="Select section" />
              <Select.Icon />
            </Select.Trigger>
            <Select.Content className="bg-white border rounded shadow-lg">
              <Select.Viewport>
                {sections.map(section => (
                  <Select.Item key={section.id} value={section.id.toString()} className="p-2 hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-700 dark:text-white">
                    {section.name}
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Root>
          {!selectedSection && <p className="text-red-600 text-sm mt-1">Please select a section</p>}

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-400" />
            <input type="text" placeholder="Search items..." className="pl-10 pr-4 py-2 w-full border rounded" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <Tabs.Root value={activeTab} onValueChange={value => setActiveTab(value as "items" | "recipes")} className="flex flex-col h-full">
          <Tabs.List className="flex border-b">
            <Tabs.Trigger value="items" className="flex items-center px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 dark:text-white">
              <Package className="mr-2 h-4 w-4" />
              Items
            </Tabs.Trigger>
            <Tabs.Trigger value="recipes" className="flex items-center px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 dark:text-white">
              <Utensils className="mr-2 h-4 w-4" />
              Recipes
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="items" className="flex-1 overflow-auto py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredInventory.map(item => (
                <div
                  key={`item-${item.id}`}
                  className="border rounded p-4 hover:shadow-md transition-shadow cursor-pointer dark:bg-gray-800"
                  onClick={() =>
                    addToCart({
                      id: item.rawMaterialId.toString(),
                      name: item.rawMaterial?.name || "Unknown",
                      price: item.rawMaterial?.unitCost || 0,
                      type: "item",
                      sectionId: selectedSection?.id || 0
                    })
                  }
                >
                  <div className="font-medium dark:text-white">{item.rawMaterial?.name}</div>
                  <div className="text-gray-600 dark:text-gray-400">{formatCurrency(item.rawMaterial?.unitCost || 0)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: {item.currentQuantity} {item.rawMaterial?.unit}
                  </div>
                </div>
              ))}
            </div>
          </Tabs.Content>

          <Tabs.Content value="recipes" className="flex-1 overflow-auto py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredRecipes.map(recipe => (
                <div
                  key={`recipe-${recipe.id}`}
                  className="border rounded p-4 hover:shadow-md transition-shadow cursor-pointer dark:bg-gray-800"
                  onClick={() =>
                    addToCart({
                      id: recipe.recipeId.toString(),
                      name: recipe.recipe?.name || "Unknown",
                      price: recipe.recipe?.servingCost || 0,
                      type: "recipe",
                      sectionId: selectedSection?.id || 0
                    })
                  }
                >
                  <div className="font-medium dark:text-white">{recipe.recipe?.name}</div>
                  <div className="text-gray-600 dark:text-gray-400">{formatCurrency(recipe.recipe?.servingCost || 0)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{recipe.recipe?.description}</div>
                </div>
              ))}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 border-l bg-white flex flex-col dark:bg-gray-800 dark:border-gray-700">
        <div className="p-4 border-b flex items-center justify-between dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center dark:text-white">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Cart
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
        </div>

        <div className="p-4 dark:text-white">
          Cashier: {cashier ? cashier.username : "Not logged in"}
          {!cashier && <p className="text-red-600 text-sm mt-1">Cashier not set. Please log in.</p>}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-8 dark:text-gray-400">
              <ShoppingCart className="mx-auto h-8 w-8 mb-2" />
              <p className="dark:text-white">Your cart is empty</p>
              <p className="text-sm">Add items from the left panel</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={`${item.type}-${item.id}`} className="border rounded p-3 flex justify-between items-center dark:border-gray-700">
                  <div>
                    <div className="font-medium dark:text-white">{item.name}</div>
                    <div className="text-gray-600 dark:text-gray-400">{formatCurrency(item.price)}</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center dark:text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeFromCart(item.id, item.type)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900 text-red-500 dark:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 space-y-4 dark:border-gray-700">
          <div className="space-y-2">
            <div className="flex justify-between dark:text-white">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between dark:text-white">
              <span>Tax (10%):</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg dark:text-white">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium dark:text-white">Payment Method</label>
            <div className="flex space-x-2">
              <button onClick={() => setPaymentMethod("CASH")} className={`flex-1 py-2 border rounded flex items-center justify-center space-x-2 ${paymentMethod === "CASH" ? "border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900" : "dark:border-gray-600"} dark:text-white`}>
                <Wallet className="h-4 w-4" />
                <span>Cash</span>
              </button>
              <button onClick={() => setPaymentMethod("CARD")} className={`flex-1 py-2 border rounded flex items-center justify-center space-x-2 ${paymentMethod === "CARD" ? "border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900" : "dark:border-gray-600"} dark:text-white`}>
                <CreditCard className="h-4 w-4" />
                <span>Card</span>
              </button>
            </div>
          </div>

          <button onClick={handleCheckout} disabled={cart.length === 0 || !paymentMethod || !selectedSection || !cashier} className={`w-full py-3 rounded font-medium flex items-center justify-center space-x-2 ${cart.length === 0 || !paymentMethod || !selectedSection || !cashier ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400" : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-900"}`}>
            <DollarSign className="h-5 w-5" />
            <span>Complete Sale</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSScreen;
