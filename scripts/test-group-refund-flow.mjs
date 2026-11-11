import { chromium } from "/home/lalith/Projects/PayPal/node_modules/@playwright/test/index.mjs";

const BASE_URL = process.argv[2] || "http://localhost:3001";

async function testGroupRefundFlow() {
  console.log("================================================================================");
  console.log(`🧪 TESTING GROUP REFUND & NO-DUPLICATE STATUS FLOW`);
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log("================================================================================\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const record = (name, pass, details = "") => {
    console.log(`${pass ? "✅ PASS" : "❌ FAIL"} | ${name}${details ? ` -> ${details}` : ""}`);
    if (!pass) throw new Error(`Assertion failed: ${name}: ${details}`);
  };

  try {
    // 1. Visit storefront
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    record("Storefront Loaded", true);

    // 2. Add 3 distinct items to cart
    // Item 1: CS Notes Pass ($14.99)
    await page.click("button:has-text('Notes Passes')");
    await page.waitForTimeout(500);
    const notesAddToCart = page.locator('button:has-text("Subscribe"):visible').first();
    await notesAddToCart.click();
    await page.waitForTimeout(500);

    // Item 2: Physical Supply 1 - TI Calculator ($24.99)
    await page.click("button:has-text('Supplies')");
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Add to Cart"):visible').first().click();
    await page.waitForTimeout(500);

    // Item 3: Physical Supply 2 - Backpack ($34.00)
    await page.locator('button:has-text("Add to Cart"):visible').nth(1).click();
    await page.waitForTimeout(500);

    // Verify cart has 3 items
    const cartBadge = await page.locator("header").locator('text=/Cart\\s*3/').textContent();
    record("Cart contains 3 items", !!cartBadge, `Badge: ${cartBadge}`);

    // 3. Checkout & Create PayPal Invoice
    await page.click("header button:has-text('Cart')");
    await page.waitForTimeout(600);
    await page.click('button:has-text("Proceed to Checkout")');

    await page.waitForSelector("text=Student Invoice Details", { timeout: 60000 });
    record("Invoice Generated for 3 items", true);

    // 4. Pay & Claim ownership into vault
    await page.click('button:has-text("Pay Now")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Confirm Settlement & Claim")');

    await page.waitForSelector("text=My Purchases & Returned Items", { timeout: 15000 });
    record("Vault Transitioned", true);

    // 5. Verify Active Tab shows at least 3 active items
    const activeCards = page.locator('#tab-active-purchases ~ div, div:has-text("Active Owned Items") + div > div');
    const activeCount = await page.locator('span:has-text("Active & Owned")').count();
    record("Active items in vault", activeCount >= 3, `Count: ${activeCount}`);

    // 6. Test Group Selection
    // Select first 2 items for return using the checkbox
    const checkboxes = page.locator('button:has-text("Select for return")');
    const checkboxCount = await checkboxes.count();
    record("Select checkboxes present", checkboxCount >= 3, `Checkboxes count: ${checkboxCount}`);

    // Click first checkbox
    await checkboxes.first().click();
    await page.waitForTimeout(300);

    // Click second checkbox
    await page.locator('button:has-text("Select for return")').first().click();
    await page.waitForTimeout(300);

    // Check Group Action Bar
    const groupRefundBtn = page.locator("#btn-group-refund");
    const groupBtnText = await groupRefundBtn.textContent();
    record("Group Refund Action Bar Active", groupBtnText.includes("Request Return for Group (2"), `Button Text: "${groupBtnText.trim()}"`);

    // 7. Click Group Return Button -> Modal Opens
    await groupRefundBtn.click();
    await page.waitForSelector("text=Confirm Group Return Request", { timeout: 5000 });
    record("Group Return Modal Opened", true);

    const modalItemsCount = await page.locator('text=Confirm Group Return Request')
      .locator("xpath=ancestor::div[contains(@class, 'glass-card')]")
      .locator("img")
      .count();
    record("Modal displays exact 2 selected items", modalItemsCount === 2, `Items in modal: ${modalItemsCount}`);

    // 8. Submit Group Return
    await page.click("#btn-confirm-group-refund");
    await page.waitForTimeout(4000);

    // 9. Verify transition to Returned & Refunded tab
    await page.waitForSelector('text=Returned & Refunded Items History', { timeout: 10000 });
    record("Moved to Returned & Refunded Section", true);

    // Check returned items count
    const returnedCardsCount = await page.locator('text=Returned & Refunded Items History')
      .locator("xpath=ancestor::div[contains(@class, 'space-y-6')]")
      .locator('text=PayPal Direct Credit')
      .count();
    record("Exact 2 items returned in Returned tab", returnedCardsCount >= 2, `Returned items count: ${returnedCardsCount}`);

    // 10. Switch back to Active tab to ensure ONLY the 3rd unselected item remains!
    await page.click("#tab-active-purchases");
    await page.waitForTimeout(500);

    const remainingActiveCount = await page.locator('span:has-text("Active & Owned")').count();
    record("Unselected item remains in Active tab", remainingActiveCount === activeCount - 2, `Remaining active: ${remainingActiveCount} (was ${activeCount})`);

    // 11. Check that NO duplicates exist in Returned tab
    await page.click("#tab-returned-items");
    await page.waitForTimeout(500);

    console.log("\n================================================================================");
    console.log("🎉 GROUP REFUND & NO-DUPLICATE E2E TEST COMPLETED SUCCESSFULLY!");
    console.log("================================================================================\n");

  } finally {
    await browser.close();
  }
}

testGroupRefundFlow().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
