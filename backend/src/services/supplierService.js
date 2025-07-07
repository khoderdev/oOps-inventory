import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

/**
 * Create a new supplier
 */
export const createSupplier = async supplierData => {
  try {
    const supplier = await prisma().supplier.create({
      data: supplierData
    });

    logger.info(`Supplier created: ${supplier.name}`);

    return {
      success: true,
      data: supplier,
      message: "Supplier created successfully"
    };
  } catch (error) {
    logger.error("Error creating supplier:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Update supplier information
 */
export const updateSupplier = async (id, updateData) => {
  try {
    const supplier = await prisma().supplier.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    logger.info(`Supplier updated: ${supplier.name}`);

    return {
      success: true,
      data: supplier,
      message: "Supplier updated successfully"
    };
  } catch (error) {
    logger.error("Error updating supplier:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get all suppliers with filtering
 */
export const getSuppliers = async (filters = {}) => {
  try {
    const { is_active, search, page = 1, limit = 20 } = filters;

    const where = {};
    if (typeof is_active !== "undefined") where.is_active = is_active;
    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }, { contact_person: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }];
    }

    const [suppliers, total] = await Promise.all([
      prisma().supplier.findMany({
        where,
        include: {
          supplier_materials: {
            include: {
              raw_material: true
            }
          },
          purchase_orders: {
            select: {
              id: true,
              total_amount: true,
              status: true,
              order_date: true
            },
            orderBy: { order_date: "desc" },
            take: 5
          },
          _count: {
            select: {
              purchase_orders: true,
              supplier_materials: true
            }
          }
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma().supplier.count({ where })
    ]);

    return {
      success: true,
      data: {
        suppliers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    logger.error("Error fetching suppliers:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get supplier performance metrics
 */
export const getSupplierPerformance = async (supplierId, days = 90) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const supplier = await prisma().supplier.findUnique({
      where: { id: parseInt(supplierId) },
      include: {
        purchase_orders: {
          where: {
            order_date: { gte: startDate }
          },
          include: {
            order_items: true,
            receipts: true
          }
        }
      }
    });

    if (!supplier) {
      return {
        success: false,
        message: "Supplier not found"
      };
    }

    const performance = {
      supplierId: supplier.id,
      supplierName: supplier.name,
      period: `${days} days`,
      metrics: {
        totalOrders: supplier.purchase_orders.length,
        totalValue: supplier.purchase_orders.reduce((sum, po) => sum + parseFloat(po.total_amount), 0),
        averageOrderValue: 0,
        onTimeDeliveryRate: 0,
        orderAccuracyRate: 0,
        qualityScore: supplier.rating || 5,
        paymentTermsCompliance: 100, // This would be calculated based on actual payment data
        responseTime: supplier.lead_time_days
      }
    };

    if (performance.metrics.totalOrders > 0) {
      performance.metrics.averageOrderValue = performance.metrics.totalValue / performance.metrics.totalOrders;

      // Calculate on-time delivery rate
      const onTimeDeliveries = supplier.purchase_orders.filter(po => {
        if (!po.received_date || !po.expected_date) return false;
        return new Date(po.received_date) <= new Date(po.expected_date);
      }).length;

      performance.metrics.onTimeDeliveryRate = (onTimeDeliveries / supplier.purchase_orders.length) * 100;

      // Calculate order accuracy (assuming all items were delivered as ordered for now)
      performance.metrics.orderAccuracyRate = 95; // This would be calculated based on actual receipt data
    }

    // Recent orders summary
    performance.recentOrders = supplier.purchase_orders.slice(0, 10).map(po => ({
      id: po.id,
      poNumber: po.po_number,
      orderDate: po.order_date,
      expectedDate: po.expected_date,
      receivedDate: po.received_date,
      status: po.status,
      totalAmount: parseFloat(po.total_amount),
      itemCount: po.order_items.length,
      isOnTime: po.received_date && po.expected_date ? new Date(po.received_date) <= new Date(po.expected_date) : null
    }));

    return {
      success: true,
      data: performance
    };
  } catch (error) {
    logger.error("Error getting supplier performance:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Add or update supplier material pricing
 */
export const updateSupplierMaterial = async supplierMaterialData => {
  try {
    const { supplier_id, raw_material_id, ...data } = supplierMaterialData;

    const supplierMaterial = await prisma().supplierMaterial.upsert({
      where: {
        supplier_id_raw_material_id: {
          supplier_id: parseInt(supplier_id),
          raw_material_id: parseInt(raw_material_id)
        }
      },
      update: {
        ...data,
        last_price_update: new Date()
      },
      create: {
        supplier_id: parseInt(supplier_id),
        raw_material_id: parseInt(raw_material_id),
        ...data,
        last_price_update: new Date()
      },
      include: {
        supplier: true,
        raw_material: true
      }
    });

    logger.info(`Supplier material updated: ${supplierMaterial.supplier.name} - ${supplierMaterial.raw_material.name}`);

    return {
      success: true,
      data: supplierMaterial,
      message: "Supplier material pricing updated successfully"
    };
  } catch (error) {
    logger.error("Error updating supplier material:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get supplier comparison for materials
 */
export const getSupplierComparison = async materialId => {
  try {
    const material = await prisma().rawMaterial.findUnique({
      where: { id: parseInt(materialId) },
      include: {
        supplier_materials: {
          include: {
            supplier: true
          },
          where: {
            supplier: {
              is_active: true
            }
          },
          orderBy: {
            unit_cost: "asc"
          }
        }
      }
    });

    if (!material) {
      return {
        success: false,
        message: "Material not found"
      };
    }

    const comparison = {
      material: {
        id: material.id,
        name: material.name,
        category: material.category,
        unit: material.unit,
        currentUnitCost: parseFloat(material.unit_cost)
      },
      suppliers: material.supplier_materials.map(sm => ({
        supplierId: sm.supplier.id,
        supplierName: sm.supplier.name,
        unitCost: parseFloat(sm.unit_cost),
        minimumQuantity: parseFloat(sm.minimum_quantity),
        leadTimeDays: sm.lead_time_days,
        isPreferred: sm.is_preferred,
        lastPriceUpdate: sm.last_price_update,
        supplierRating: sm.supplier.rating,
        paymentTerms: sm.supplier.payment_terms,
        savingsVsCurrent: parseFloat(material.unit_cost) - parseFloat(sm.unit_cost),
        savingsPercentage: ((parseFloat(material.unit_cost) - parseFloat(sm.unit_cost)) / parseFloat(material.unit_cost)) * 100
      }))
    };

    // Add best value analysis
    if (comparison.suppliers.length > 0) {
      comparison.analysis = {
        lowestPrice: Math.min(...comparison.suppliers.map(s => s.unitCost)),
        highestPrice: Math.max(...comparison.suppliers.map(s => s.unitCost)),
        averagePrice: comparison.suppliers.reduce((sum, s) => sum + s.unitCost, 0) / comparison.suppliers.length,
        bestValueSupplier: comparison.suppliers.reduce((best, current) => {
          const currentScore = 10 - current.unitCost + current.supplierRating + (current.isPreferred ? 2 : 0);
          const bestScore = 10 - best.unitCost + best.supplierRating + (best.isPreferred ? 2 : 0);
          return currentScore > bestScore ? current : best;
        }),
        potentialSavings: Math.max(...comparison.suppliers.map(s => s.savingsVsCurrent))
      };
    }

    return {
      success: true,
      data: comparison
    };
  } catch (error) {
    logger.error("Error getting supplier comparison:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Get supplier dashboard analytics
 */
export const getSupplierAnalytics = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalSuppliers, activeSuppliers, totalSpent, topSuppliersByValue, supplierPerformanceStats] = await Promise.all([
      prisma().supplier.count(),
      prisma().supplier.count({ where: { is_active: true } }),

      prisma().purchaseOrder.aggregate({
        where: {
          order_date: { gte: startDate },
          status: { notIn: ["CANCELLED"] }
        },
        _sum: { total_amount: true }
      }),

      prisma().$queryRaw`
        SELECT 
          s.id,
          s.name,
          s.rating,
          COUNT(po.id) as order_count,
          SUM(po.total_amount) as total_value,
          AVG(po.total_amount) as avg_order_value
        FROM suppliers s
        LEFT JOIN purchase_orders po ON s.id = po.supplier_id
        WHERE s.is_active = true 
          AND po.order_date >= ${startDate}
        GROUP BY s.id, s.name, s.rating
        ORDER BY total_value DESC
        LIMIT 10
      `,

      prisma().$queryRaw`
        SELECT 
          AVG(s.rating) as avg_rating,
          AVG(s.lead_time_days) as avg_lead_time,
          COUNT(CASE WHEN s.rating >= 8 THEN 1 END) as high_performers,
          COUNT(*) as total_active
        FROM suppliers s
        WHERE s.is_active = true
      `
    ]);

    return {
      success: true,
      data: {
        summary: {
          totalSuppliers,
          activeSuppliers,
          inactiveSuppliers: totalSuppliers - activeSuppliers,
          totalSpent: parseFloat(totalSpent._sum.total_amount || 0),
          averageRating: parseFloat(supplierPerformanceStats[0]?.avg_rating || 0),
          averageLeadTime: parseInt(supplierPerformanceStats[0]?.avg_lead_time || 0),
          highPerformers: parseInt(supplierPerformanceStats[0]?.high_performers || 0)
        },
        topSuppliers: topSuppliersByValue.map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          rating: supplier.rating,
          orderCount: parseInt(supplier.order_count),
          totalValue: parseFloat(supplier.total_value),
          avgOrderValue: parseFloat(supplier.avg_order_value)
        }))
      }
    };
  } catch (error) {
    logger.error("Error getting supplier analytics:", error);
    return {
      success: false,
      message: error.message
    };
  }
};
