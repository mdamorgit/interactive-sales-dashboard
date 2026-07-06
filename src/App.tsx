import { useState, useMemo, useEffect } from "react";
import { Order, FilterState } from "./types";
import { INITIAL_CSV, parseCSV } from "./data";
import { calculateStats } from "./utils";
import FilterPanel from "./components/FilterPanel";
import MetricCards from "./components/MetricCards";
import ChartsSection from "./components/ChartsSection";
import HeatmapCard from "./components/HeatmapCard";
import OrderManagerTable from "./components/OrderManagerTable";
import { AlertCircle, BarChart3, TrendingUp, Info, HelpCircle, RefreshCcw, Sun, FilterX, LayoutDashboard, Wallet, ShoppingBag, Grid, List } from "lucide-react";

export default function App() {
  // Active Navigation Tab landing page selection
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "payments" | "products" | "heatmap" | "ledger">("overview");

  // Master record database state
  const [orders, setOrders] = useState<Order[]>([]);

  // Selected heatmap coordinate cell drilldown state
  const [drilldownOrders, setDrilldownOrders] = useState<Order[] | null>(null);
  const [drilldownLabel, setDrilldownLabel] = useState<string | null>(null);

  // Initialize dataset from stored CSV
  useEffect(() => {
    const parsed = parseCSV(INITIAL_CSV);
    setOrders(parsed);
  }, []);

  // Compute dynamic categorical dimensions based on active list contents
  const allProducts = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.product))).sort();
  }, [orders]);

  const allPaymentMethods = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.paymentMethod || "Unknown"))).sort();
  }, [orders]);

  const priceRangeLimit = useMemo(() => {
    if (orders.length === 0) return { min: 0, max: 100 };
    const prices = orders.map(o => o.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [orders]);

  // Initial form values for customizable filters
  const initialFilterState = useMemo<FilterState>(() => {
    if (orders.length === 0) {
      return {
        startDate: "",
        endDate: "",
        selectedProducts: [],
        selectedPaymentMethods: [],
        minPrice: 0,
        maxPrice: 300,
        searchQuery: "",
      };
    }
    const dates = orders.map(o => o.date).sort();
    return {
      startDate: dates[0] || "",
      endDate: dates[dates.length - 1] || "",
      selectedProducts: [],
      selectedPaymentMethods: [],
      minPrice: priceRangeLimit.min,
      maxPrice: priceRangeLimit.max,
      searchQuery: "",
    };
  }, [orders, priceRangeLimit]);

  // Customizable filters active state
  const [filters, setFilters] = useState<FilterState>({
    startDate: "",
    endDate: "",
    selectedProducts: [],
    selectedPaymentMethods: [],
    minPrice: 0,
    maxPrice: 300,
    searchQuery: "",
  });

  // Ensure filter bounds update once the initial data loads
  useEffect(() => {
    if (orders.length > 0) {
      setFilters(initialFilterState);
    }
  }, [orders, initialFilterState]);

  // Handle fully resetting all filters
  const handleResetFilters = () => {
    setFilters(initialFilterState);
    setDrilldownOrders(null);
    setDrilldownLabel(null);
  };

  // Process data filters dynamically
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Apply heatmap cell drilldown coordinates filter first if chosen
    if (drilldownOrders !== null) {
      // Filter list to items targeting the drilldown scope
      const idSet = new Set(drilldownOrders.map(d => d.id));
      result = result.filter(o => idSet.has(o.id));
    }

    // Apply text inquiry queries
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        o =>
          o.product.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q)
      );
    }

    // Price Bounds
    result = result.filter(
      o => o.price >= filters.minPrice && o.price <= filters.maxPrice
    );

    // Categories selector list
    if (filters.selectedProducts.length > 0) {
      result = result.filter(o => filters.selectedProducts.includes(o.product));
    }

    // Payment category selector
    if (filters.selectedPaymentMethods.length > 0) {
      result = result.filter(o =>
        filters.selectedPaymentMethods.includes(o.paymentMethod)
      );
    }

    // Timeline Selector Bounds
    if (filters.startDate) {
      result = result.filter(o => o.date >= filters.startDate);
    }
    if (filters.endDate) {
      result = result.filter(o => o.date <= filters.endDate);
    }

    return result;
  }, [orders, filters, drilldownOrders]);

  // Compute stats on current sliced active dataset
  const activeStats = useMemo(() => {
    return calculateStats(filteredOrders);
  }, [filteredOrders]);

  // Handler for custom pasted CSV strings
  const handleUploadCSV = (csvText: string) => {
    const parsed = parseCSV(csvText);
    if (parsed.length > 0) {
      setOrders(parsed);
      setDrilldownOrders(null);
      setDrilldownLabel(null);
    } else {
      throw new Error("Unable to parse CSV lines.");
    }
  };

  // Helper to quickly reload sample startup mock dataset
  const handleReloadDefaultDataset = () => {
    if (confirm("Restore active state back to original sample transactions? All added or edited items will be reset.")) {
      const parsed = parseCSV(INITIAL_CSV);
      setOrders(parsed);
      setDrilldownOrders(null);
      setDrilldownLabel(null);
      // Wait for initial values to spread
      const dates = parsed.map(o => o.date).sort();
      const prices = parsed.map(o => o.price);
      const minP = Math.floor(Math.min(...prices));
      const maxP = Math.ceil(Math.max(...prices));
      setFilters({
        startDate: dates[0] || "",
        endDate: dates[dates.length - 1] || "",
        selectedProducts: [],
        selectedPaymentMethods: [],
        minPrice: minP,
        maxPrice: maxP,
        searchQuery: "",
      });
    }
  };

  // Trigger when heatmap coordinates are clicked
  const handleHeatmapCellSelection = (
    cellOrders: Order[] | null,
    label: string | null
  ) => {
    setDrilldownOrders(cellOrders);
    setDrilldownLabel(label);
  };

  // Handler to drop active cell coordinates drilldown specifically
  const handleClearCellDrilldown = () => {
    setDrilldownOrders(null);
    setDrilldownLabel(null);
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: LayoutDashboard },
    { id: "trends", name: "Sales & Activity Trends", icon: TrendingUp },
    { id: "payments", name: "Payment Portfolios", icon: Wallet },
    { id: "products", name: "Product Breakdown", icon: ShoppingBag },
    { id: "heatmap", name: "Correlation Heatmap", icon: Grid },
    { id: "ledger", name: "Transaction Ledger", icon: List },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased">
      {/* Visual Navigation Header Banner with Integrated Sub-Nav Tab bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Interactive Sales Dashboard</h1>
              <p className="text-xs text-slate-400">Real-time apparel sales analysis & transactional KPIs</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Memory Storage
            </span>
          </div>
        </div>

        {/* Dynamic Navigation Row */}
        <div className="border-t border-slate-100 bg-slate-50/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 py-1.5 overflow-x-auto scrollbar-none" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer select-none shrink-0 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/75"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Grid Viewport content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dynamic Filters Area */}
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          allProducts={allProducts}
          allPaymentMethods={allPaymentMethods}
          priceRangeLimit={priceRangeLimit}
          onReset={handleResetFilters}
          filteredCount={filteredOrders.length}
          totalCount={orders.length}
        />

        {/* Floating Cell Filter Drilldown Notice if chosen in Heatmap */}
        {drilldownLabel && (
          <div className="bg-indigo-600 text-white rounded-2xl p-5 shadow-lg shadow-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slideDown">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/50 rounded-xl shrink-0 mt-0.5">
                <Info className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight">Drill-Down Focus Isolation Mode</p>
                <p className="text-xs text-indigo-100 mt-1">
                  You have clicked a heatmap coordinate. All charts, stats cards, and table data entries are currently isolated to: <span className="underline font-semibold text-white">{drilldownLabel}</span>.
                </p>
              </div>
            </div>
            <button
              onClick={handleClearCellDrilldown}
              className="bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 transition"
            >
              <FilterX className="w-4 h-4" />
              Clear Heatmap Isolation
            </button>
          </div>
        )}

        {/* Premium Core KPI cards - Only displayed on Overview */}
        {activeTab === "overview" && (
          <MetricCards stats={activeStats} />
        )}

        {/* 1, 2, 3. Graphical Sections (Trends, Payments, Products) */}
        {(activeTab === "overview" || activeTab === "trends" || activeTab === "payments" || activeTab === "products") && (
          <ChartsSection
            filteredOrders={filteredOrders}
            activeSection={
              activeTab === "overview"
                ? "all"
                : activeTab === "trends"
                ? "trends"
                : activeTab === "payments"
                ? "payments"
                : "products"
            }
          />
        )}

        {/* 4. Heatmap correlation grid */}
        {(activeTab === "overview" || activeTab === "heatmap") && (
          <HeatmapCard orders={orders} onCellSelect={handleHeatmapCellSelection} />
        )}

        {/* 5. Dynamic Table & CRUD order manager ledger */}
        {(activeTab === "overview" || activeTab === "ledger") && (
          <OrderManagerTable
            orders={orders}
            setOrders={setOrders}
            filteredOrders={filteredOrders}
            onLoadDefaultCSV={handleReloadDefaultDataset}
            onUploadCSV={handleUploadCSV}
          />
        )}

      </main>

      {/* Humble footer */}
      <footer className="border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-400 font-mono mt-12 select-none">
        <p>&copy; Interactive Sales Dashboard. Configured for Real-time App analytics.</p>
      </footer>
    </div>
  );
}
