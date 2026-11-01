import { z } from "zod";

export const createOrderSchema = z.object({
  orderType: z.enum(["DINE_IN", "TAKEAWAY", "DRIVE_THRU", "DELIVERY"], {
    message: "Invalid order type",
  }),
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentMethod: z.enum(["CASH", "CARD", "QR_MOBILE"], {
    message: "Invalid payment method",
  }),
  paymentStatus: z.enum(["PAID", "PENDING"]).default("PAID"),
  discount: z.number().min(0).default(0),
  couponCode: z.string().optional().nullable(),
  serviceCharge: z.number().min(0).default(0),
  employeeId: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1, "Menu item ID is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
        size: z.string().optional().nullable(),
        unitPrice: z.number().optional().nullable(),
        notes: z.string().optional().nullable(),
        modifierIds: z.array(z.string()).optional().default([]),
      })
    )
    .min(1, "Basket cannot be empty"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"], {
    message: "Invalid status value",
  }),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const stockAdjustmentSchema = z.object({
  ingredientId: z.string().optional().nullable(),
  newIngredientName: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  type: z.enum(["WASTE", "ADJUSTMENT", "RESTOCK"], {
    message: "Type must be WASTE, ADJUSTMENT, or RESTOCK",
  }),
  quantity: z.number().refine((val) => val !== 0, {
    message: "Quantity cannot be zero",
  }),
  supplier: z.string().optional().nullable(),
  costPerUnit: z.number().optional().nullable(),
  totalCost: z.number().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

export const createPurchaseOrderSchema = z.object({
  supplier: z.string().min(2, "Supplier name required"),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        ingredientId: z.string().min(1, "Ingredient is required"),
        quantity: z.number().positive("Quantity must be greater than zero"),
        unitCost: z.number().min(0, "Unit cost cannot be negative"),
      })
    )
    .min(1, "At least one item is required in the PO"),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export const updateMenuItemSchema = z.object({
  isAvailable: z.boolean().optional(),
  price: z.number().positive().optional(),
  name: z.string().min(2).optional(),
  sizes: z.union([z.string(), z.array(z.any())]).optional().nullable(),
});

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
