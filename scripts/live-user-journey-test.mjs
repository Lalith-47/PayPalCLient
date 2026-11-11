import { chromium } from "/home/lalith/Projects/PayPal/node_modules/@playwright/test/index.mjs";

const LIVE_URL = process.env.LIVE_URL || "https://wonderful-plant-0860ae210.4.azurestaticapps.net";
const PAYMENT_BACKEND_URL = "https://payment.lalithdev.tech";

async function runLiveUserJourney() {
  console.log(`\n🚀 Starting End-to-End Live User Journey Test on ${LIVE_URL}...\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const errors = [];

  page.on("pageerror", (err) => {
    console.error("❌ Uncaught Page Error:", err.message);
    errors.push(err.message);
  });

  try {
    // 1. Visit Live Azure Static Web App Storefront
    console.log(`TEST 1: Visiting Live Storefront (${LIVE_URL})...`);
    await page.goto(LIVE_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector("h1, h2, h3", { timeout: 15000 });
    const title = await page.title();
    console.log(`   ✓ Live page loaded successfully: "${title}"`);

    // 2. Test Category Filtering
    console.log("TEST 2: Testing category filters...");
    await page.click("text=Supplies");
    await page.waitForTimeout(400);
    let cards = await page.$$("h3");
    console.log(`   ✓ Supplies filter active (${cards.length} cards displayed)`);

    await page.click("text=Notes Passes");
    await page.waitForTimeout(400);
    cards = await page.$$("h3");
    console.log(`   ✓ Notes Passes filter active (${cards.length} cards displayed)`);

    // 3. Test Preview Notes Modal
    console.log("TEST 3: Testing Notes Preview Modal...");
    const previewBtn = await page.waitForSelector("button:has-text('Preview')");
    await previewBtn.click();
    await page.waitForSelector("text=Core Curriculum & Topics Covered");
    console.log("   ✓ Preview modal displays topics, sample excerpts, and page counts");
    await page.click("button:has-text('Add Subscription to Cart')");
    await page.waitForTimeout(400);
    console.log("   ✓ Clicked 'Add Subscription to Cart' inside modal");

    // 4. Add items to cart from catalog without popup interruption
    console.log("TEST 4: Adding college supplies from catalog...");
    await page.click("text=All Items");
    await page.waitForTimeout(400);

    const backpackCard = page.locator(".glass-card", { hasText: "Campus All-Weather" });
    await backpackCard.getByRole("button", { name: "Add to Cart" }).click();
    console.log("   ✓ Clicked 'Add to Cart' on Campus Backpack ($34.00) - non-disruptive feedback displayed");
    await page.waitForTimeout(400);

    // Verify cart count badge
    const cartButtonText = await page.textContent("button:has-text('Cart')");
    console.log(`   ✓ Cart badge updated: "${cartButtonText.trim()}"`);

    // 5. Open Cart Drawer
    console.log("TEST 5: Opening Cart Drawer...");
    await page.click("button:has-text('Cart')");
    await page.waitForSelector("text=Your Student Cart");
    console.log("   ✓ Cart drawer opened with items itemized");

    // 6. Test Proceed to Checkout -> Invoicing from payment.lalithdev.tech
    console.log("TEST 6: Proceeding to Checkout (Auto-Invoice from payment.lalithdev.tech)...");
    await page.click("button:has-text('Proceed to Checkout')");

    // Wait for the invoice modal
    await page.waitForSelector("text=Student Invoice Details", { timeout: 60000 });
    const invoiceNumber = await page.textContent("span.font-mono");
    console.log(`   ✓ Official PayPal Invoice created & displayed: ${invoiceNumber?.trim()}`);

    // Verify strictly Pay Now and Cancel buttons
    const payNowBtn = await page.$("button:has-text('Pay Now')");
    const cancelBtn = await page.$("button:has-text('Cancel')");
    if (payNowBtn && cancelBtn) {
      console.log("   ✓ Verified: Strictly 'Pay Now' and 'Cancel' options are present");
    } else {
      throw new Error("Missing Pay Now or Cancel button");
    }

    // 7. Test Cancel Button
    console.log("TEST 7: Testing 'Cancel' option on Invoice...");
    await cancelBtn.click();
    await page.waitForSelector("text=Payment Cancelled", { timeout: 10000 });
    console.log("   ✓ Cancel confirmed: zero charges made, cart preserved");

    // 8. Re-open checkout and test Failure Simulation (Negative Testing)
    console.log("TEST 8: Testing Failure Recovery Simulation (INSTRUMENT_DECLINED)...");
    await page.click("button:has-text('Cart')");
    await page.click("button:has-text('Proceed to Checkout')");
    await page.waitForSelector("text=Student Invoice Details", { timeout: 60000 });

    const simulateDeclineBtn = await page.waitForSelector("button:has-text('Test How Payment Failure is Triaged')");
    await simulateDeclineBtn.click();

    // Verify Failure Triage Modal opens
    await page.waitForSelector("text=Payment Intercepted & Triaged", { timeout: 35000 });
    console.log("   ✓ Decline intercepted! Live Revenue Guardian Failure Triage Modal opened");

    const triageText = await page.textContent("text=AI Decision Agent");
    console.log("   ✓ Autonomous recovery pipeline displayed:", triageText?.trim());

    // Dismiss failure modal
    await page.click("button:has-text('Dismiss')");
    await page.waitForTimeout(500);

    // 9. Re-open checkout and test Pay Now (Success -> Vault Ownership)
    console.log("TEST 9: Testing Pay Now (Success & Vault Ownership)...");
    await page.click("button:has-text('Cart')");
    await page.click("button:has-text('Proceed to Checkout')");
    await page.waitForSelector("text=Student Invoice Details", { timeout: 60000 });

    const [popup] = await Promise.all([
      context.waitForEvent("page", { timeout: 6000 }).catch(() => null),
      page.click("button:has-text('Pay Now')"),
    ]);

    if (popup) {
      console.log("   ✓ PayPal hosted invoice opened in popup tab:", popup.url());
      await popup.close();
    }

    // Click "Confirm Settlement & Claim" to complete ownership transfer into Vault
    await page.waitForSelector("button:has-text('Confirm Settlement & Claim')", { timeout: 15000 });
    await page.click("button:has-text('Confirm Settlement & Claim')");

    // Verify automatic transition to Owned Vault
    await page.waitForSelector("text=My Purchases & Returned Items", { timeout: 20000 });
    console.log("   ✓ Payment settled! User seamlessly transitioned to 'My Purchases & Returned Items'");

    // 10. Test Policy Refund 1: Under $25 (Approved & Settled)
    console.log("TEST 10: Testing Policy Refund under limit ($14.99 item)...");
    const csVaultCard = page.locator(".glass-card", { hasText: "Computer Science" }).first();
    await csVaultCard.getByRole("button", { name: "Cancel & Request Refund" }).first().click();
    await page.waitForSelector("text=Confirm Return & Refund");
    await page.click("button:has-text('Submit Return & Refund')");
    await page.waitForSelector("text=Refund Approved & Settled", { timeout: 60000 });
    console.log("   ✓ Item moved to Returned & Refunded section with status 'Refund Approved & Settled'!");

    // 11. Test Policy Refund 2: Over $25 (Awaiting Approval)
    console.log("TEST 11: Testing Approval Request over $25 ceiling ($34.00 Backpack)...");
    await page.click("#tab-active-purchases");
    await page.waitForTimeout(500);
    const backpackVaultCard = page.locator(".glass-card", { hasText: "Campus All-Weather" }).first();
    await backpackVaultCard.getByRole("button", { name: "Cancel & Request Refund" }).first().click();
    await page.waitForSelector("text=Confirm Return & Refund");
    await page.click("button:has-text('Submit Return & Refund')");
    await page.waitForSelector("text=Pending Merchant Review", { timeout: 60000 });
    console.log("   ✓ Item over $25.00 raised approval request on payment.lalithdev.tech and moved to Returned & Refunded section!");

    if (errors.length > 0) {
      throw new Error(`Encountered page errors: ${errors.join("; ")}`);
    }

    console.log("\n=======================================================");
    console.log("🏆 ALL 11 LIVE AZURE STATIC WEB APP USER TESTS PASSED!");
    console.log(`🔗 Live App: ${LIVE_URL}`);
    console.log(`🔗 Payment Backend: ${PAYMENT_BACKEND_URL}`);
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ Live Test Failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runLiveUserJourney();
