import { pgTable, text, numeric, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { SampleNote } from "@/types";

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'essentials' | 'subscription_notes'
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  billingInterval: text("billing_interval").notNull(), // 'one_time' | 'month' | 'semester'
  description: text("description").notNull(),
  badge: text("badge"),
  features: jsonb("features").$type<string[]>().default([]),
  rating: numeric("rating", { precision: 3, scale: 1 }).default("4.8"),
  reviewsCount: integer("reviews_count").default(0),
  image: text("image").notNull(),
  inStock: boolean("in_stock").default(true).notNull(),
  sampleNote: jsonb("sample_note").$type<SampleNote | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  invoiceId: text("invoice_id"),
  invoiceNumber: text("invoice_number"),
  sessionId: text("session_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("ACTIVE"), // 'ACTIVE' | 'REFUNDED' | 'AWAITING_APPROVAL'
  refundEventId: text("refund_event_id"),
  refundReason: text("refund_reason"),
  refundMessage: text("refund_message"),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
