import { CustomerInfo, InvoiceDetails, InvoiceLineItem } from "@/types";

let cachedSessionCookie: string | null = null;
let cookieExpiresAt: number = 0;

const PAYPAL_SERVICE_URL = process.env.PAYPAL_SERVICE_URL || "http://localhost:3000";
const OWNER_EMAIL = process.env.PAYPAL_SERVICE_OWNER_EMAIL || "owner@revenueguardian.local";
const OWNER_PASSWORD = process.env.PAYPAL_SERVICE_OWNER_PASSWORD || "OwnerSecurePass123!";

/**
 * Ensures an authenticated session cookie with the Revenue Guardian service.
 */
export async function getRevenueGuardianSession(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedSessionCookie && cookieExpiresAt > now + 60000) {
    return cachedSessionCookie;
  }

  try {
    cachedSessionCookie = null;
    const res = await fetch(`${PAYPAL_SERVICE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: PAYPAL_SERVICE_URL,
      },
      body: JSON.stringify({
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to authenticate with Revenue Guardian (HTTP ${res.status}): ${errText}`);
    }

    const setCookieHeader = res.headers.get("set-cookie") || "";
    // Match __Secure-better-auth.session_token or better-auth.session_token
    const match = setCookieHeader.match(/((?:__Secure-)?better-auth\.session_token=[^;]+)/);
    if (!match) {
      throw new Error("Revenue Guardian authentication succeeded but no session token cookie was returned.");
    }

    cachedSessionCookie = match[1];
    cookieExpiresAt = now + 1000 * 60 * 60 * 24; // 24 hours
    return cachedSessionCookie;
  } catch (err) {
    console.error("[PayPalBridge] Auth failure:", err);
    throw err;
  }
}

/**
 * Authenticated fetch helper that retries once on 401 Unauthorized with a fresh session.
 */
async function authenticatedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  let cookie = await getRevenueGuardianSession();
  const headers = new Headers(init.headers || {});
  headers.set("Origin", PAYPAL_SERVICE_URL);
  headers.set("Cookie", cookie);

  let res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    // Retry once with a freshly negotiated session cookie
    cookie = await getRevenueGuardianSession(true);
    headers.set("Cookie", cookie);
    res = await fetch(url, { ...init, headers });
  }
  return res;
}

/**
 * Creates an official PayPal Sandbox invoice via Revenue Guardian backend (payment.lalithdev.tech).
 */
export async function createPayPalInvoice(params: {
  customer: CustomerInfo;
  lineItems: InvoiceLineItem[];
  amount: number;
  currency?: string;
  dueDays?: number;
  note?: string;
}): Promise<InvoiceDetails> {
  const currency = params.currency || "USD";
  const dueDays = params.dueDays ?? 15;

  const res = await authenticatedFetch(`${PAYPAL_SERVICE_URL}/api/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerName: params.customer.name,
      customerEmail: params.customer.email,
      amount: params.amount,
      currency,
      dueDays,
      note: params.note || `CampusVault Student Invoice for ${params.customer.name} (${params.customer.studentId})`,
      lineItems: params.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      })),
    }),
  });

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invoice creation endpoint returned non-JSON (${res.status}): ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    throw new Error((data.error as string) || `Invoice creation failed with HTTP ${res.status}`);
  }

  const issueDate = new Date().toISOString();
  const dueDateObj = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000);

  return {
    invoiceId: (data.invoiceId as string) || `INV-${Date.now()}`,
    invoiceNumber: (data.invoiceNumber as string) || `E2E-${Date.now().toString().slice(-4)}`,
    payerViewUrl:
      (data.payerViewUrl as string) ||
      `https://www.sandbox.paypal.com/invoice/p/#${(data.invoiceId as string) || ""}`,
    eventId: data.eventId as string,
    proposalId: data.proposalId as string,
    actionId: data.actionId as string,
    amount: params.amount,
    currency,
    dueDays,
    dueDate: dueDateObj.toISOString().split("T")[0],
    issueDate: issueDate.split("T")[0],
    status: "UNPAID",
    customer: params.customer,
    lineItems: params.lineItems,
    merchant: {
      name: "Revenue Guardian Merchant",
      domain: "payment.lalithdev.tech",
      email: "sb-nqm7e53210994@business.example.com",
    },
  };
}

/**
 * Creates an order in PayPal Sandbox via Revenue Guardian backend.
 */
export async function createPayPalOrder(params: {
  amount: string;
  currency?: string;
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
}) {
  const res = await authenticatedFetch(`${PAYPAL_SERVICE_URL}/api/paypal/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency || "USD",
      description: params.description,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Create order failed with HTTP ${res.status}`);
  }

  return {
    success: true,
    orderId: data.orderId as string,
    status: data.status as string,
    approvalLink: data.approvalLink as string | null,
  };
}

/**
 * Captures an order in PayPal Sandbox.
 * If mockCode is set to INSTRUMENT_DECLINED, the call demonstrates autonomous failure recovery.
 */
export async function capturePayPalOrder(params: {
  orderId: string;
  mockCode?: "INSTRUMENT_DECLINED" | "TRANSACTION_REFUSED" | "NONE";
}) {
  const res = await authenticatedFetch(`${PAYPAL_SERVICE_URL}/api/paypal/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId: params.orderId,
      mockCode: params.mockCode || "NONE",
    }),
  });

  const data = await res.json();

  if (res.status === 422) {
    return {
      status: "DECLINED" as const,
      orderId: data.orderId as string,
      eventId: data.eventId as string,
      issue: data.issue as string,
      description: data.description as string,
      source: data.source as string,
    };
  }

  if (res.ok) {
    return {
      status: "COMPLETED" as const,
      orderId: data.orderId as string,
      captureId: data.captureId as string,
      amount: data.amount as { currency_code: string; value: string },
    };
  }

  throw new Error(data.error || `Capture failed with HTTP ${res.status}`);
}

/**
 * Requests cancellation and refund evaluated against Revenue Guardian policy.
 * If amount <= $25 autoRefundMaxAmount, auto-approves.
 * If amount > $25, creates approval in payment.lalithdev.tech/approvals.
 */
export async function requestRefund(params: {
  orderId: string;
  captureId?: string;
  amount: number;
  currency?: string;
  reason: string;
  customerEmail?: string;
  customerName?: string;
}) {
  const res = await authenticatedFetch(`${PAYPAL_SERVICE_URL}/api/paypal/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Revenue Guardian responded with non-JSON (${res.status}): ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    throw new Error(data.error || `Refund request failed with HTTP ${res.status}`);
  }

  return data as {
    status: "REFUNDED" | "AWAITING_APPROVAL";
    decision: "AUTO" | "NEEDS_APPROVAL";
    eventId: string;
    proposalId?: string;
    approvalId?: string;
    approvalToken?: string;
    orderId: string;
    amount: number;
    currency: string;
    ruleTriggered: string;
    policyLimit?: string;
    message: string;
  };
}

/**
 * Fetches event triage and AI decision from Revenue Guardian for live status display.
 */
export async function fetchEventTriageDetails(eventId: string) {
  const res = await authenticatedFetch(`${PAYPAL_SERVICE_URL}/api/events/${eventId}`, {
    method: "GET",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch event: ${err}`);
  }

  return res.json();
}
