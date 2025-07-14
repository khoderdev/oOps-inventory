import { getPrisma } from "../config/prisma.js";
import logger from "../utils/logger.js";
import { recordRecipeConsumption, recordSectionConsumption } from "./sectionsService.js";

/**
 * Create and record a POS sale with inventory consumption
 */
export const createPosSale = async saleData => {
  const prisma = getPrisma(); // Get the Prisma client instance
  try {
    console.log("[SERVICE] Starting POS sale creation with data:", JSON.stringify(saleData, null, 2));

    const { sectionId, cashierId, items, subtotal, total, tax = 0, paymentMethod, saleDate, status } = saleData;

    // Validate required fields
    if (!sectionId || !cashierId || !items || items.length === 0) {
      const errorMsg = `Missing required fields: ${!sectionId ? "sectionId " : ""}${!cashierId ? "cashierId " : ""}${!items ? "items" : ""}`;
      console.error("[SERVICE] Validation failed:", errorMsg);
      throw new Error(errorMsg);
    }

    console.log("[SERVICE] Validated fields - proceeding with sale creation");
    console.log("[SERVICE] Items to process:", items.length);

    // Debug Prisma connection
    console.log("[SERVICE] Checking Prisma connection...");
    if (!prisma) {
      throw new Error("Prisma client is not initialized");
    }
    if (!prisma.sale) {
      throw new Error("Prisma sale model is not available");
    }

    // Create the sale record with all items
    console.log("[SERVICE] Preparing Prisma create payload...");
    const createPayload = {
      data: {
        sectionId: parseInt(sectionId),
        cashierId: parseInt(cashierId),
        subtotal: parseFloat(subtotal),
        total: parseFloat(total),
        tax: parseFloat(tax),
        paymentMethod,
        saleDate: new Date(saleDate),
        status,
        items: {
          create: items.map((item, index) => {
            console.log(`[SERVICE] Processing item ${index + 1}:`, JSON.stringify(item));
            return {
              itemId: item.id,
              itemType: item.type.toUpperCase(),
              itemName: item.name,
              price: parseFloat(item.price),
              quantity: parseInt(item.quantity),
              cost: parseFloat(item.cost || item.price * 0.8) // Default cost if not provided
            };
          })
        }
      },
      include: {
        items: true,
        cashier: true,
        section: true
      }
    };

    console.log("[SERVICE] Full Prisma create payload:", JSON.stringify(createPayload, null, 2));

    const createdSale = await prisma.sale.create(createPayload);
    console.log("[SERVICE] Sale record created successfully. ID:", createdSale.id);

    // Process inventory consumption
    console.log("[SERVICE] Starting inventory consumption recording...");
    for (const [index, item] of items.entries()) {
      console.log(`[SERVICE] Processing consumption for item ${index + 1} (${item.type})`);

      const consumptionData = {
        sectionId: parseInt(sectionId),
        quantity: parseInt(item.quantity),
        consumedBy: parseInt(cashierId),
        reason: "POS Sale",
        source: "POS",
        orderId: createdSale.id
      };

      try {
        if (item.type.toLowerCase() === "item") {
          console.log(`[SERVICE] Recording section consumption for item ${item.id}`);
          await recordSectionConsumption({
            ...consumptionData,
            rawMaterialId: parseInt(item.id)
          });
        } else {
          console.log(`[SERVICE] Recording recipe consumption for recipe ${item.id}`);
          await recordRecipeConsumption({
            ...consumptionData,
            recipeId: parseInt(item.id)
          });
        }
      } catch (consumptionError) {
        console.error(`[SERVICE] Failed to record consumption for item ${item.id}:`, consumptionError);
        throw new Error(`Failed to record consumption for ${item.type} ${item.id}`);
      }
    }

    console.log("[SERVICE] POS sale process completed successfully");
    return {
      success: true,
      data: createdSale,
      message: "POS sale recorded successfully"
    };
  } catch (error) {
    console.error("[SERVICE] Error in createPosSale:", {
      message: error.message,
      stack: error.stack,
      ...(error.code && { code: error.code }),
      ...(error.meta && { meta: error.meta })
    });
    logger.error("Error creating POS sale:", error);
    return {
      success: false,
      message: error.message || "Failed to create POS sale"
    };
  }
};

/**
 * Get all POS sales with optional date filtering
 */
export const getAllPosSales = async (filters = {}) => {
  const prisma = getPrisma(); // Get the Prisma client instance
  try {
    const { startDate, endDate, sectionId } = filters;

    const whereClause = {};
    if (startDate || endDate) {
      whereClause.saleDate = {};
      if (startDate) whereClause.saleDate.gte = new Date(startDate);
      if (endDate) whereClause.saleDate.lte = new Date(endDate);
    }
    if (sectionId) whereClause.sectionId = parseInt(sectionId);

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        items: true,
        cashier: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        },
        section: true
      },
      orderBy: { saleDate: "desc" }
    });

    return {
      success: true,
      data: sales
    };
  } catch (error) {
    logger.error("Error fetching POS sales:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch POS sales"
    };
  }
};

/**
 * Get detailed POS sale by ID
 */
export const getPosSaleById = async id => {
  const prisma = getPrisma(); // Get the Prisma client instance
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
        cashier: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        },
        section: {
          include: {
            restaurant: true
          }
        }
      }
    });

    if (!sale) {
      return {
        success: false,
        message: "Sale not found",
        code: "NOT_FOUND"
      };
    }

    return {
      success: true,
      data: sale
    };
  } catch (error) {
    logger.error(`Error fetching POS sale ID ${id}:`, error);
    return {
      success: false,
      message: error.message || "Failed to fetch sale details"
    };
  }
};
