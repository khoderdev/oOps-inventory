import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table";
import { clsx } from "clsx";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import Export from "../../lib/Export";
import "../../styles/table.css";

interface TableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  enableColumnResizing?: boolean;
  enableSorting?: boolean;
  maxHeight?: string;
  stickyHeader?: boolean;
  onRowClick?: (row: T) => void;
  showExport?: boolean; // New prop to toggle export button
}

function Table<T extends object>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  className,
  enableColumnResizing = true,
  enableSorting = true,
  maxHeight = "500px",
  stickyHeader = true,
  onRowClick,
  showExport = false // Default to false
}: TableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [isResizing, setIsResizing] = React.useState(false);
  const [resizingColumnId, setResizingColumnId] = React.useState<string | null>(null);
  const [hoveredColumnId, setHoveredColumnId] = React.useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing,
    enableSorting,
    defaultColumn: {
      minSize: 60,
      maxSize: 800,
      size: 150
    }
  });

  // Handle resize start/end for smooth UX
  const handleResizeStart = useCallback((columnId: string) => {
    setIsResizing(true);
    setResizingColumnId(columnId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.body.style.pointerEvents = "none";
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizingColumnId(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.body.style.pointerEvents = "";
  }, []);

  // Handle mouse events for resize handles
  const handleMouseEnterResize = useCallback(
    (columnId: string) => {
      if (!isResizing) {
        setHoveredColumnId(columnId);
      }
    },
    [isResizing]
  );

  const handleMouseLeaveResize = useCallback(() => {
    if (!isResizing) {
      setHoveredColumnId(null);
    }
  }, [isResizing]);

  // Cleanup on unmount and handle global mouse events
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isResizing) {
        handleResizeEnd();
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        e.preventDefault();
      }
    };

    if (isResizing) {
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("mousemove", handleGlobalMouseMove);
    }

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.style.pointerEvents = "";
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [isResizing, handleResizeEnd]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className={clsx("relative", className)}>
      {showExport && (
        <div className="flex justify-end mb-4">
          <Export data={data} fileName="table_export" sheetName="TableData" buttonText="Export" />
        </div>
      )}
      <div ref={containerRef} className={clsx("overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg", "transition-all duration-200 ease-in-out", isResizing && "select-none")}>
        <div className="overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent" style={{ maxHeight }}>
          <table
            ref={tableRef}
            className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            style={{
              width: table.getCenterTotalSize(),
              transition: isResizing ? "none" : "width 0.2s ease-in-out"
            }}
          >
            <thead className={clsx("bg-gray-50 dark:bg-gray-700 z-10", stickyHeader && "sticky top-0", "shadow-sm")}>
              {table.getHeaderGroups().map(headerGroup => (
                <tr
                  {...{
                    key: headerGroup.id,
                    className: "tr"
                  }}
                >
                  {headerGroup.headers.map(header => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const canResize = header.column.getCanResize();

                    return (
                      <th
                        {...{
                          key: header.id,
                          className: clsx("th px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", "border border-gray-200 dark:border-gray-700", "relative group transition-colors duration-150", canSort && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600", sorted && "bg-gray-100 dark:bg-gray-600"),
                          style: {
                            width: `calc(var(--header-${header?.id}-size) * 1px)`,
                            minWidth: header.column.columnDef.minSize || 60,
                            maxWidth: header.column.columnDef.maxSize || 800
                          },
                          onClick: canSort ? header.column.getToggleSortingHandler() : undefined
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 min-h-[20px]">
                          <div className="flex items-center gap-2 truncate">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</div>

                          {canSort && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {sorted === "asc" ? (
                                <ChevronUp className="w-4 h-4 text-blue-500" />
                              ) : sorted === "desc" ? (
                                <ChevronDown className="w-4 h-4 text-blue-500" />
                              ) : (
                                <div className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity">
                                  <ChevronUp className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {canResize && (
                          <div
                            ref={header.id === resizingColumnId ? resizeHandleRef : null}
                            {...{
                              onMouseDown: e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleResizeStart(header.id);
                                header.getResizeHandler()(e);
                              },
                              onDoubleClick: () => header.column.resetSize(),
                              onMouseEnter: () => handleMouseEnterResize(header.id),
                              onMouseLeave: handleMouseLeaveResize,
                              onTouchStart: e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleResizeStart(header.id);
                                header.getResizeHandler()(e);
                              },
                              className: clsx(
                                "resizer absolute right-0 top-0 h-full cursor-col-resize z-20",
                                "flex items-center justify-center transition-all duration-200",
                                {
                                  "w-1 bg-blue-500 opacity-100": resizingColumnId === header.id,
                                  "w-2 opacity-100": hoveredColumnId === header.id && !isResizing,
                                  "w-1 opacity-0 group-hover:opacity-60": hoveredColumnId !== header.id && resizingColumnId !== header.id,
                                  isResizing: header.column.getIsResizing()
                                },
                                "hover:bg-blue-400 hover:opacity-100"
                              ),
                              title: "Drag to resize column or double-click to auto-fit"
                            }}
                          >
                            {(hoveredColumnId === header.id || resizingColumnId === header.id) && <GripVertical className={clsx("w-3 h-3 transition-colors duration-200", resizingColumnId === header.id ? "text-white" : "text-gray-400 hover:text-white")} />}
                          </div>
                        )}

                        {canResize && resizingColumnId === header.id && <div className="absolute right-0 top-0 h-full w-0.5 bg-blue-500 shadow-lg z-30 animate-pulse" />}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, index) => (
                  <tr key={row.id} onClick={() => onRowClick?.(row.original)} className={clsx("cursor-pointer transition-colors duration-150 ease-in-out", "hover:bg-gray-50 dark:hover:bg-gray-700", "border-b border-gray-100 dark:border-gray-700 last:border-b-0", index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/30 dark:bg-gray-800/50")}>
                    {row.getVisibleCells().map(cell => {
                      const columnMeta = cell.column.columnDef.meta as { align?: "left" | "center" | "right" } | undefined;

                      return (
                        <td
                          key={cell.id}
                          data-column-id={cell.column.id}
                          style={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.columnDef.minSize || 60,
                            maxWidth: cell.column.columnDef.maxSize || 800
                          }}
                          className={clsx("px-4 py-3 text-sm text-gray-900 dark:text-gray-100", "transition-all duration-150 ease-in-out", "border-r border-gray-100 dark:border-gray-700 last:border-r-0", columnMeta?.align === "center" && "text-center", columnMeta?.align === "right" && "text-right", "overflow-hidden")}
                        >
                          <div className="truncate" title={typeof cell.getValue() === "string" ? (cell.getValue() as string) : undefined}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Table;
