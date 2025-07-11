import { format } from "date-fns";
import { Download } from "lucide-react";
import React, { useCallback } from "react";
import * as XLSX from "xlsx";
import { createWorksheet } from "../utils/sheets";

// Define types for flexibility
interface ExportProps<T> {
  data: T[];
  fileName?: string;
  sheetName?: string;
  className?: string;
  buttonText?: string;
  tableName?: string;
}

const Export: React.FC<ExportProps<any>> = ({ data, sheetName = "Sheet1", className = "", buttonText = "Export", tableName = "Table" }) => {
  const handleExport = useCallback(() => {
    if (!data || data.length === 0) {
      console.warn("No data provided for export");
      return;
    }

    // Create worksheet from formatted data
    const worksheet = createWorksheet(data);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate file name with date stamp
    const dateStamp = format(new Date(), "yyyy-MM-dd");
    const exportFileName = `${tableName}_${dateStamp}.xlsx`;

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, exportFileName);
  }, [data, sheetName, tableName]);

  return (
    // <button
    //   onClick={handleExport}
    //   disabled={!data || data.length === 0}
    //   className={`
    //     px-4 py-2 bg-blue-600 text-white rounded-md
    //     hover:bg-blue-700 focus:outline-none focus:ring-2
    //     focus:ring-blue-500 focus:ring-offset-2
    //     disabled:bg-gray-400 disabled:cursor-not-allowed
    //     transition-colors duration-200
    //     ${className}w
    //   `}
    // >
    //   {buttonText}
    // </button>
    <button
      onClick={handleExport}
      disabled={!data || data.length === 0}
      aria-label="Export table data to Excel"
      className={`
        relative flex items-center gap-2 px-4 py-2 text-sm font-medium
        text-white bg-gradient-to-r from-green-500 to-green-600
        border border-green-500/50 rounded-lg
        hover:from-green-600 hover:to-green-700
        hover:duration-300 hover:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
        disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300
        disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none
        transition-all duration-300 ease-in-out 
        dark:from-green-600 dark:to-green-700 dark:border-green-600/60
        dark:hover:from-green-700 dark:hover:to-green-800
        dark:focus:ring-green-500 dark:focus:ring-offset-gray-800
        dark:disabled:bg-gray-600 dark:disabled:text-gray-400
        ${className}
      `}
    >
      <Download className="w-4 h-4 transform transition-transform duration-300 group-hover:-translate-y-0.5" />
      {buttonText}
    </button>
    // <Button
    //   leftIcon={<Download className="w-4 h-4" />}
    //   variant="outline"
    //   onClick={handleExport}
    //   disabled={!data || data.length === 0}
    //   className={`
    //     px-4 py-2 bg-green-600 text-white rounded-md cursor-pointer
    //     hover:bg-green-700 focus:outline-none focus:ring-2
    //     focus:ring-green-500 focus:ring-offset-2 dark:focus:!ring-green-600 dark:focus:ring-offset-2 dark:active:!ring-green-600 dark:active:ring-offset-2
    //     disabled:bg-gray-400 disabled:cursor-not-allowed
    //     transition-colors duration-200 dark:!bg-green-500/6 dark:hover:!bg-green-600/35 dark:text-white dark:!border-green-600/45
    //     ${className}
    //   `}
    // >
    //   Export
    // </Button>
  );
};

export default Export;
