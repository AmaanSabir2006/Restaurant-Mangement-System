export type UserRole = "CASHIER" | "KITCHEN" | "INVENTORY_MGR" | "ADMIN";

export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DRIVE_THRU" | "DELIVERY";

export type PaymentMethod = "CASH" | "CARD" | "QR_MOBILE";

export type StockTransactionType = "USAGE" | "RESTOCK" | "WASTE" | "ADJUSTMENT";

export type MenuCategory = "All" | "Burgers" | "Sides" | "Beverages" | "Combos" | "Deals";

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

export interface MenuItemDto {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
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
  todayOrdersCount: number;
  activeOrdersCount: number;
  averagePrepTimeMinutes: number;
  lowStockItemsCount: number;
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
  wasteVsUsage: {
    ingredientName: string;
    usage: number;
    waste: number;
    unit: string;
  }[];
}
