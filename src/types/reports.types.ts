import type { RawMaterial, Section, StockEntry, StockMovement } from ".";

export interface ConsumptionReportProps {
  movements: StockMovement[];
  stockEntries: StockEntry[];
  rawMaterials: RawMaterial[];
  sections: Section[];
  selectedSection: string;
  dateRange: number;
  consumptionByCategory: Record<string, number>;
}
