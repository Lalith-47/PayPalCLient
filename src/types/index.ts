export type ProductCategory = "essentials" | "subscription_notes";

export interface SampleNote {
  title: string;
  subject: string;
  topics: string[];
  sampleExcerpt: string;
  pageCount: number;
  format: "PDF" | "Interactive Vault" | "Cheatsheet + Anki";
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  billingInterval?: "monthly" | "semester" | "weekly" | "one_time";
  description: string;
  badge?: string;
  features: string[];
  rating: number;
  reviewsCount: number;
  image: string;
  inStock: boolean;
  sampleNote?: SampleNote;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  studentId: string;
  university: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  isSubscription?: boolean;
}

export interface InvoiceDetails {
  invoiceId: string;
  invoiceNumber: string;
  payerViewUrl: string;
  eventId: string;
  proposalId: string;
  actionId?: string;
  orderId?: string;
  approvalLink?: string | null;
  amount: number;
  currency: string;
  dueDays: number;
  dueDate: string;
  issueDate: string;
  status: "DRAFT" | "SENT" | "UNPAID" | "PAID" | "CANCELLED";
  customer: CustomerInfo;
  lineItems: InvoiceLineItem[];
  merchant: {
    name: string;
    domain: string;
    email: string;
  };
}

export interface OwnedItem {
  id: string;
  product: Product;
  orderId: string;
  invoiceId?: string;
  captureId?: string;
  purchaseDate: string;
  amountPaid: number;
  status: "ACTIVE" | "REFUNDED" | "AWAITING_APPROVAL" | "CANCELLED";
  refundEventId?: string;
  refundRule?: string;
  refundMessage?: string;
  policyLimit?: string;
}

export interface TriageProposal {
  id: string;
  action: string;
  confidence: string;
  reasoning: string;
  modelUsed?: string;
}

export interface TriageAction {
  id: string;
  actionType: string;
  status: string;
  idempotencyKey?: string;
}

export interface RevenueGuardianEvent {
  id: string;
  type: string;
  source: string;
  externalId: string | null;
  status: "RECEIVED" | "PROPOSED" | "WAITING_FOR_APPROVAL" | "EXECUTED" | "FAILED" | "WAITING_FOR_AI";
  amount: string | null;
  currency: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  proposal?: TriageProposal | null;
  action?: TriageAction | null;
}
