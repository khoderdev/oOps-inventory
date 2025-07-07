import { useCallback, useState } from "react";

const ORDER_PREFIX = "ORDER-";
const PAD_LENGTH = 3;

export function useOrderIdCounter() {
  const [lastOrderNumber, setLastOrderNumber] = useState(0);

  const generateNextOrderId = useCallback((): string => {
    const nextNumber = lastOrderNumber + 1;
    setLastOrderNumber(nextNumber);
    return `${ORDER_PREFIX}${nextNumber.toString().padStart(PAD_LENGTH, "0")}`;
  }, [lastOrderNumber]);

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
