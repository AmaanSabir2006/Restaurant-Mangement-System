export type UserRole = "CASHIER" | "KITCHEN" | "INVENTORY_MGR" | "ADMIN";

export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DRIVE_THRU" | "DELIVERY";

export type PaymentMethod = "CASH" | "CARD" | "QR_MOBILE";

export type StockTransactionType = "USAGE" | "RESTOCK" | "WASTE" | "ADJUSTMENT";

export type MenuCategory =
  | "All"
  | "Hot Deals"
  | "Pizzas"
  | "Burgers"
  | "Shawarma & Rolls"
  | "Fried Chicken"
  | "Fries & Sides"
  | "Pasta"
  | "Sandwiches"
  | "Ice Cream & Drinks";

export interface EmployeeDto {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  avatar?: string | null;
}

export interface ModifierDto {
  id: string;
  name: string;
  price: number;
  ingredientId?: string | null;
  extraQty: number;
}

export interface RecipeItemDto {
  id: string;
  ingredientId: string;
  quantityRequired: number;
  ingredient?: {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
  };
}

export interface ItemSizeOption {
  name: string;
  price: number;
}

export interface MenuItemDto {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  sizes?: string | null;
  sizeOptions?: ItemSizeOption[];
  description?: string | null;
  image?: string | null;
  isAvailable: boolean;
  prepTimeMin: number;
  calories?: number | null;
  modifiers?: ModifierDto[];
  recipeItems?: RecipeItemDto[];
}

export interface OrderItemModifierDto {
  id: string;
  modifierId?: string | null;
  name: string;
  price: number;
}

export interface OrderItemDto {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  size?: string | null;
  unitPrice: number;
  notes?: string | null;
  menuItem?: MenuItemDto;
  modifiers?: OrderItemModifierDto[];
}

export interface OrderDto {
  id: string;
  orderNumber: number;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  serviceCharge: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  employeeId?: string | null;
  employee?: EmployeeDto | null;
  prepStartTime?: string | null;
  readyTime?: string | null;
  completedTime?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
}

export interface IngredientDto {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  costPerUnit: number;
  supplier?: string | null;
  status: "NORMAL" | "LOW" | "OUT_OF_STOCK";
  createdAt: string;
  updatedAt: string;
}

export interface StockTransactionDto {
  id: string;
  ingredientId: string;
  type: StockTransactionType;
  quantity: number;
  supplier?: string | null;
  costPerUnit?: number | null;
  totalCost?: number | null;
  reason?: string | null;
  referenceId?: string | null;
  createdAt: string;
  ingredient?: {
    name: string;
    unit: string;
  };
}

export interface PurchaseOrderDto {
  id: string;
  poNumber: string;
  supplier: string;
  totalCost: number;
  status: "PENDING" | "RECEIVED" | "CANCELLED";
  notes?: string | null;
  createdAt: string;
  receivedAt?: string | null;
  items: {
    id: string;
    ingredientId: string;
    quantity: number;
    unitCost: number;
    ingredient?: {
      name: string;
      unit: string;
    };
  }[];
}

export interface AnalyticsSummaryDto {
  dailySales: number;
  totalRevenue: number;
  todayOrdersCount: number;
  totalOrdersCount: number;
  avgTicketValue: number;
  activeOrdersCount: number;
  averagePrepTimeMinutes: number;
  lowStockItemsCount: number;
  lowStockItems?: {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    reorderThreshold: number;
    supplier?: string | null;
    costPerUnit?: number;
    status: "LOW" | "OUT_OF_STOCK";
  }[];
  hourlySales: {
    hour: string;
    sales: number;
    orders: number;
  }[];
  topSellingItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  fastFoodSales?: {
    id: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }[];
  categorySales?: {
    category: string;
    quantity: number;
    revenue: number;
  }[];
  wasteVsUsage: {
    ingredientName: string;
    usage: number;
    waste: number;
    unit: string;
  }[];
  monthKey?: string;
  monthLabel?: string;
  monthSales?: number;
  monthOrdersCount?: number;
  monthSuppliesCost?: number;
  monthSuppliesPaid?: number;
  monthSuppliesPending?: number;
  netMonthlyProfit?: number;
  isMonthReset?: boolean;
  archivedSnapshot?: {
    monthKey?: string;
    closedAt?: string;
    totalSales?: number;
    totalOrders?: number;
    totalSupplies?: number;
    notes?: string;
    isReset?: boolean;
  } | null;
  availableMonths?: {
    key: string;
    label: string;
    sales: number;
    orders: number;
    isReset?: boolean;
  }[];
}

export interface DailySupplyDto {
  id: string;
  personName: string;
  itemName: string;
  quantity: number;
  unit: string;
  totalCost: number;
  paymentStatus: "PAID" | "PENDING";
  notes?: string | null;
  monthKey: string;
  isArchived: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonExpenseSummary {
  personName: string;
  totalCost: number;
  count: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface ItemExpenseSummary {
  itemName: string;
  totalCost: number;
  totalQuantity: number;
  unit: string;
  count: number;
}

export interface MonthlySuppliesAnalyticsDto {
  monthKey: string;
  monthLabel: string;
  totalCost: number;
  totalPaid: number;
  totalPending: number;
  totalEntries: number;
  byPerson: PersonExpenseSummary[];
  byItem: ItemExpenseSummary[];
  availableMonths: {
    key: string;
    label: string;
    totalCost: number;
    count: number;
  }[];
}

export interface DailyLogItemSoldDto {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  unitPrice: number;
  totalRevenue: number;
  percentageOfSales: number;
}

export interface DailyLogVendorSummaryDto {
  personName: string;
  itemsCount: number;
  totalSuppliesCost: number;
  paidAmount: number;
  pendingAmount: number;
  overallPendingBalance: number;
  status: "CLEARED" | "PENDING";
}

export interface DailyLogResponseDto {
  date: string;
  formattedDate: string;
  salesSummary: {
    totalRevenue: number;
    ordersCount: number;
    cashSales: number;
    cardSales: number;
    itemsSold: DailyLogItemSoldDto[];
  };
  suppliesSummary: {
    totalCost: number;
    totalPaid: number;
    totalPending: number;
    entriesCount: number;
    supplies: DailySupplyDto[];
  };
  vendorSettlementSummary: DailyLogVendorSummaryDto[];
  cashFlow: {
    totalSales: number;
    cashPaidOut: number;
    netCashFlow: number;
    pendingUdhaarToday: number;
  };
}
