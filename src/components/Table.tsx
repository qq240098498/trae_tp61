import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T, index: number) => string;
  empty?: ReactNode;
}

const alignClass = (a?: string) =>
  a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

export function Table<T>({ columns, data, rowKey, onRowClick, rowClassName, empty }: TableProps<T>) {
  return (
    <div className="scroll-area -mx-2 overflow-x-auto px-2">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-cream-300/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-faint",
                  alignClass(col.align),
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-ink-faint">
                {empty ?? "暂无数据"}
              </td>
            </tr>
          )}
          {data.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-cream-200/70 transition-colors",
                onRowClick && "cursor-pointer hover:bg-cream-100/60",
                rowClassName?.(row, i),
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-3 py-3 align-middle", alignClass(col.align), col.className)}>
                  {col.render ? col.render(row, i) : (row as Record<string, ReactNode>)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
