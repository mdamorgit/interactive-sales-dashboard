import { useState, useMemo } from "react";
import { Order } from "../types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  LabelList,
} from "recharts";
import {
  aggregateTimelineData,
  aggregateProductData,
  aggregatePaymentData,
  formatCurrency,
} from "../utils";
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, HelpCircle, TrendingUp } from "lucide-react";

interface ChartsSectionProps {
  filteredOrders: Order[];
  activeSection?: "all" | "trends" | "payments" | "products";
}

export default function ChartsSection({ filteredOrders, activeSection = "all" }: ChartsSectionProps) {
  const [timelineType, setTimelineType] = useState<"both" | "revenue" | "volume">("both");
  const [timeResolution, setTimeResolution] = useState<"daily" | "weekly">("daily");
  
  // Trend Projection State
  const [showTrend, setShowTrend] = useState<boolean>(true);
  const [forecastPeriods, setForecastPeriods] = useState<number>(5);

  // Layout preference states (Horizontal Bar, Vertical Bar, Pie Chart)
  const [productChartStyle, setProductChartStyle] = useState<"bar-horizontal" | "bar-vertical" | "pie">("bar-horizontal");
  const [paymentChartStyle, setPaymentChartStyle] = useState<"pie" | "bar-horizontal" | "bar-vertical">("pie");

  // 1. TIMELINE DATA (Aggregated and sorted)
  const rawTimeline = useMemo(() => aggregateTimelineData(filteredOrders), [filteredOrders]);

  const timelineData = useMemo(() => {
    if (timeResolution === "daily" || rawTimeline.length < 1) {
      return rawTimeline;
    }

    // Weekly bucketing: Group dates by starting Mon/Sun
    interface WeeklyGroup {
      date: string;
      rawDate: string;
      revenue: number;
      transactions: number;
    }
    const weeklyMap: { [weekKey: string]: WeeklyGroup } = {};
    
    rawTimeline.forEach(day => {
      const dateObj = new Date(day.date + "T00:00:00");
      const dayOfWeek = dateObj.getDay();
      // Backtrack to Sunday
      const sundayDate = new Date(dateObj);
      sundayDate.setDate(dateObj.getDate() - dayOfWeek);
      
      const weekStr = sundayDate.toISOString().split("T")[0];
      const label = `W/C ${weekStr.substring(5)}`; // Week Commencing "08-15" etc.

      if (!weeklyMap[weekStr]) {
        weeklyMap[weekStr] = { date: label, rawDate: weekStr, revenue: 0, transactions: 0 };
      }
      weeklyMap[weekStr].revenue += day.revenue;
      weeklyMap[weekStr].transactions += day.transactions;
    });

    return Object.values(weeklyMap).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [rawTimeline, timeResolution]);

  // Helper function to calculate a simple linear regression: y = mx + c
  const calculateRegression = (dataPoints: { x: number; y: number }[]) => {
    const n = dataPoints.length;
    if (n < 2) return { m: 0, c: 0 };

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += dataPoints[i].x;
      sumY += dataPoints[i].y;
      sumXY += dataPoints[i].x * dataPoints[i].y;
      sumX2 += dataPoints[i].x * dataPoints[i].x;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return { m: 0, c: 0 };

    const m = (n * sumXY - sumX * sumY) / denominator;
    const c = (sumY - m * sumX) / n;

    return { m, c };
  };

  // 1b. Compute final timeline rendering data (with trend projections appended)
  const finalTimelineData = useMemo(() => {
    if (timelineData.length < 2) {
      return timelineData;
    }

    const n = timelineData.length;
    
    // Fit lines over indices [0, N-1]
    const revPoints = timelineData.map((d, i) => ({ x: i, y: d.revenue }));
    const { m: mRev, c: cRev } = calculateRegression(revPoints);

    const volPoints = timelineData.map((d, i) => ({ x: i, y: d.transactions }));
    const { m: mVol, c: cVol } = calculateRegression(volPoints);

    // Build array with mapped regression points over existing timeframe
    const baseWithTrend = timelineData.map((d, idx) => ({
      ...d,
      revenueTrend: Math.max(0, mRev * idx + cRev),
      transactionsTrend: Math.max(0, mVol * idx + cVol),
    }));

    if (!showTrend) {
      return baseWithTrend;
    }

    // Project points into future forecast periods
    const lastItem = timelineData[n - 1];
    const extended = [...baseWithTrend];
    const lastDateStr = timeResolution === "daily" ? lastItem.date : ((lastItem as any).rawDate || "2025-10-05");
    const baseDate = new Date(lastDateStr + "T00:00:00");

    for (let i = 1; i <= forecastPeriods; i++) {
      const idx = n - 1 + i;
      const nextDate = new Date(baseDate);
      
      let forecastLabel = "";
      if (timeResolution === "daily") {
        nextDate.setDate(baseDate.getDate() + i);
        const formatted = nextDate.toISOString().split("T")[0];
        forecastLabel = `${formatted.substring(5)}*`;
      } else {
        nextDate.setDate(baseDate.getDate() + i * 7);
        const formatted = nextDate.toISOString().split("T")[0];
        forecastLabel = `W/C ${formatted.substring(5)}*`;
      }

      extended.push({
        date: forecastLabel,
        revenue: undefined as any,
        transactions: undefined as any,
        revenueTrend: Math.max(0, mRev * idx + cRev),
        transactionsTrend: Math.max(0, mVol * idx + cVol),
      } as any);
    }

    return extended;
  }, [timelineData, showTrend, forecastPeriods, timeResolution]);

  // Compute calculated trending insights summaries
  const trendMetrics = useMemo(() => {
    if (timelineData.length < 2) return null;

    const n = timelineData.length;
    const revPoints = timelineData.map((d, i) => ({ x: i, y: d.revenue }));
    const { m: mRev, c: cRev } = calculateRegression(revPoints);

    const volPoints = timelineData.map((d, i) => ({ x: i, y: d.transactions }));
    const { m: mVol, c: cVol } = calculateRegression(volPoints);

    // Cumulative sum of projections
    let projectedRevSum = 0;
    for (let i = 1; i <= forecastPeriods; i++) {
      const idx = n - 1 + i;
      projectedRevSum += Math.max(0, mRev * idx + cRev);
    }

    const direction = mRev > 0 ? "upward" : mRev < 0 ? "downward" : "flat";

    return {
      mRev,
      mVol,
      direction,
      projectedRevSum,
    };
  }, [timelineData, forecastPeriods]);

  // 2. PRODUCT DATA (Aggregated and sorted)
  const productData = useMemo(() => aggregateProductData(filteredOrders), [filteredOrders]);

  // 3. PAYMENT METHOD DATA
  const paymentData = useMemo(() => aggregatePaymentData(filteredOrders), [filteredOrders]);

  // Elegant Slate / Indigo theme colors
  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#3b82f6", "#06b6d4"];

  return (
    <div className={activeSection === "all" ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "w-full"}>
      {/* 1. Combined Timeline Chart (Takes 2 Columns on desktop) */}
      {(activeSection === "all" || activeSection === "trends") && (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between ${activeSection === "trends" ? "w-full animate-fadeIn" : "lg:col-span-2"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-50">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Sales & Activity Trends
              {showTrend && (
                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                  Regression Forecast Active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological sales progression & transaction frequencies</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Resolution Switcher */}
            <div className="flex bg-slate-100/80 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setTimeResolution("daily")}
                className={`px-2 py-1 rounded-md transition font-medium ${
                  timeResolution === "daily" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeResolution("weekly")}
                className={`px-2 py-1 rounded-md transition font-medium ${
                  timeResolution === "weekly" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Weekly
              </button>
            </div>

            {/* Metrics Toggle */}
            <div className="flex bg-slate-100/80 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setTimelineType("both")}
                className={`px-2 py-1 rounded-md transition ${
                  timelineType === "both" ? "bg-indigo-600 text-white font-medium" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTimelineType("revenue")}
                className={`px-2 py-1 rounded-md transition ${
                  timelineType === "revenue" ? "bg-indigo-600 text-white font-medium" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setTimelineType("volume")}
                className={`px-2 py-1 rounded-md transition ${
                  timelineType === "volume" ? "bg-indigo-600 text-white font-medium" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Volume
              </button>
            </div>

            {/* Trend Forecast Switcher */}
            <button
              onClick={() => setShowTrend(!showTrend)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                showTrend
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Forecast</span>
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          {finalTimelineData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <span>No timeline records map current filters.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={finalTimelineData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  tickFormatter={tick => {
                    if (tick.endsWith("*")) {
                      return tick; // Keep projection suffix indicator
                    }
                    return tick.length > 10 ? tick.substring(5) : tick;
                  }}
                />
                
                {/* Dual Axes */}
                {(timelineType === "both" || timelineType === "revenue") && (
                  <YAxis
                    yAxisId="rev"
                    stroke="#4f46e5"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={val => `$${val}`}
                  />
                )}
                {(timelineType === "both" || timelineType === "volume") && (
                  <YAxis
                    yAxisId="vol"
                    orientation="right"
                    stroke="#10b981"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={val => val}
                  />
                )}

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const isForecast = payload[0].payload.date.endsWith("*");
                      return (
                        <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-3 shadow-lg text-xs space-y-1.5 font-sans">
                          <p className="font-semibold border-b border-slate-800 pb-1 mr-4">
                            {payload[0].payload.date} {isForecast ? "(Projected Forecast)" : ""}
                          </p>
                          {payload.map((item, idx) => (
                            <p key={idx} className="flex justify-between items-center gap-6">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                {item.name}:
                              </span>
                              <span className="font-mono font-medium">
                                {item.name?.toLowerCase().includes("revenue") || item.name?.toLowerCase().includes("trend")
                                  ? formatCurrency(Number(item.value))
                                  : item.value}
                              </span>
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />

                {/* Combined area/bar for values */}
                {(timelineType === "both" || timelineType === "revenue") && (
                  <Area
                    yAxisId="rev"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue Amount"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                    connectNulls={false}
                  />
                )}
                
                {(timelineType === "both" || timelineType === "volume") && (
                  <Line
                    yAxisId="vol"
                    type="monotone"
                    dataKey="transactions"
                    name="Transaction Count"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1.5 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                )}

                {/* Trend Projection lines overlays */}
                {showTrend && (timelineType === "both" || timelineType === "revenue") && (
                  <Line
                    yAxisId="rev"
                    type="monotone"
                    dataKey="revenueTrend"
                    name="Revenue Trend (Proj)"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={false}
                  />
                )}

                {showTrend && (timelineType === "both" || timelineType === "volume") && (
                  <Line
                    yAxisId="vol"
                    type="monotone"
                    dataKey="transactionsTrend"
                    name="Volume Trend (Proj)"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Dynamic Trend Regression Details banner */}
        {showTrend && trendMetrics && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl animate-fadeIn">
            {/* Growth trajectory */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">
                Growth trajectory ({timeResolution})
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  trendMetrics.direction === "upward"
                    ? "bg-emerald-50 text-emerald-700"
                    : trendMetrics.direction === "downward"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-700"
                }`}>
                  <TrendingUp className={`w-3 h-3 ${trendMetrics.direction === "downward" ? "rotate-90" : ""}`} />
                  {trendMetrics.direction === "upward" ? "Positive" : trendMetrics.direction === "downward" ? "Negative" : "Stable"}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {trendMetrics.mRev >= 0 ? "+" : ""}{formatCurrency(trendMetrics.mRev)} / {timeResolution === "daily" ? "day" : "wk"}
                </span>
              </div>
            </div>

            {/* Projected cumulative sales */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">
                Projected cumulative sales
              </span>
              <div className="text-xs font-bold text-slate-800">
                {formatCurrency(trendMetrics.projectedRevSum)}
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  over next {forecastPeriods} {timeResolution === "daily" ? "days" : "weeks"}
                </span>
              </div>
            </div>

            {/* Forecast horizon adjustment range slider */}
            <div className="space-y-1 sm:text-right">
              <div className="flex items-center justify-between sm:justify-end gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  Forecast Period:
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                  {forecastPeriods} {timeResolution === "daily" ? "days" : "weeks"}
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={15}
                value={forecastPeriods}
                onChange={(e) => setForecastPeriods(parseInt(e.target.value) || 5)}
                className="w-full sm:max-w-44 accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
      )}

      {/* 2. Payment Method Preferences (Takes 1 Columns on desktop) */}
      {(activeSection === "all" || activeSection === "payments") && (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between ${activeSection === "payments" ? "w-full max-w-4xl mx-auto animate-fadeIn" : ""}`}>
        <div className="flex items-start justify-between gap-4 mb-2 pb-2 border-b border-slate-50/80">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-emerald-500" />
              Payment Portfolios
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Share of transactions by merchant types</p>
          </div>
          <div className="flex bg-slate-100/80 p-0.5 rounded-lg text-[10px] shrink-0">
            <button
              onClick={() => setPaymentChartStyle("pie")}
              className={`p-1 px-2 rounded-md transition-all flex items-center gap-1 font-semibold ${
                paymentChartStyle === "pie" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
              title="Pie Chart"
            >
              <PieIcon className="w-3 h-3" />
              <span>Pie</span>
            </button>
            <button
              onClick={() => setPaymentChartStyle("bar-horizontal")}
              className={`p-1 px-2 rounded-md transition-all flex items-center gap-1 font-semibold ${
                paymentChartStyle === "bar-horizontal" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
              title="Horizontal Bar"
            >
              <BarChart3 className="w-3 h-3 rotate-90" />
              <span>Bar</span>
            </button>
          </div>
        </div>

        <div className="h-56 w-full flex items-center justify-center relative">
          {paymentData.length === 0 ? (
            <div className="text-slate-400 text-xs text-center">No payment preference records found.</div>
          ) : paymentChartStyle === "pie" ? (
            <div className="relative w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [
                      `${formatCurrency(Number(val))} (${paymentData.find(e => e.name === name)?.count} orders)`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "10px",
                      fontSize: "11px",
                      border: "none",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center stat indicator */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Unique Methods</p>
                <p className="text-lg font-bold text-slate-700">{paymentData.length}</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={paymentData}
                  layout="vertical"
                  margin={{ top: 10, right: 65, left: 75, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `${formatCurrency(Number(val))} (${paymentData.find(e => e.name === name)?.count} orders)`,
                      "Amount",
                    ]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "10px",
                      fontSize: "11px",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(val: any) => formatCurrency(Number(val))}
                      style={{ fontSize: "10px", fill: "#475569", fontWeight: "600" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Legend listing */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-50 mt-1">
          {paymentData.map((method, index) => {
            const pct = filteredOrders.length
              ? Math.round((method.count / filteredOrders.length) * 100)
              : 0;
            return (
              <div key={method.name} className="flex items-center gap-1.5 justify-start text-xs text-slate-600">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate max-w-20" title={method.name}>
                  {method.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* 3. Product Sales Distribution (Takes Full Width 3 Columns on desktop for clarity) */}
      {(activeSection === "all" || activeSection === "products") && (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs p-5 ${activeSection === "products" ? "w-full animate-fadeIn" : "lg:col-span-3"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-1.5">
              <LineIcon className="w-4 h-4 text-indigo-500" />
              Earning and Volume Contribution by Product Type
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Which apparel category is generating the main profits?</p>
          </div>

          <div className="flex bg-slate-100/80 p-0.5 rounded-lg text-xs shrink-0 self-start sm:self-center">
            <button
              onClick={() => setProductChartStyle("bar-horizontal")}
              className={`p-1 px-2.5 rounded-md transition-all flex items-center gap-1 font-semibold ${
                productChartStyle === "bar-horizontal" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 rotate-90" />
              <span>Horizontal Bar</span>
            </button>
            <button
              onClick={() => setProductChartStyle("bar-vertical")}
              className={`p-1 px-2.5 rounded-md transition-all flex items-center gap-1 font-semibold ${
                productChartStyle === "bar-vertical" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Vertical Bar</span>
            </button>
            <button
              onClick={() => setProductChartStyle("pie")}
              className={`p-1 px-2.5 rounded-md transition-all flex items-center gap-1 font-semibold ${
                productChartStyle === "pie" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Pie Chart</span>
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          {productData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No product breakdown data meets filters.
            </div>
          ) : productChartStyle === "bar-horizontal" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productData}
                layout="vertical"
                margin={{ top: 10, right: 85, left: 135, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={val => `$${val}`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={125}
                />
                <Tooltip
                  formatter={(val, name) => [
                    formatCurrency(Number(val)),
                    name === "value" ? "Total Revenue Generated" : "Count Sold",
                  ]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    borderRadius: "10px",
                    fontSize: "11px",
                    border: "none",
                  }}
                />
                <Bar dataKey="value" name="Revenue Amount ($)" fill="#6366f1" radius={[0, 4, 4, 0]}>
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(val: any) => formatCurrency(Number(val))}
                    style={{ fontSize: "10px", fill: "#475569", fontWeight: "600" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : productChartStyle === "pie" ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name.length > 15 ? name.slice(0, 13) + '..' : name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [formatCurrency(Number(val)), "Revenue"]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    borderRadius: "10px",
                    fontSize: "11px",
                    border: "none",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productData}
                layout="horizontal"
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tickFormatter={value => (value.length > 18 ? `${value.slice(0, 15)}...` : value)}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `$${val}`}
                />
                <Tooltip
                  formatter={(val, name) => [
                    formatCurrency(Number(val)),
                    name === "value" ? "Total Revenue Generated" : "Count Sold",
                  ]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    borderRadius: "10px",
                    fontSize: "11px",
                    border: "none",
                  }}
                />
                <Bar dataKey="value" name="Revenue Amount ($)" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
