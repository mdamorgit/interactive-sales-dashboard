import { Order, DashboardStats } from "./types";

/**
 * Formats a number to USD Currency string ($1,234.56)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Returns the short day name for a given YYYY-MM-DD date string (e.g. "Mon", "Tue")
 */
export function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return "N/A";
  const dateObj = new Date(dateStr + "T00:00:00");
  if (isNaN(dateObj.getTime())) return "N/A";
  return dateObj.toLocaleDateString("en-US", { weekday: "short" });
}

/**
 * Group name for Day of Week index (0 = Sun, 1 = Mon...)
 */
export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Calculates high-level statistics for a list of orders
 */
export function calculateStats(orders: Order[]): DashboardStats {
  if (orders.length === 0) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      topProduct: "None"
    };
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalRevenue / totalOrders;

  // Find top product
  const productCountMap: { [product: string]: number } = {};
  orders.forEach(o => {
    productCountMap[o.product] = (productCountMap[o.product] || 0) + 1;
  });

  let topProduct = "None";
  let maxCount = 0;
  Object.entries(productCountMap).forEach(([product, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topProduct = product;
    }
  });

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    topProduct
  };
}

/**
 * Aggregates revenue and sales count chronologically by Date
 */
export function aggregateTimelineData(orders: Order[]) {
  const map: { [date: string]: { date: string; revenue: number; transactions: number } } = {};
  
  orders.forEach(o => {
    if (!map[o.date]) {
      map[o.date] = { date: o.date, revenue: 0, transactions: 0 };
    }
    map[o.date].revenue += o.price;
    map[o.date].transactions += 1;
  });

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Aggregates data by Product category to feed recharts list
 */
export function aggregateProductData(orders: Order[]) {
  const map: { [product: string]: { name: string; value: number; count: number } } = {};

  orders.forEach(o => {
    const originalName = o.product;
    if (!map[originalName]) {
      map[originalName] = { name: originalName, value: 0, count: 0 };
    }
    map[originalName].value += o.price;
    map[originalName].count += 1;
  });

  return Object.values(map).sort((a, b) => b.value - a.value);
}

/**
 * Aggregates data by Payment Method
 */
export function aggregatePaymentData(orders: Order[]) {
  const map: { [method: string]: { name: string; value: number; count: number } } = {};

  orders.forEach(o => {
    const key = o.paymentMethod || "Unknown";
    if (!map[key]) {
      map[key] = { name: key, value: 0, count: 0 };
    }
    map[key].value += o.price;
    map[key].count += 1;
  });

  return Object.values(map);
}

/**
 * Generates structured 2D coordinate matrix data for custom Heatmap.
 * Options are: 
 *   - "day_product": Day of Week vs. Product
 *   - "payment_product": Payment Method vs. Product
 */
export interface HeatmapCell {
  xSource: string; // e.g. "Mon" or "eWallet"
  ySource: string; // e.g. "Slim-Fit Denim Jeans"
  revenue: number;
  count: number;
  orders: Order[];
}

export function generateHeatmapData(
  orders: Order[],
  type: "day_product" | "payment_product"
): {
  xLabels: string[];
  yLabels: string[];
  cells: HeatmapCell[];
  maxRevenue: number;
  maxCount: number;
} {
  const uniqueProducts = Array.from(new Set(orders.map(o => o.product))).sort();
  
  let xLabels: string[] = [];
  if (type === "day_product") {
    xLabels = DAYS_OF_WEEK; // Sun through Sat
  } else {
    xLabels = Array.from(new Set(orders.map(o => o.paymentMethod || "Unknown"))).sort();
  }

  const yLabels = uniqueProducts;

  // Build key-value map for fast accumulation
  const cellMap: { [key: string]: HeatmapCell } = {};
  
  // Initialize grid cells
  xLabels.forEach(x => {
    yLabels.forEach(y => {
      const key = `${x}||${y}`;
      cellMap[key] = {
        xSource: x,
        ySource: y,
        revenue: 0,
        count: 0,
        orders: []
      };
    });
  });

  // Accumulate
  orders.forEach(o => {
    let xValue = "";
    if (type === "day_product") {
      xValue = getDayOfWeekName(o.date);
    } else {
      xValue = o.paymentMethod || "Unknown";
    }
    
    const yValue = o.product;
    const key = `${xValue}||${yValue}`;

    // If cell doesn't exist, we skip or initialize dynamically
    if (cellMap[key]) {
      cellMap[key].revenue += o.price;
      cellMap[key].count += 1;
      cellMap[key].orders.push(o);
    }
  });

  const cells = Object.values(cellMap);
  const maxRevenue = Math.max(...cells.map(c => c.revenue), 1);
  const maxCount = Math.max(...cells.map(c => c.count), 1);

  return {
    xLabels,
    yLabels,
    cells,
    maxRevenue,
    maxCount
  };
}
