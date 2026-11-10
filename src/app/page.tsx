"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { NotesPreviewModal } from "@/components/NotesPreviewModal";
import { CartDrawer } from "@/components/CartDrawer";
import { InvoiceViewerModal } from "@/components/InvoiceViewerModal";
import { FailureTriageModal } from "@/components/FailureTriageModal";
import { MyVaultSection } from "@/components/MyVaultSection";
import { PRODUCTS } from "@/data/products";
import { Product, CartItem, CustomerInfo, InvoiceDetails, OwnedItem } from "@/types";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Layers,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  Flame,
  Zap,
  FileText,
  Clock,
  XCircle,
  Loader2,
  CheckCircle2,
  Archive,
} from "lucide-react";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<"store" | "vault">("store");
  const [activeCategory, setActiveCategory] = useState<"all" | "essentials" | "subscription_notes">("all");
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [refundingItemId, setRefundingItemId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("default_student_session");

  // Initial student owned items & subscriptions
  const [ownedItems, setOwnedItems] = useState<OwnedItem[]>([
    {
      id: "own-cs-vault-sample",
      product: PRODUCTS.find((p) => p.id === "sub-cs-vault") || PRODUCTS[6],
      orderId: "ORD_SAMPLE_8941",
      invoiceId: "INV2-PREV-0012",
      purchaseDate: "2026-11-09",
      amountPaid: 14.99,
      status: "ACTIVE",
    },
    {
      id: "own-backpack-sample",
      product: PRODUCTS.find((p) => p.id === "prod-campus-backpack") || PRODUCTS[2],
      orderId: "ORD_SAMPLE_8942",
      invoiceId: "INV2-PREV-0013",
      purchaseDate: "2026-11-08",
      amountPaid: 34.00,
      status: "ACTIVE",
    },
  ]);

  // Default student credentials for checkout & invoicing
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "Alex Mercer",
    email: "alex.mercer@campus.edu",
    studentId: "STU-88421",
    university: "Tech State University",
  });

  // Invoice & Payment state
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceDetails | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Status banners & alerts
  const [successDetails, setSuccessDetails] = useState<{
    orderId?: string;
    captureId?: string;
    invoiceNumber?: string;
    message: string;
  } | null>(null);

  const [declineDetails, setDeclineDetails] = useState<{
    orderId: string;
    eventId?: string;
    issue?: string;
    description?: string;
    source?: string;
  } | null>(null);

  const [cancellationNotice, setCancellationNotice] = useState<string | null>(null);

  // Initialize Session & Neon DB Data Fetching
  useEffect(() => {
    // 1. Resolve or create persistent session ID
    let currentSid = "session_student_default";
    try {
      const stored = localStorage.getItem("campusvault_student_session_id");
      if (stored) {
        currentSid = stored;
      } else {
        currentSid = `sid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem("campusvault_student_session_id", currentSid);
      }
    } catch {
      // fallback in SSR or restricted environments
    }
    setSessionId(currentSid);

    // 2. Early DB Warmup: Awaken Neon Serverless compute instance
    fetch("/api/warmup")
      .then((res) => res.json())
      .catch((err) => console.log("[Warmup Ping Note]", err.message));

    // 3. Load catalog products from Neon DB
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setProductsList(data.products);
        }
      })
      .catch((err) => console.warn("[Products Fetch]", err));

    // 4. Load persisted cart items for this student session
    fetch(`/api/cart?sessionId=${currentSid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          setCart(data.items);
        }
      })
      .catch((err) => console.warn("[Cart Fetch]", err));

    // 5. Load persisted order history for this student session
    fetch(`/api/orders?sessionId=${currentSid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
          setOwnedItems((prev) => {
            const combined = [...data.orders];
            // keep default samples if none exist
            for (const item of prev) {
              if (!combined.some((c) => c.id === item.id)) {
                combined.push(item);
              }
            }
            return combined;
          });
        }
      })
      .catch((err) => console.warn("[Orders Fetch]", err));
  }, []);

  // Cart operations: Just adds to cart without opening drawer
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    // Persist to Neon DB
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        productId: product.id,
        delta: 1,
      }),
    }).catch((err) => console.warn("[Cart Add Sync]", err));

    // Show non-disruptive confirmation badge
    setCartToast(`Added ${product.name} to cart!`);
    setTimeout(() => setCartToast(null), 2500);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );

    // Persist quantity to Neon DB
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        productId,
        quantity,
      }),
    }).catch((err) => console.warn("[Cart Qty Sync]", err));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));

    // Delete from Neon DB
    fetch(`/api/cart?sessionId=${sessionId}&productId=${productId}`, {
      method: "DELETE",
    }).catch((err) => console.warn("[Cart Remove Sync]", err));
  };

  // Step 1: Open checkout -> creates official invoice via payment.lalithdev.tech
  const handleProceedToInvoice = async () => {
    if (cart.length === 0) return;

    setIsGeneratingInvoice(true);
    setCancellationNotice(null);
    setDeclineDetails(null);

    const totalAmount = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    try {
      const res = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: cart,
          amount: parseFloat(totalAmount.toFixed(2)),
          currency: "USD",
          dueDays: 15,
          note: `CampusVault Order for ${customer.name} (${customer.studentId})`,
          lineItems: cart.map((ci) => ({
            description: `${ci.product.name} (CampusVault)`,
            quantity: ci.quantity,
            unitPrice: ci.product.price,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate official invoice");
      }

      setCurrentInvoice(data.invoice);
      setIsCartOpen(false);
      setIsInvoiceModalOpen(true);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // Step 2A: Confirm Settlement & Claim Ownership into Vault
  const handleConfirmPaid = () => {
    if (!currentInvoice) return;
    setIsInvoiceModalOpen(false);

    const newOwned: OwnedItem[] = cart.map((ci) => ({
      id: `own_${Date.now()}_${ci.product.id}`,
      product: ci.product,
      orderId: currentInvoice.orderId || `ORD_${Date.now()}`,
      captureId: `cap_${currentInvoice.invoiceId || Date.now()}`,
      invoiceId: currentInvoice.invoiceId,
      purchaseDate: new Date().toISOString().split("T")[0],
      amountPaid: ci.product.price * ci.quantity,
      status: "ACTIVE",
    }));

    setOwnedItems((prev) => [...newOwned, ...prev]);
    setSuccessDetails({
      orderId: currentInvoice.orderId,
      invoiceNumber: currentInvoice.invoiceNumber,
      message: `Invoice #${currentInvoice.invoiceNumber} settled via PayPal. Purchased items are now accessible in your Owned Vault!`,
    });

    // Persist new orders to Neon DB
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        orderId: currentInvoice.orderId || `ORD_${Date.now()}`,
        invoiceId: currentInvoice.invoiceId,
        invoiceNumber: currentInvoice.invoiceNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        items: cart.map((ci) => ({
          productId: ci.product.id,
          amountPaid: ci.product.price * ci.quantity,
        })),
      }),
    }).catch((err) => console.warn("[Orders Persist Sync]", err));

    // Clear cart in Neon DB
    fetch(`/api/cart?sessionId=${sessionId}`, {
      method: "DELETE",
    }).catch((err) => console.warn("[Cart Clear Sync]", err));

    setCart([]);
    setCurrentView("vault");
  };

  // Step 2B: Decline Simulation for demonstrating Revenue Guardian
  const handleExecutePayment = async (
    mockCode?: "INSTRUMENT_DECLINED" | "TRANSACTION_REFUSED" | "SIMULATE_SUCCESS" | "NONE"
  ) => {
    if (!currentInvoice?.orderId) return;

    setLoadingPayment(true);
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: currentInvoice.orderId,
          mockCode: mockCode || "NONE",
        }),
      });

      const data = await res.json();

      if (res.status === 422) {
        // Declined: Intercepted and triaged by Revenue Guardian
        setIsInvoiceModalOpen(false);
        setDeclineDetails({
          orderId: currentInvoice.orderId,
          eventId: data.eventId,
          issue: data.issue,
          description: data.description,
          source: data.source,
        });
      }
    } catch (err) {
      console.warn("Capture note:", err);
    } finally {
      setLoadingPayment(false);
    }
  };

  // Step 2C: Cancel invoice
  const handleDeclineInvoice = () => {
    if (!currentInvoice) return;
    setIsInvoiceModalOpen(false);
    setCancellationNotice(
      `Invoice #${currentInvoice.invoiceNumber} cancelled. No funds were debited and your cart was saved.`
    );
  };

  // Step 3: Cancellation & Refund Flow
  const handleCancelAndRefund = async (item: OwnedItem, reason: string) => {
    setRefundingItemId(item.id);
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: item.orderId,
          itemId: item.id,
          captureId: item.captureId || item.orderId,
          amount: item.amountPaid,
          currency: "USD",
          reason,
          customerEmail: customer.email,
          customerName: customer.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit cancellation refund");
      }

      if (data.decision === "AUTO") {
        setOwnedItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "REFUNDED",
                  refundEventId: data.eventId,
                  refundRule: data.ruleTriggered,
                  refundMessage: data.message,
                }
              : i
          )
        );
        setSuccessDetails({
          message: `Cancellation Approved: Refund of $${item.amountPaid.toFixed(2)} has been processed and credited to your original payment method.`,
        });
      } else {
        setOwnedItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "AWAITING_APPROVAL",
                  refundEventId: data.eventId,
                  refundRule: data.ruleTriggered,
                  refundMessage: data.message,
                }
              : i
          )
        );
        setCancellationNotice(
          `Return Request Submitted: Your refund request of $${item.amountPaid.toFixed(2)} has been submitted. Our team is reviewing it and will update your status.`
        );
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setRefundingItemId(null);
    }
  };

  const filteredProducts =
    activeCategory === "all"
      ? productsList
      : productsList.filter((p) => p.category === activeCategory);

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Toast Notification */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 shadow-2xl backdrop-blur-md animate-slide-up">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{cartToast}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        cartCount={cartTotalCount}
        ownedCount={ownedItems.filter((i) => i.status === "ACTIVE").length}
        onOpenCart={() => setIsCartOpen(true)}
        currentView={currentView}
        onSelectView={setCurrentView}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Success Banner */}
        {successDetails && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-emerald-900/40 border border-emerald-500/40 text-emerald-100 flex items-start justify-between gap-4 animate-slide-down">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Action Confirmed</h4>
                <p className="text-xs text-emerald-200">{successDetails.message}</p>
                {successDetails.orderId && (
                  <p className="text-[11px] font-mono text-emerald-400">
                    Order Ref: {successDetails.orderId}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSuccessDetails(null)}
              className="text-emerald-400 hover:text-white p-1"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Cancellation Notice Banner */}
        {cancellationNotice && (
          <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 text-gray-300 flex items-start justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Payment Cancelled</h4>
                <p className="text-xs text-gray-300">{cancellationNotice}</p>
              </div>
            </div>
            <button
              onClick={() => setCancellationNotice(null)}
              className="text-gray-400 hover:text-white"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic View: Store Catalog or My Vault */}
        {currentView === "store" ? (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl glass-card border border-gray-800 p-8 sm:p-10 bg-gradient-to-br from-blue-950/30 via-gray-950 to-indigo-950/40">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>College Term Academic Store & Subscriptions</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Essential College Gear & Academic Study Vaults.
                </h1>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                  Equip yourself with verified physical college equipment and unlock high-yield course lecture notes
                  on subscription passes with instant access.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => setActiveCategory("subscription_notes")}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Explore Study Notes Passes</span>
                  </button>
                  <button
                    onClick={() => setActiveCategory("essentials")}
                    className="px-5 py-2.5 rounded-2xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Physical College Gear</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Product Catalog Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">
                    {activeCategory === "all"
                      ? "All College Products & Passes"
                      : activeCategory === "essentials"
                      ? "College Hardware & Supplies"
                      : "Academic Notes Subscription Passes"}
                  </h2>
                  <p className="text-xs text-gray-400">
                    Showing {filteredProducts.length} verified item(s) ready for checkout
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onPreviewNotes={setPreviewProduct}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <MyVaultSection
            ownedItems={ownedItems}
            onCancelAndRefund={handleCancelAndRefund}
            onReadNotes={(product) => setPreviewProduct(product)}
            onExploreStore={() => {
              setCurrentView("store");
              setActiveCategory("all");
            }}
            refundingItemId={refundingItemId}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={handleProceedToInvoice}
        isGeneratingInvoice={isGeneratingInvoice}
      />

      {/* Official PayPal Sandbox Invoice Viewer Modal */}
      <InvoiceViewerModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={currentInvoice}
        onConfirmSettlement={handleConfirmPaid}
        onCancel={handleDeclineInvoice}
        onSimulateDecline={() => handleExecutePayment("INSTRUMENT_DECLINED")}
        loadingPayment={loadingPayment}
      />

      {/* Revenue Guardian Autonomous Failure Recovery Modal */}
      <FailureTriageModal
        isOpen={!!declineDetails}
        onClose={() => setDeclineDetails(null)}
        declineData={declineDetails}
      />

      {/* Notes Curriculum Preview Modal */}
      <NotesPreviewModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-gray-950 py-8 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 CampusVault Inc. Secure PayPal Checkout & Subscriptions.</p>
          <p className="text-[11px] text-gray-600">
            Official Academic Study Pass & Equipment Store for College Students.
          </p>
        </div>
      </footer>
    </div>
  );
}
