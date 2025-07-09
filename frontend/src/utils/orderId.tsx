import { useCallback, useState } from "react";

const ORDER_PREFIX = "ORDER-";
const PAD_LENGTH = 3;

export function useOrderIdCounter() {
  const [lastOrderNumber, setLastOrderNumber] = useState(0);

  const generateNextOrderId = useCallback((): string => {
    let nextNumber = 0;
    setLastOrderNumber(prev => {
      nextNumber = prev + 1;
      return nextNumber;
    });
    return `${ORDER_PREFIX}${(lastOrderNumber + 1).toString().padStart(PAD_LENGTH, "0")}`;
  }, []);

  const getCurrentOrderNumber = useCallback(() => lastOrderNumber, [lastOrderNumber]);

  const resetOrderCounter = useCallback((number: number = 0) => {
    setLastOrderNumber(number);
  }, []);

  return {
    generateNextOrderId,
    getCurrentOrderNumber,
    resetOrderCounter,
  };
}
