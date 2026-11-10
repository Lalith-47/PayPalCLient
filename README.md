# CampusVault - Student Store & Subscription Notes

A modern college shopping storefront featuring physical campus essentials and recurring academic study notes passes, integrated directly with the **Revenue Guardian** autonomous payment recovery engine (`/home/lalith/Projects/PayPal`).

---

## 🎓 Storefront Features

1. **Physical College Gear**:
   - TI-36X Pro Scientific Engineering Calculator
   - Architecture & Engineering Drafting Precision Kit
   - All-Weather 30L Ergonomic Tech Backpack
   - Chemistry Lab Coat & Splash Goggles Bundle
   - Reusable Cloud-Sync Smart Notebook
   - Active Noise-Cancelling Study Headphones

2. **Subscription Notes Passes**:
   - **Computer Science & Engineering Study Vault** ($14.99/mo)
   - **All-Access STEM & Humanities Semester Pass** ($9.99/mo)
   - **Pre-Med & Biology Illustrated Atlas Pass** ($12.99/mo)
   - **Finals Week Emergency Cram Pass** ($4.99/wk)
   - *Interactive Curriculum Previews* with real sample theorems and excerpts.

3. **Interactive Cart & Student Verification**:
   - Mixes physical supplies with recurring subscription passes.
   - Calculates totals with student tax exemption status.

---

## ⚡ Revenue Guardian Payment Integration

The store connects with `/home/lalith/Projects/PayPal` running on `http://localhost:3000`:
- **Orders v2 Creation**: Creates sandbox orders with line item descriptions.
- **Capture & Negative Testing**:
  - 🔴 **`INSTRUMENT_DECLINED`**: Simulates insufficient student funds or card expiry.
  - 🟠 **`TRANSACTION_REFUSED`**: Simulates bank fraud alerts.
  - 🟢 **Standard Sandbox Checkout**: Completes real capture.
- **Autonomous Recovery & Triage Console**:
  - When a payment is declined, the site launches a live triage console polling the event from Revenue Guardian.
  - Displays the AI Agent proposal, confidence score, and grounded reasoning.
  - Displays the Deterministic Policy Engine decision (`AUTO` vs `NEEDS_APPROVAL`).
  - Direct 1-click navigation to the Revenue Guardian Merchant Dashboard (`http://localhost:3000/events`, `http://localhost:3000/approvals`, `http://localhost:3000/audit`).

---

## 🚀 Running the Apps

1. **Start Revenue Guardian Manager** (Terminal 1):
   ```bash
   cd /home/lalith/Projects/PayPal
   pnpm dev
   # Runs on http://localhost:3000
   ```

2. **Start Student Store** (Terminal 2):
   ```bash
   cd /home/lalith/Projects/PayPalCLient
   pnpm dev
   # Runs on http://localhost:3001
   ```

