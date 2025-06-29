import type { RawMaterial, StockEntry, StockMovement } from ".";

export interface ConsumptionReportProps {
  movements: StockMovement[];
  stockEntries: StockEntry[];
  rawMaterials: RawMaterial[];
  selectedSection: string;
  consumptionByCategory: Record<string, number>;
}
