import React, { useState, useEffect, useRef } from "react";
import { FilterState, Order } from "../types";
import { Search, RotateCcw, Calendar, DollarSign, Wallet, ShoppingBag, ChevronDown } from "lucide-react";
import { formatCurrency } from "../utils";

interface FilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  allProducts: string[];
  allPaymentMethods: string[];
  priceRangeLimit: { min: number; max: number };
  onReset: () => void;
  filteredCount: number;
  totalCount: number;
}

export default function FilterPanel({
  filters,
  setFilters,
  allProducts,
  allPaymentMethods,
  priceRangeLimit,
  onReset,
  filteredCount,
  totalCount,
}: FilterPanelProps) {
  // Dropdown states
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isDatesOpen, setIsDatesOpen] = useState(false);

  // Refs for click outside handling
  const productsRef = useRef<HTMLDivElement>(null);
  const paymentsRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (productsRef.current && !productsRef.current.contains(target)) {
        setIsProductsOpen(false);
      }
      if (paymentsRef.current && !paymentsRef.current.contains(target)) {
        setIsPaymentsOpen(false);
      }
      if (priceRef.current && !priceRef.current.contains(target)) {
        setIsPriceOpen(false);
      }
      if (datesRef.current && !datesRef.current.contains(target)) {
        setIsDatesOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle unique product in multi-select list
  const handleProductToggle = (product: string) => {
    setFilters(prev => {
      const alreadySelected = prev.selectedProducts.includes(product);
      const nextProducts = alreadySelected
        ? prev.selectedProducts.filter(p => p !== product)
        : [...prev.selectedProducts, product];
      return { ...prev, selectedProducts: nextProducts };
    });
  };

  // Toggle payment methods
  const handlePaymentToggle = (method: string) => {
    setFilters(prev => {
      const alreadySelected = prev.selectedPaymentMethods.includes(method);
      const nextMethods = alreadySelected
        ? prev.selectedPaymentMethods.filter(m => m !== method)
        : [...prev.selectedPaymentMethods, method];
      return { ...prev, selectedPaymentMethods: nextMethods };
    });
  };

  // Calculate customized labels based on selection states
  const productLabel = filters.selectedProducts.length === 0
    ? "All Products"
    : filters.selectedProducts.length === allProducts.length
    ? "All Products"
    : filters.selectedProducts.length === 1
    ? filters.selectedProducts[0]
    : `${filters.selectedProducts.length} Products`;

  const paymentLabel = filters.selectedPaymentMethods.length === 0
    ? "All Payments"
    : filters.selectedPaymentMethods.length === allPaymentMethods.length
    ? "All Payments"
    : filters.selectedPaymentMethods.length === 1
    ? filters.selectedPaymentMethods[0]
    : `${filters.selectedPaymentMethods.length} Methods`;

  const isPriceModified = filters.maxPrice !== priceRangeLimit.max || filters.minPrice !== priceRangeLimit.min;
  const priceLabel = isPriceModified
    ? `Under ${formatCurrency(filters.maxPrice)}`
    : "Price Range";

  const isDateModified = filters.startDate !== "" || filters.endDate !== "";
  const dateLabel = isDateModified
    ? `${filters.startDate || "Start"} to ${filters.endDate || "Present"}`
    : "Date Range";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-5">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Analytical Filters</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Refining <span className="font-medium text-indigo-600">{filteredCount}</span> of {totalCount} records
          </p>
        </div>
      </div>

      {/* Grid container with search input and dropdown filter widgets side by side */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Instant Search Bar */}
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={e => setFilters(p => ({ ...p, searchQuery: e.target.value }))}
              placeholder="Product name or order #..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition placeholder:text-slate-300 bg-slate-50/50 hover:bg-slate-50/10 h-10"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Dynamic Filters Dropdowns Buttons Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Products Dropdown */}
          <div className="relative" ref={productsRef}>
            <button
              onClick={() => {
                setIsProductsOpen(!isProductsOpen);
                setIsPaymentsOpen(false);
                setIsPriceOpen(false);
                setIsDatesOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer select-none h-10 ${
                filters.selectedProducts.length > 0
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-current" />
              <span className="truncate max-w-[124px] inline-block">{productLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${isProductsOpen ? "rotate-180" : ""}`} />
            </button>

            {isProductsOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-3 space-y-1 max-h-64 overflow-y-auto scrollbar-thin animate-fadeIn">
                <div className="text-[10px] uppercase font-bold text-slate-450 px-2 py-1 flex justify-between items-center border-b border-slate-50 mb-1.5">
                  <span>Products</span>
                  {filters.selectedProducts.length > 0 && (
                    <button
                      onClick={() => setFilters(p => ({ ...p, selectedProducts: [] }))}
                      className="text-indigo-600 lowercase font-bold hover:underline"
                    >
                      clear
                    </button>
                  )}
                </div>

                <label
                  className={`flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-xl cursor-pointer transition select-none mb-1 border-b border-slate-50 font-semibold text-slate-700 hover:bg-slate-50`}
                >
                  <input
                    type="checkbox"
                    checked={filters.selectedProducts.length === allProducts.length}
                    onChange={() => {
                      if (filters.selectedProducts.length === allProducts.length) {
                        setFilters(p => ({ ...p, selectedProducts: [] }));
                      } else {
                        setFilters(p => ({ ...p, selectedProducts: [...allProducts] }));
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Select All</span>
                </label>

                {allProducts.map(product => {
                  const checked = filters.selectedProducts.includes(product);
                  return (
                    <label
                      key={product}
                      className={`flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-xl cursor-pointer transition select-none ${
                        checked
                          ? "bg-indigo-50/80 text-indigo-800 font-semibold"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleProductToggle(product)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="truncate">{product}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Method Dropdown */}
          <div className="relative" ref={paymentsRef}>
            <button
              onClick={() => {
                setIsPaymentsOpen(!isPaymentsOpen);
                setIsProductsOpen(false);
                setIsPriceOpen(false);
                setIsDatesOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer select-none h-10 ${
                filters.selectedPaymentMethods.length > 0
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-current" />
              <span className="truncate max-w-[124px] inline-block">{paymentLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${isPaymentsOpen ? "rotate-180" : ""}`} />
            </button>

            {isPaymentsOpen && (
              <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-3 space-y-1 animate-fadeIn">
                <div className="text-[10px] uppercase font-bold text-slate-450 px-2 py-1 flex justify-between items-center border-b border-slate-50 mb-1.5">
                  <span>Payment Method</span>
                  {filters.selectedPaymentMethods.length > 0 && (
                    <button
                      onClick={() => setFilters(p => ({ ...p, selectedPaymentMethods: [] }))}
                      className="text-indigo-600 lowercase font-bold hover:underline"
                    >
                      clear
                    </button>
                  )}
                </div>

                <label
                  className={`flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-xl cursor-pointer transition select-none mb-1 border-b border-slate-50 font-semibold text-slate-700 hover:bg-slate-50`}
                >
                  <input
                    type="checkbox"
                    checked={filters.selectedPaymentMethods.length === allPaymentMethods.length}
                    onChange={() => {
                      if (filters.selectedPaymentMethods.length === allPaymentMethods.length) {
                        setFilters(p => ({ ...p, selectedPaymentMethods: [] }));
                      } else {
                        setFilters(p => ({ ...p, selectedPaymentMethods: [...allPaymentMethods] }));
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Select All</span>
                </label>

                {allPaymentMethods.map(method => {
                  const checked = filters.selectedPaymentMethods.includes(method);
                  return (
                    <label
                      key={method}
                      className={`flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-xl cursor-pointer transition select-none ${
                        checked
                          ? "bg-indigo-50/80 text-indigo-800 font-semibold"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handlePaymentToggle(method)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{method}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Price Range Dropdown */}
          <div className="relative" ref={priceRef}>
            <button
              onClick={() => {
                setIsPriceOpen(!isPriceOpen);
                setIsProductsOpen(false);
                setIsPaymentsOpen(false);
                setIsDatesOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer select-none h-10 ${
                isPriceModified
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-current" />
              <span>{priceLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${isPriceOpen ? "rotate-180" : ""}`} />
            </button>

            {isPriceOpen && (
              <div className="absolute left-0 lg:left-auto lg:right-0 mt-1.5 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 space-y-3.5 animate-fadeIn">
                <div className="text-[10px] uppercase font-bold text-slate-450 pb-2 flex justify-between items-center border-b border-slate-50">
                  <span>Price Range Limits</span>
                  {isPriceModified && (
                    <button
                      onClick={() => setFilters(p => ({ ...p, maxPrice: priceRangeLimit.max }))}
                      className="text-indigo-600 lowercase font-bold hover:underline"
                    >
                      reset
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>Selected Max:</span>
                    <span className="font-bold text-indigo-600 font-mono">
                      {formatCurrency(filters.maxPrice)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={priceRangeLimit.min}
                    max={priceRangeLimit.max}
                    value={filters.maxPrice}
                    onChange={e => setFilters(p => ({ ...p, maxPrice: parseFloat(e.target.value) || priceRangeLimit.max }))}
                    className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{formatCurrency(priceRangeLimit.min)}</span>
                    <span>Max: {formatCurrency(priceRangeLimit.max)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Dropdown */}
          <div className="relative" ref={datesRef}>
            <button
              onClick={() => {
                setIsDatesOpen(!isDatesOpen);
                setIsProductsOpen(false);
                setIsPaymentsOpen(false);
                setIsPriceOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer select-none h-10 ${
                isDateModified
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-current" />
              <span>{dateLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${isDatesOpen ? "rotate-180" : ""}`} />
            </button>

            {isDatesOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-fadeIn">
                <div className="text-[10px] uppercase font-bold text-slate-450 pb-2 flex justify-between items-center border-b border-slate-50">
                  <span>Timeline Bounds</span>
                  {isDateModified && (
                    <button
                      onClick={() => setFilters(p => ({ ...p, startDate: "", endDate: "" }))}
                      className="text-indigo-600 lowercase font-bold hover:underline"
                    >
                      reset
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[9px] uppercase font-bold text-slate-400 z-10 select-none">
                      From
                    </span>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))}
                      className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[9px] uppercase font-bold text-slate-400 z-10 select-none">
                      To
                    </span>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))}
                      className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reset All Button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer select-none h-10 bg-white"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      </div>
    </div>
  );
}

