import { useState, useMemo } from "react";
import { Order } from "../types";
import { generateHeatmapData, HeatmapCell, formatCurrency } from "../utils";
import { Grid, Eye, MousePointerClick, RefreshCw, X } from "lucide-react";

interface HeatmapCardProps {
  orders: Order[];
  onCellSelect?: (cellOrders: Order[] | null, label: string | null) => void;
}

export default function HeatmapCard({ orders, onCellSelect }: HeatmapCardProps) {
  const [heatmapType, setHeatmapType] = useState<"day_product" | "payment_product">("day_product");
  const [colorMetric, setColorMetric] = useState<"revenue" | "count">("revenue");
  
  // Track selected active coordinate cell for visual highlighted border
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);

  const heatmapData = useMemo(() => {
    return generateHeatmapData(orders, heatmapType);
  }, [orders, heatmapType]);

  const { xLabels, yLabels, cells, maxRevenue, maxCount } = heatmapData;

  // Find cell object from x and y raw coordinates
  const getCell = (x: string, y: string): HeatmapCell | undefined => {
    return cells.find(c => c.xSource === x && c.ySource === y);
  };

  // Convert cell values to appropriate Tailwind opacity backgrounds
  const getCellBgStyle = (cell: HeatmapCell | undefined) => {
    if (!cell || cell.count === 0) {
      return { backgroundColor: "rgba(241, 245, 249, 0.5)", color: "#94a3b8" }; // light slate grey
    }

    // Scale logic
    let ratio = 0;
    if (colorMetric === "revenue") {
      ratio = maxRevenue > 0 ? cell.revenue / maxRevenue : 0;
    } else {
      ratio = maxCount > 0 ? cell.count / maxCount : 0;
    }

    // Enforce lower bound for visibility of items > 0
    const intensity = Math.max(0.12, Math.min(1, ratio));

    // Choose elegant Indigo hues
    return {
      backgroundColor: `rgba(99, 102, 241, ${intensity})`,
      color: intensity > 0.5 ? "#ffffff" : "#1e1b4b"
    };
  };

  const handleCellClick = (x: string, y: string) => {
    const cell = getCell(x, y);
    const key = `${x}||${y}`;

    if (selectedCellKey === key) {
      // Toggle off
      setSelectedCellKey(null);
      if (onCellSelect) onCellSelect(null, null);
    } else {
      setSelectedCellKey(key);
      if (onCellSelect && cell) {
        const label = `${heatmapType === "day_product" ? "Day" : "Method"}: ${x} • Product: ${y}`;
        onCellSelect(cell.orders, label);
      }
    }
  };

  const handleResetDrilldown = () => {
    setSelectedCellKey(null);
    if (onCellSelect) onCellSelect(null, null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
      {/* Header controls with toggle choices */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-1.5">
            <Grid className="w-4.5 h-4.5 text-indigo-500" />
            Correlation Heatmap
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Analyze intersections of transactional variables. Click squares to drill down.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Axis Choice */}
          <div className="flex bg-slate-100/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => {
                setHeatmapType("day_product");
                handleResetDrilldown();
              }}
              className={`px-2 py-1.5 rounded-md transition font-medium ${
                heatmapType === "day_product" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Day of Week vs Product
            </button>
            <button
              onClick={() => {
                setHeatmapType("payment_product");
                handleResetDrilldown();
              }}
              className={`px-2 py-1.5 rounded-md transition font-medium ${
                heatmapType === "payment_product" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Payment vs Product
            </button>
          </div>

          {/* Metric Toggle */}
          <div className="flex bg-slate-100/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setColorMetric("revenue")}
              className={`px-2 py-1.5 rounded-md transition font-medium ${
                colorMetric === "revenue" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
              title="Color scale relative to Revenue Generated"
            >
              Revenue ($)
            </button>
            <button
              onClick={() => setColorMetric("count")}
              className={`px-2 py-1.5 rounded-md transition font-medium ${
                colorMetric === "count" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
              title="Color scale relative to Quantity Sold"
            >
              Volume (Qty)
            </button>
          </div>
        </div>
      </div>

      {/* Selected Drilldown Notice */}
      {selectedCellKey && (
        <div className="mb-4 bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-indigo-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>
              Active Filter:{" "}
              <strong className="font-semibold text-indigo-900">
                {selectedCellKey.split("||").join(" x ")}
              </strong>
            </span>
          </div>
          <button
            onClick={handleResetDrilldown}
            className="p-1 rounded-full text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 transition"
            title="Clear drilldown filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid Canvas Wrapper */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[640px]">
          {/* Header Row */}
          <div className="flex items-center border-b border-slate-50 pb-2">
            {/* Corner Cell Label */}
            <div className="w-[180px] text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              {heatmapType === "day_product" ? "Product \\ Day" : "Product \\ Pay Option"}
            </div>

            {/* X Axis Columns */}
            <div className="flex-1 flex justify-around">
              {xLabels.map(x => (
                <div
                  key={x}
                  className="flex-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate px-1"
                >
                  {x}
                </div>
              ))}
            </div>
          </div>

          {/* Matrix Rows */}
          <div className="divide-y divide-slate-100 mt-2">
            {yLabels.map(y => (
              <div key={y} className="flex items-center py-2.5 transition hover:bg-slate-50/50">
                {/* Y Axis Row Label */}
                <div className="w-[180px] text-xs font-semibold text-slate-600 truncate pr-3 pl-1" title={y}>
                  {y}
                </div>

                {/* X Cells for Row */}
                <div className="flex-1 flex gap-2">
                  {xLabels.map(x => {
                    const cell = getCell(x, y);
                    const cellStyles = getCellBgStyle(cell);
                    const isSelected = selectedCellKey === `${x}||${y}`;
                    const hasValue = cell && cell.count > 0;

                    return (
                      <div
                        key={`${x}-${y}`}
                        onClick={() => handleCellClick(x, y)}
                        style={cellStyles}
                        className={`flex-1 aspect-video sm:aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative group select-none ${
                          isSelected
                            ? "ring-3 ring-indigo-600 ring-offset-2 scale-[1.05] z-10 shadow-sm"
                            : "hover:scale-[1.03] hover:shadow-xs"
                        }`}
                      >
                        {/* Display Value based on metric */}
                        <span className="text-xs font-bold font-mono">
                          {hasValue
                            ? colorMetric === "revenue"
                              ? `$${Math.round(cell.revenue)}`
                              : cell.count
                            : "-"}
                        </span>

                        {/* HOVER TOOLTIP FLOATER */}
                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950 text-white rounded-xl p-3 shadow-xl z-50 text-xs w-60 space-y-1.5 transition-all duration-200 ease-out delay-100">
                          <p className="font-bold border-b border-slate-800 pb-1 text-[11px] text-slate-300">
                            {x} &times; {y}
                          </p>
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-slate-400">Total revenue:</span>
                            <span className="text-white font-medium">{formatCurrency(cell?.revenue || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-slate-400">Total orders:</span>
                            <span className="text-emerald-400 font-semibold">{cell?.count || 0} items</span>
                          </div>
                          {hasValue && (
                            <p className="text-[9px] text-indigo-300 italic pt-1 flex items-center gap-1.5 border-t border-slate-800/80">
                              <MousePointerClick className="w-2.5 h-2.5" />
                              Click cell to isolate these orders
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Color Scale Legend */}
      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-medium">
        <span>Low Concentration</span>
        <div className="flex gap-1 h-2.5 w-32 rounded-full overflow-hidden">
          <div className="flex-1 bg-indigo-50" />
          <div className="flex-1 bg-indigo-200" />
          <div className="flex-1 bg-indigo-400" />
          <div className="flex-1 bg-indigo-600" />
          <div className="flex-1 bg-indigo-800" />
        </div>
        <span>High Concentration</span>
      </div>
    </div>
  );
}
