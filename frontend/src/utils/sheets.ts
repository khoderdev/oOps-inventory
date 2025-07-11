import { format } from "date-fns";
import * as XLSX from "xlsx";

// Utility to convert data to worksheet with specific structure
export const createWorksheet = <T>(data: T[]): XLSX.WorkSheet => {
  // Map data to match the exact structure
  const formattedData = data.map(item => {
    const { referenceId, type, quantity, fromSectionId, toSectionId, reason, username, stockEntry, fromSection, toSection, material, createdAt, updatedAt } = item as any;
    return {
      referenceId: referenceId || "",
      type: type || "",
      quantity: quantity != null ? quantity : "-",
      fromSectionId: fromSection?.name || fromSectionId || "",
      toSectionId: toSection?.name || toSectionId || "",
      reason: reason || "Unknown",
      performedBy: username || "Unknown",
      stockEntry: stockEntry || "",
      fromSection: fromSection?.name || "",
      toSection: toSection?.name || "",
      material: material?.name || "Unknown",
      createdAt: createdAt ? format(new Date(createdAt), "dd-MM-yyyy") : "-",
      updatedAt: updatedAt ? format(new Date(updatedAt), "dd-MM-yyyy") : "-"
    };
  });
  return XLSX.utils.json_to_sheet(formattedData, {
    header: ["referenceId", "type", "quantity", "fromSectionId", "toSectionId", "reason", "performedBy", "stockEntry", "fromSection", "toSection", "material", "createdAt", "updatedAt"]
  });
};
