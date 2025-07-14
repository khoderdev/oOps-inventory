import { saveAs } from "file-saver";
import Papa from "papaparse";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import flattenRecipe from "../../utils/flattenRecipe";

type SupportedFileTypes = "csv" | "xlsx" | "json";

export const DataImporterExporter = ({ initialData = [] }: { initialData?: unknown[] }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<unknown[]>(initialData);
  const [headers, setHeaders] = useState<string[]>([]);

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext) return;

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
          const parsedData = results.data as unknown[];
          setHeaders(Object.keys(parsedData[0] || {}));
          setData(parsedData);
        }
      });
    } else if (ext === "xlsx") {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "buffer" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(ws);
      setHeaders(Object.keys(json[0] || {}));
      setData(json);
    } else if (ext === "json") {
      const text = await file.text();
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        setHeaders(Object.keys(json[0] || {}));
        setData(json);
      }
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const exportData = (type: SupportedFileTypes) => {
    if (!data.length) return;
    const flattenedData = data.map(flattenRecipe);
    const exportFileName = `exported_data.${type}`;

    if (type === "json") {
      // Pretty-printed JSON export with indentation
      const jsonString = JSON.stringify(flattenedData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      saveAs(blob, exportFileName);
    }

    if (type === "csv") {
      const csv = Papa.unparse(flattenedData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, exportFileName);
    }

    if (type === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(flattenedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([xlsxBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      saveAs(blob, exportFileName);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-xl font-semibold mb-4">Data Importer / Exporter</h2>

      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={triggerFileSelect} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition" type="button">
          📥 Import File
        </button>
        <button onClick={() => exportData("csv")} disabled={!data.length} className={`px-4 py-2 rounded-md transition ${data.length ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-300 text-green-700 cursor-not-allowed"}`} type="button">
          Export CSV
        </button>
        <button onClick={() => exportData("xlsx")} disabled={!data.length} className={`px-4 py-2 rounded-md transition ${data.length ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-indigo-300 text-indigo-700 cursor-not-allowed"}`} type="button">
          Export XLSX
        </button>
        <button onClick={() => exportData("json")} disabled={!data.length} className={`px-4 py-2 rounded-md transition ${data.length ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "bg-yellow-300 text-yellow-700 cursor-not-allowed"}`} type="button">
          Export JSON
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.json"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {data.length > 0 ? (
        <div className="overflow-x-auto max-h-96 border border-gray-200 dark:border-gray-700 rounded-md">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                {headers.map(key => (
                  <th key={key} className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  {headers.map(key => (
                    <td key={key} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 whitespace-pre-wrap break-words">
                      {String((row as any)[key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No data loaded. Import a file to get started.</p>
      )}
    </div>
  );
};
