import React, { useState, useMemo } from "react";
import { Order } from "../types";
import { formatCurrency } from "../utils";
import { exportToCSV } from "../data";
import {
  ArrowUpDown,
  Trash2,
  Edit,
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

interface OrderManagerTableProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  filteredOrders: Order[];
  onLoadDefaultCSV: () => void;
  onUploadCSV: (csvText: string) => void;
}

export default function OrderManagerTable({
  orders,
  setOrders,
  filteredOrders,
  onLoadDefaultCSV,
  onUploadCSV,
}: OrderManagerTableProps) {
  // Sorting state
  const [sortField, setSortField] = useState<keyof Order>("date");
  const [sortAscending, setSortAscending] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Manage CRUD Dialog forms
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form Field State
  const [formOrderNum, setFormOrderNum] = useState<string>("");
  const [formProduct, setFormProduct] = useState<string>("");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formDate, setFormDate] = useState<string>("");
  const [formPayment, setFormPayment] = useState<string>("Credit Card");
  const [formError, setFormError] = useState<string>("");

  // Raw CSV upload state
  const [isCsvInputOpen, setIsCsvInputOpen] = useState<boolean>(false);
  const [rawCsvText, setRawCsvText] = useState<string>("");
  const [csvUploadSuccess, setCsvUploadSuccess] = useState<boolean>(false);

  // Sorting logic
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortAscending ? valA - valB : valB - valA;
      }
      
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortAscending
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [filteredOrders, sortField, sortAscending]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / itemsPerPage));
  
  // Reset page when dataset moves below the previous upper threshold
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedOrders = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * itemsPerPage;
    return sortedOrders.slice(startIdx, startIdx + itemsPerPage);
  }, [sortedOrders, safeCurrentPage, itemsPerPage]);

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
    setCurrentPage(1);
  };

  // Trigger Open Form for Creation
  const handleOpenCreateForm = () => {
    setEditingOrder(null);
    setFormOrderNum(`TT-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormProduct("");
    setFormPrice("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormPayment("Credit Card");
    setFormError("");
    setIsFormOpen(true);
  };

  // Trigger Open Form for Editing
  const handleOpenEditForm = (order: Order) => {
    setEditingOrder(order);
    setFormOrderNum(order.orderNumber);
    setFormProduct(order.product);
    setFormPrice(order.price.toString());
    setFormDate(order.date);
    setFormPayment(order.paymentMethod);
    setFormError("");
    setIsFormOpen(true);
  };

  // Handle Form Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formOrderNum.trim()) {
      setFormError("Order Number is required.");
      return;
    }
    if (!formProduct.trim()) {
      setFormError("Product Name is required.");
      return;
    }
    const parsedPrice = parseFloat(formPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError("Please state a valid positive product price.");
      return;
    }
    if (!formDate) {
      setFormError("Transaction Date is required.");
      return;
    }

    if (editingOrder) {
      // Edit mode: locate record and replace
      setOrders(prev =>
        prev.map(o =>
          o.id === editingOrder.id
            ? {
                ...o,
                orderNumber: formOrderNum.trim(),
                product: formProduct.trim(),
                price: parsedPrice,
                date: formDate,
                paymentMethod: formPayment,
              }
            : o
        )
      );
    } else {
      // Create mode
      const newOrderItem: Order = {
        id: `TT-${Date.now()}-${Math.random()}`,
        orderNumber: formOrderNum.trim(),
        product: formProduct.trim(),
        price: parsedPrice,
        date: formDate,
        paymentMethod: formPayment,
      };
      setOrders(prev => [newOrderItem, ...prev]);
      setCurrentPage(1); // Jump to first page to inspect newly appended order
    }

    setIsFormOpen(false);
    setEditingOrder(null);
  };

  // Delete transaction action
  const handleDeleteOrder = (orderId: string) => {
    if (confirm("Are you sure you want to delete this order record?")) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  // Expose CSV export trigger
  const handleExportCSV = () => {
    const csvContent = exportToCSV(filteredOrders);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Raw CSV Submission handler
  const handleCsvLoaderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawCsvText.trim()) return;

    try {
      onUploadCSV(rawCsvText);
      setCsvUploadSuccess(true);
      setRawCsvText("");
      setTimeout(() => {
        setCsvUploadSuccess(false);
        setIsCsvInputOpen(false);
      }, 1500);
    } catch (err) {
      alert("Error parsing uploaded text. Please review header titles.");
    }
  };

  // Extract list of products for dropdown selector autocomplete options
  const existingProductOptions = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.product))).sort();
  }, [orders]);

  const existingPaymentOptions = ["Credit Card", "eWallet", "Cash", "Debit Card"];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      {/* Control Banner */}
      <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" />
            Transaction Ledger
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Full tabular view of processed transactions with record controls
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Default Data Loader Restorer */}
          <button
            onClick={onLoadDefaultCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-2xs"
            title="Reload initial dataset, overriding modifications"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Reload Dataset
          </button>

          {/* CSV Bulk Importer Accordion */}
          <button
            onClick={() => setIsCsvInputOpen(!isCsvInputOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shadow-2xs ${
              isCsvInputOpen
                ? "bg-slate-200 border-slate-300 text-slate-900"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            Import CSV
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 disabled:opacity-50 disabled:hover:text-slate-600 disabled:cursor-not-allowed transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export Selected
          </button>

          {/* Append Single Record Trigger */}
          <button
            onClick={handleOpenCreateForm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Record Order
          </button>
        </div>
      </div>

      {/* CSV Input Panel (Slide-down toggle) */}
      {isCsvInputOpen && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 animate-slideDown">
          <form onSubmit={handleCsvLoaderSubmit} className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                Raw CSV Data Terminal
              </label>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                Ex: Order Number,Product,Price,Date,Payment Method
              </span>
            </div>
            
            <textarea
              rows={4}
              value={rawCsvText}
              onChange={e => setRawCsvText(e.target.value)}
              placeholder="Paste raw comma-separated spreadsheet text lines here..."
              className="w-full p-3 font-mono text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
            />

            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400">
                Pasting replaces the active state buffer completely with your payload layout labels.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCsvInputOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rawCsvText.trim()}
                  className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
                >
                  {csvUploadSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      Loaded!
                    </>
                  ) : (
                    "Process Output"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Primary Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="py-4 px-6">
                <button
                  onClick={() => handleSort("orderNumber")}
                  className="flex items-center gap-1 hover:text-slate-700 transition"
                >
                  Order Number
                  <ArrowUpDown className="w-3 h-3 text-slate-300" />
                </button>
              </th>
              <th className="py-4 px-6">
                <button
                  onClick={() => handleSort("product")}
                  className="flex items-center gap-1 hover:text-slate-700 transition"
                >
                  Product Name
                  <ArrowUpDown className="w-3 h-3 text-slate-300" />
                </button>
              </th>
              <th className="py-4 px-6 text-right">
                <button
                  onClick={() => handleSort("price")}
                  className="flex items-center gap-1 ml-auto hover:text-slate-700 transition"
                >
                  Price Value
                  <ArrowUpDown className="w-3 h-3 text-slate-300" />
                </button>
              </th>
              <th className="py-4 px-6">
                <button
                  onClick={() => handleSort("date")}
                  className="flex items-center gap-1 hover:text-slate-700 transition"
                >
                  Date
                  <ArrowUpDown className="w-3 h-3 text-slate-300" />
                </button>
              </th>
              <th className="py-4 px-6">
                <button
                  onClick={() => handleSort("paymentMethod")}
                  className="flex items-center gap-1 hover:text-slate-700 transition"
                >
                  Payment Type
                  <ArrowUpDown className="w-3 h-3 text-slate-300" />
                </button>
              </th>
              <th className="py-4 px-6 text-center select-none">Record Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                  <Database className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                  No transactions meets active filter dimensions.
                </td>
              </tr>
            ) : (
              paginatedOrders.map(order => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50/60 transition duration-150 group"
                  id={`order-row-${order.id}`}
                >
                  <td className="py-3 px-6 font-mono text-xs text-slate-500 font-semibold">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-6 font-semibold text-slate-800">
                    {order.product}
                  </td>
                  <td className="py-3 px-6 text-right font-mono font-bold text-slate-700 text-xs">
                    {formatCurrency(order.price)}
                  </td>
                  <td className="py-3 px-6 font-sans text-xs">
                    {order.date}
                  </td>
                  <td className="py-3 px-6">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100/90 text-slate-600">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenEditForm(order)}
                        className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title="Edit record"
                        id={`edit-btn-${order.id}`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete record"
                        id={`delete-btn-${order.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination Controls */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">
            Showing {paginatedOrders.length} of {sortedOrders.length} records
          </span>
          <div className="flex items-center gap-1.5 select-none text-xs">
            <span>Rows:</span>
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 bg-white rounded-lg p-1 text-xs text-slate-700 outline-hidden"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Current indexes page switcher */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="px-3 text-xs text-slate-500 font-semibold font-mono">
            Page {safeCurrentPage} of {totalPages}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CRUD dialog popup Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">
                {editingOrder ? "Edit Order Record" : "Add Order Receipt"}
              </h4>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-250 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Order ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formOrderNum}
                    onChange={e => setFormOrderNum(e.target.value)}
                    placeholder="TT-1XXX"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Price ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formPrice}
                      onChange={e => setFormPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Apparel Product Name
                </label>
                <input
                  type="text"
                  required
                  list="product-suggestions"
                  value={formProduct}
                  onChange={e => setFormProduct(e.target.value)}
                  placeholder="e.g. Fit Denim Jeans"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition font-semibold"
                />
                <datalist id="product-suggestions">
                  {existingProductOptions.map(p => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Payment Option
                  </label>
                  <select
                    value={formPayment}
                    onChange={e => setFormPayment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition text-slate-700 font-medium"
                  >
                    {existingPaymentOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-xl transition"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
