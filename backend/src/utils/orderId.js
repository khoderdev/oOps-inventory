import prisma from "../config/prisma.js";
import logger from "./logger.js";

/**
 * Generates the next sequential order ID in the format ORDER-001, ORDER-002, etc.
 * @returns Promise<string> - The next order ID
 */
export async function generateNextOrderId() {
  try {
    // Use a transaction to ensure atomicity
    const result = await prisma().$transaction(async tx => {
      // Get or create the counter
      let counter = await tx.orderCounter.findFirst();

      if (!counter) {
        // Initialize counter if it doesn't exist
        counter = await tx.orderCounter.create({
          data: {
            last_order_number: 0
          }
        });
      }

      // Increment the counter
      const nextNumber = counter.last_order_number + 1;

      // Update the counter in the database
      await tx.orderCounter.update({
        where: { id: counter.id },
        data: {
          last_order_number: nextNumber
        }
      });

      // Format the order ID with leading zeros
      return `ORDER-${nextNumber.toString().padStart(3, "0")}`;
    });

    logger.info("Generated order ID:", result);
    return result;
  } catch (error) {
    logger.error("Error generating order ID:", error);
    // Fallback: use timestamp if database operation fails
    const timestamp = Date.now();
    return `ORDER-${timestamp}`;
  }
}

/**
 * Gets the current order number without incrementing
 * @returns Promise<number> - The current order number
 */
export async function getCurrentOrderNumber() {
  try {
    const counter = await prisma().orderCounter.findFirst();
    return counter?.last_order_number || 0;
  } catch (error) {
    logger.error("Error getting current order number:", error);
    return 0;
  }
}

/**
 * Resets the order counter to a specific number
 * @param number - The number to reset to
 * @returns Promise<void>
 */
export async function resetOrderCounter(number = 0) {
  try {
    // Get existing counter
    const existingCounter = await prisma().orderCounter.findFirst();

    if (existingCounter) {
      await prisma().orderCounter.update({
        where: { id: existingCounter.id },
        data: {
          last_order_number: number
        }
      });
    } else {
      await prisma().orderCounter.create({
        data: {
          last_order_number: number
        }
      });
    }

    logger.info("Order counter reset to:", number);
  } catch (error) {
    logger.error("Error resetting order counter:", error);
    throw error;
  }
}
