import React, { useCallback } from "react";
import * as XLSX from "xlsx";

// Define types for flexibility
interface ExportProps<T> {
  data: T[];
  fileName?: string;
  sheetName?: string;
  className?: string;
  buttonText?: string;
}

// Utility to convert data to worksheet
const createWorksheet = <T,>(data: T[]): XLSX.WorkSheet => {
  return XLSX.utils.json_to_sheet(data);
};

// Main Export component
const Export: React.FC<ExportProps<any>> = ({ data, fileName = "exported_data", sheetName = "Sheet1", className = "", buttonText = "Export to Excel" }) => {
  const handleExport = useCallback(() => {
    if (!data || data.length === 0) {
      console.warn("No data provided for export");
      return;
    }

    // Create worksheet from data
    const worksheet = createWorksheet(data);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }, [data, fileName, sheetName]);

  return (
    <button
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className={`
        px-4 py-2 bg-green-600 text-white rounded-md
        hover:bg-green-700 focus:outline-none focus:ring-2
        focus:ring-green-500 focus:ring-offset-2
        disabled:bg-gray-400 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {buttonText}
    </button>
  );
};

export default Export;
