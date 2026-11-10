"use client";

import React, { useState } from "react";
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [refundingItemId, setRefundingItemId] = useState<string | null>(null);

  // Student Owned Items & Subscriptions
  // Seeded with representative examples so the user can immediately demonstrate both policy paths!
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

  // Status banners & modals
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

  // Cart operations: Just adds to cart without opening drawer
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    setCartToast(`Added "${product.name}" to cart`);
    setTimeout(() => {
      setCartToast(null);
    }, 2500);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Step 1: Open Payment -> Generates official PayPal Invoice from payment.lalithdev.tech
  const handleOpenPayment = async () => {
    if (cart.length === 0) return;
    setIsGeneratingInvoice(true);
    setCancellationNotice(null);
    setSuccessDetails(null);

    try {
      const res = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          customer,
          currency: "USD",
          dueDays: 15,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate invoice from payment.lalithdev.tech");
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

    setCart([]);
    setCurrentView("vault");
  };

  // Step 2B: Decline Simulation for demonstrating Revenue Guardian
  const handleExecutePayment = async (
    mockCode?: "INSTRUMENT_DECLINED" | "TRANSACTION_REFUSED" | "NONE"
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

  // Step 3: Cancellation & Refund Flow based on Policy in ~/Projects/PayPal
  const handleCancelAndRefund = async (item: OwnedItem, reason: string) => {
    setRefundingItemId(item.id);
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: item.orderId,
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
        // Under $25 ceiling -> Auto Refunded!
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
          message: `Cancellation Approved: Refund of $${item.amountPaid.toFixed(2)} was automatically processed (under $25 policy ceiling)!`,
        });
      } else {
        // Over $25 ceiling -> Raised Approval in Approvals Inbox!
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
          `Refund of $${item.amountPaid.toFixed(2)} exceeds the $25 policy ceiling. Approval request raised in Approvals Inbox on payment.lalithdev.tech!`
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
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === activeCategory);

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <Header
        cartCount={cartTotalCount}
        ownedCount={ownedItems.filter((i) => i.status === "ACTIVE").length}
        onOpenCart={() => setIsCartOpen(true)}
        currentView={currentView}
        onSelectView={setCurrentView}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* Floating Add-to-Cart Toast */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl glass-card border border-blue-500/40 text-white text-xs flex items-center gap-3 shadow-2xl animate-fade-in">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-white">{cartToast}</p>
            <p className="text-[11px] text-gray-400">
              Cart updated ({cartTotalCount} {cartTotalCount === 1 ? "item" : "items"}). Open cart when ready.
            </p>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="ml-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20"
          >
            View Cart
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Success Banner */}
        {successDetails && (
          <div className="p-5 rounded-3xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center justify-between gap-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Action Successful!</h4>
                <p className="text-xs text-emerald-300">{successDetails.message}</p>
                {successDetails.captureId && (
                  <span className="text-[11px] font-mono text-emerald-400">
                    Capture ID: {successDetails.captureId}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSuccessDetails(null)}
              className="px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-xs text-white font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Cancellation Notice Banner */}
        {cancellationNotice && (
          <div className="p-5 rounded-3xl bg-gray-900 border border-gray-700 text-gray-300 flex items-center justify-between gap-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Payment Cancelled</h4>
                <p className="text-xs text-gray-300">{cancellationNotice}</p>
              </div>
            </div>
            <button
              onClick={() => setCancellationNotice(null)}
              className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-white font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* VIEW 1: MY VAULT & SUBSCRIPTIONS */}
        {currentView === "vault" ? (
          <MyVaultSection
            ownedItems={ownedItems}
            onCancelAndRefund={handleCancelAndRefund}
            onReadNotes={(p) => setPreviewProduct(p)}
            onExploreStore={() => setCurrentView("store")}
            refundingItemId={refundingItemId}
          />
        ) : (
          /* VIEW 2: STORE CATALOG */
          <>
            {/* Hero Section */}
            <section className="relative rounded-3xl overflow-hidden glass-card p-8 sm:p-12 border border-gray-800">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative max-w-3xl space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Campus Semester Supplies & Notes Pass</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  College Supplies & Notes. <br />
                  <span className="gradient-text">Instant Invoice & Auto-Refund.</span>
                </h1>

                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  Add items to cart at your pace. Click checkout to generate an official invoice from{" "}
                  <code className="text-blue-400 bg-gray-900 px-1.5 py-0.5 rounded font-mono">
                    payment.lalithdev.tech
                  </code>
                  . Once paid, items are stored in your <strong>Owned Vault</strong>, where you can test
                  policy cancellations and auto-refunds under the $25 limit or approvals over $25.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-300">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Auto-Invoice via payment.lalithdev.tech</span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Auto-Refund Ceiling: $25.00</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section Filters */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  {activeCategory === "all"
                    ? "All Campus Items"
                    : activeCategory === "essentials"
                    ? "College Supplies & Lab Equipment"
                    : "Student Academic Notes Subscriptions"}
                </h2>
                <span className="text-xs text-gray-500 font-mono">
                  ({filteredProducts.length} items)
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeCategory === "all"
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveCategory("essentials")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeCategory === "essentials"
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Supplies
                </button>
                <button
                  onClick={() => setActiveCategory("subscription_notes")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeCategory === "subscription_notes"
                      ? "bg-purple-900/50 text-purple-300"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Subscriptions
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onPreviewNotes={(p) => setPreviewProduct(p)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-800/80 bg-gray-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2 text-gray-400">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white">CampusVault Student Store</span>
            <span>•</span>
            <span>Invoicing & Refund Bridge via payment.lalithdev.tech</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <span>Revenue Guardian Manager</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="http://localhost:3000/approvals"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <span>Approvals Inbox</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="http://localhost:3000/invoices"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <span>Invoices</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="http://localhost:3000/events"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <span>Live Events</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={handleOpenPayment}
      />

      {/* Loading Overlay while generating invoice */}
      {isGeneratingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="p-8 rounded-3xl glass-card border border-blue-500/30 text-center space-y-4 max-w-sm">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white">Generating PayPal Invoice</h3>
            <p className="text-xs text-gray-400">
              Connecting to <span className="text-blue-400 font-mono">payment.lalithdev.tech</span> to
              create your invoice...
            </p>
          </div>
        </div>
      )}

      {/* The Invoice Viewer & Decision Modal: Strictly Pay Now or Cancel */}
      <InvoiceViewerModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={currentInvoice}
        onConfirmSettlement={handleConfirmPaid}
        onCancel={handleDeclineInvoice}
        onSimulateDecline={() => handleExecutePayment("INSTRUMENT_DECLINED")}
        loadingPayment={loadingPayment}
      />

      {/* Notes Preview Modal */}
      <NotesPreviewModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Payment Decline Triage Modal */}
      <FailureTriageModal
        isOpen={Boolean(declineDetails)}
        onClose={() => setDeclineDetails(null)}
        declineData={declineDetails}
        onRetryPayment={() => setIsInvoiceModalOpen(true)}
      />
    </div>
  );
}
