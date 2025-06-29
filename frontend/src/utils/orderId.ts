import { db } from "../lib/database";

const ORDER_COUNTER_ID = "main-counter";

/**
 * Generates the next sequential order ID in the format ORDER-001, ORDER-002, etc.
 * @returns Promise<string> - The next order ID
 */
export async function generateNextOrderId(): Promise<string> {
  try {
    // Use a transaction to ensure atomicity
    return await db.transaction('rw', db.orderCounter, async () => {
      // Get the current counter
      let counter = await db.orderCounter.get(ORDER_COUNTER_ID);
      
      if (!counter) {
        // Initialize counter if it doesn't exist
        counter = {
          id: ORDER_COUNTER_ID,
          lastOrderNumber: 0
        };
        await db.orderCounter.put(counter); // Use put() instead of add() to handle existing records
      }
      
      // Increment the counter
      const nextNumber = counter.lastOrderNumber + 1;
      
      // Update the counter in the database
      await db.orderCounter.update(ORDER_COUNTER_ID, {
        lastOrderNumber: nextNumber
      });
      
      // Format the order ID with leading zeros
      return `ORDER-${nextNumber.toString().padStart(3, '0')}`;
    });
  } catch (error) {
    console.error("Error generating order ID:", error);
    // Fallback: use timestamp if database operation fails
    const timestamp = Date.now();
    return `ORDER-${timestamp}`;
  }
}

/**
 * Gets the current order number without incrementing
 * @returns Promise<number> - The current order number
 */
export async function getCurrentOrderNumber(): Promise<number> {
  try {
    const counter = await db.orderCounter.get(ORDER_COUNTER_ID);
    return counter?.lastOrderNumber || 0;
  } catch (error) {
    console.error("Error getting current order number:", error);
    return 0;
  }
}

/**
 * Resets the order counter to a specific number
 * @param number - The number to reset to
 * @returns Promise<void>
 */
export async function resetOrderCounter(number: number = 0): Promise<void> {
  try {
    await db.orderCounter.put({
      id: ORDER_COUNTER_ID,
      lastOrderNumber: number
    });
  } catch (error) {
    console.error("Error resetting order counter:", error);
  }
} 