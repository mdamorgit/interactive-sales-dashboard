export interface Order {
  id: string; // Internal unique ID for React keys if duplicate order numbers exist
  orderNumber: string;
  product: string;
  price: number;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProduct: string;
}

export interface MetricCardConfig {
  id: string;
  label: string;
  value: string | number;
  subtext: string;
  icon: string;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  selectedProducts: string[];
  selectedPaymentMethods: string[];
  minPrice: number;
  maxPrice: number;
  searchQuery: string;
}
