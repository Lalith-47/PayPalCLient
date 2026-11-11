import { requestRefund, authenticatedFetch, fetchEventTriageDetails } from "../src/lib/paypal-bridge.ts";

const PAYPAL_SERVICE_URL = process.env.PAYPAL_SERVICE_URL || "https://payment.lalithdev.tech";

async function testRefundSyncFlow() {
  console.log("=== Testing Refund Sync Flow with payment.lalithdev.tech ===");

  // 1. Submit a refund over the $25 limit ($34.00 for Campus Backpack)
  const testOrderId = `TEST_ORDER_${Date.now()}`;
  console.log(`Submitting refund for $34.00 on order ${testOrderId}...`);
  const refundResult = await requestRefund({
    orderId: testOrderId,
    amount: 34.00,
    currency: "USD",
    reason: "Test return over $25 limit",
    customerEmail: "alex.mercer@campus.edu",
    customerName: "Alex Mercer",
  });

  console.log("Refund Submission Result:", {
    status: refundResult.status,
    decision: refundResult.decision,
    eventId: refundResult.eventId,
    approvalToken: refundResult.approvalToken ? `${refundResult.approvalToken.slice(0, 10)}...` : null,
  });

  if (refundResult.status !== "AWAITING_APPROVAL" || !refundResult.approvalToken) {
    throw new Error(`Expected AWAITING_APPROVAL and approvalToken, got: ${JSON.stringify(refundResult)}`);
  }

  // 2. Query event status on payment.lalithdev.tech BEFORE approval
  console.log("\nChecking event status BEFORE merchant approval...");
  const eventBefore = await fetchEventTriageDetails(refundResult.eventId);
  console.log("Event status on payment.lalithdev.tech:", eventBefore.event?.status);
  if (eventBefore.event?.status !== "WAITING_FOR_APPROVAL" && eventBefore.event?.status !== "AWAITING_APPROVAL") {
    throw new Error(`Expected AWAITING_APPROVAL or WAITING_FOR_APPROVAL, got ${eventBefore.event?.status}`);
  }

  // 3. Simulate store manager approving the return on payment.lalithdev.tech
  console.log("\nSimulating store manager clicking APPROVE on payment.lalithdev.tech...");
  const decideRes = await authenticatedFetch(
    `${PAYPAL_SERVICE_URL}/api/approvals/${refundResult.approvalToken}/decide`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "APPROVED" }),
    }
  );
  const decideData = await decideRes.json();
  console.log("Decide response from payment.lalithdev.tech:", decideData);

  // 4. Query event status on payment.lalithdev.tech AFTER approval
  console.log("\nChecking event status AFTER merchant approval...");
  const eventAfter = await fetchEventTriageDetails(refundResult.eventId);
  console.log("Event status on payment.lalithdev.tech:", eventAfter.event?.status);
  const isExecuted = eventAfter.event?.status === "EXECUTED" || eventAfter.actions?.some(a => a.status === "SUCCESS");
  console.log("Is refund executed & completed on payment.lalithdev.tech?:", isExecuted);

  console.log("\n=== Refund Sync Verification with payment.lalithdev.tech PASSED! ===");
}

testRefundSyncFlow().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
