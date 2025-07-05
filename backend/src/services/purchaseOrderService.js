import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

/**
 * Generate unique PO number
 */
const generatePONumber = async () => {
  const year = new Date().getFullYear();
  const count = await prisma().purchaseOrder.count({
    where: {
      created_at: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`)
      }
    }
  });
  return `PO-${year}-${String(count + 1).padStart(4, "0")}`;
};

/**
 * Create a new purchase order
 */
export const createPurchaseOrder = async orderData => {
  try {
    const poNumber = await generatePONumber();

    const { items, ...poData } = orderData;

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map(item => {
      const lineTotal = parseFloat(item.quantity_ordered) * parseFloat(item.unit_cost);
      subtotal += lineTotal;
      return {
        ...item,
        line_total: lineTotal
      };
    });

    const taxAmount = subtotal * 0.08; // 8% tax (configurable)
    const totalAmount = subtotal + taxAmount - (poData.discount_amount || 0);

    const purchaseOrder = await prisma().purchaseOrder.create({
      data: {
        po_number: poNumber,
        supplier_id: poData.supplier_id,
        order_date: new Date(poData.order_date),
        expected_date: new Date(poData.expected_date),
        subtotal,
        tax_amount: taxAmount,
        discount_amount: poData.discount_amount || 0,
        total_amount: totalAmount,
        notes: poData.notes,
        created_by: poData.created_by,
        status: "DRAFT",
        order_items: {
          create: processedItems
        }
      },
      include: {
        supplier: true,
        order_items: {
          include: {
            raw_material: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    logger.info(`Purchase order created: ${poNumber}`);

    return {
      success: true,
      data: purchaseOrder,
      message: `Purchase order ${poNumber} created successfully`
    };
  } catch (error) {
    logger.error("Error creating purchase order:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get purchase orders with filtering
 */
export const getPurchaseOrders = async (filters = {}) => {
  try {
    const { status, supplier_id, date_from, date_to, page = 1, limit = 20 } = filters;

    const where = {};

    if (status) where.status = status;
    if (supplier_id) where.supplier_id = parseInt(supplier_id);
    if (date_from || date_to) {
      where.order_date = {};
      if (date_from) where.order_date.gte = new Date(date_from);
      if (date_to) where.order_date.lte = new Date(date_to);
    }

    const [orders, total] = await Promise.all([
      prisma().purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          order_items: {
            include: {
              raw_material: true
            }
          },
          creator: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true
            }
          },
          approver: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true
            }
          }
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma().purchaseOrder.count({ where })
    ]);

    return {
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    logger.error("Error fetching purchase orders:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Approve purchase order
 */
export const approvePurchaseOrder = async (id, approvedBy) => {
  try {
    const updatedOrder = await prisma().purchaseOrder.update({
      where: { id: parseInt(id) },
      data: {
        status: "APPROVED",
        approved_by: approvedBy
      },
      include: {
        supplier: true,
        order_items: {
          include: {
            raw_material: true
          }
        }
      }
    });

    logger.info(`Purchase order ${updatedOrder.po_number} approved`);

    return {
      success: true,
      data: updatedOrder,
      message: "Purchase order approved successfully"
    };
  } catch (error) {
    logger.error("Error approving purchase order:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Send purchase order to supplier
 */
export const sendPurchaseOrder = async id => {
  try {
    const updatedOrder = await prisma().purchaseOrder.update({
      where: { id: parseInt(id) },
      data: { status: "SENT" },
      include: {
        supplier: true,
        order_items: {
          include: {
            raw_material: true
          }
        }
      }
    });

    // Here you would integrate with email service to send PO to supplier
    logger.info(`Purchase order ${updatedOrder.po_number} sent to supplier`);

    return {
      success: true,
      data: updatedOrder,
      message: "Purchase order sent to supplier successfully"
    };
  } catch (error) {
    logger.error("Error sending purchase order:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Receive goods against purchase order
 */
export const receiveGoods = async receiptData => {
  try {
    const { purchase_order_id, received_items, ...receiptInfo } = receiptData;

    // Create receipt record
    const receipt = await prisma().purchaseReceipt.create({
      data: {
        purchase_order_id: parseInt(purchase_order_id),
        receipt_number: `REC-${Date.now()}`,
        received_date: new Date(receiptInfo.received_date),
        received_by: receiptInfo.received_by,
        notes: receiptInfo.notes,
        is_partial: receiptInfo.is_partial || false
      }
    });

    // Update purchase order items with received quantities
    for (const item of received_items) {
      await prisma().purchaseOrderItem.update({
        where: { id: item.id },
        data: {
          quantity_received: {
            increment: parseFloat(item.quantity_received)
          }
        }
      });

      // Create stock entry for received goods
      await prisma().stockEntry.create({
        data: {
          raw_material_id: item.raw_material_id,
          quantity: parseFloat(item.quantity_received),
          unit_cost: parseFloat(item.unit_cost),
          total_cost: parseFloat(item.quantity_received) * parseFloat(item.unit_cost),
          supplier: receiptInfo.supplier_name,
          received_date: new Date(receiptInfo.received_date),
          received_by: receiptInfo.received_by,
          notes: `Received against PO: ${receiptInfo.po_number}`
        }
      });
    }

    // Update PO status
    const po = await prisma().purchaseOrder.findUnique({
      where: { id: parseInt(purchase_order_id) },
      include: { order_items: true }
    });

    const allItemsReceived = po.order_items.every(item => parseFloat(item.quantity_received) >= parseFloat(item.quantity_ordered));

    await prisma().purchaseOrder.update({
      where: { id: parseInt(purchase_order_id) },
      data: {
        status: allItemsReceived ? "COMPLETED" : "PARTIALLY_RECEIVED",
        received_date: allItemsReceived ? new Date() : undefined
      }
    });

    logger.info(`Goods received for PO: ${po.po_number}`);

    return {
      success: true,
      data: receipt,
      message: "Goods received successfully"
    };
  } catch (error) {
    logger.error("Error receiving goods:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get purchase order analytics
 */
export const getPurchaseOrderAnalytics = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalOrders, totalValue, pendingOrders, overdueOrders, topSuppliers, categorySpending] = await Promise.all([
      // Total orders count
      prisma().purchaseOrder.count({
        where: { created_at: { gte: startDate } }
      }),

      // Total value
      prisma().purchaseOrder.aggregate({
        where: { created_at: { gte: startDate } },
        _sum: { total_amount: true }
      }),

      // Pending orders
      prisma().purchaseOrder.count({
        where: {
          status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT"] }
        }
      }),

      // Overdue orders
      prisma().purchaseOrder.count({
        where: {
          expected_date: { lt: new Date() },
          status: { notIn: ["COMPLETED", "CANCELLED"] }
        }
      }),

      // Top suppliers by value
      prisma().purchaseOrder.groupBy({
        by: ["supplier_id"],
        where: { created_at: { gte: startDate } },
        _sum: { total_amount: true },
        _count: true,
        orderBy: { _sum: { total_amount: "desc" } },
        take: 5
      }),

      // Category spending
      prisma().$queryRaw`
        SELECT rm.category, SUM(poi.line_total) as total_spending, COUNT(*) as item_count
        FROM purchase_orders po
        JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
        JOIN raw_materials rm ON poi.raw_material_id = rm.id
        WHERE po.created_at >= ${startDate}
        GROUP BY rm.category
        ORDER BY total_spending DESC
      `
    ]);

    // Get supplier details for top suppliers
    const supplierIds = topSuppliers.map(s => s.supplier_id);
    const suppliers = await prisma().supplier.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, name: true }
    });

    const topSuppliersWithNames = topSuppliers.map(supplier => ({
      ...supplier,
      name: suppliers.find(s => s.id === supplier.supplier_id)?.name || "Unknown"
    }));

    return {
      success: true,
      data: {
        summary: {
          totalOrders,
          totalValue: parseFloat(totalValue._sum.total_amount || 0),
          pendingOrders,
          overdueOrders,
          averageOrderValue: totalOrders > 0 ? parseFloat(totalValue._sum.total_amount || 0) / totalOrders : 0
        },
        topSuppliers: topSuppliersWithNames,
        categorySpending: categorySpending.map(cat => ({
          category: cat.category,
          totalSpending: parseFloat(cat.total_spending),
          itemCount: parseInt(cat.item_count)
        }))
      }
    };
  } catch (error) {
    logger.error("Error getting purchase order analytics:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Generate reorder suggestions based on consumption and stock levels
 */
export const getReorderSuggestions = async () => {
  try {
    // Get materials that are below minimum stock level
    const lowStockMaterials = await prisma().$queryRaw`
      SELECT 
        rm.id,
        rm.name,
        rm.category,
        rm.unit,
        rm.min_stock_level,
        rm.max_stock_level,
        COALESCE(SUM(si.quantity), 0) as current_stock,
        rm.unit_cost,
        (rm.max_stock_level - COALESCE(SUM(si.quantity), 0)) as suggested_quantity
      FROM raw_materials rm
      LEFT JOIN section_inventories si ON rm.id = si.raw_material_id
      WHERE rm.is_active = true
      GROUP BY rm.id, rm.name, rm.category, rm.unit, rm.min_stock_level, rm.max_stock_level, rm.unit_cost
      HAVING COALESCE(SUM(si.quantity), 0) <= rm.min_stock_level
      ORDER BY (COALESCE(SUM(si.quantity), 0) / rm.min_stock_level) ASC
    `;

    // Get consumption trends for better suggestions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const consumptionTrends = await Promise.all(
      lowStockMaterials.map(async material => {
        const consumption = await prisma().sectionConsumption.aggregate({
          where: {
            raw_material_id: material.id,
            consumed_date: { gte: thirtyDaysAgo }
          },
          _sum: { quantity: true }
        });

        const averageDailyConsumption = parseFloat(consumption._sum.quantity || 0) / 30;
        const daysOfStock = averageDailyConsumption > 0 ? parseFloat(material.current_stock) / averageDailyConsumption : 999;

        return {
          ...material,
          averageDailyConsumption,
          daysOfStock,
          urgency: daysOfStock < 7 ? "HIGH" : daysOfStock < 14 ? "MEDIUM" : "LOW",
          suggestedQuantity: Math.max(
            parseFloat(material.suggested_quantity),
            averageDailyConsumption * 30 // 30 days worth
          )
        };
      })
    );

    return {
      success: true,
      data: {
        reorderSuggestions: consumptionTrends,
        summary: {
          totalItems: consumptionTrends.length,
          highUrgency: consumptionTrends.filter(item => item.urgency === "HIGH").length,
          estimatedValue: consumptionTrends.reduce((sum, item) => sum + parseFloat(item.unit_cost) * item.suggestedQuantity, 0)
        }
      }
    };
  } catch (error) {
    logger.error("Error generating reorder suggestions:", error);
    return {
      success: false,
      message: error.message
    };
  }
};
