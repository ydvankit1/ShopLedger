# ShopLedger contributor notes

## Stack
- Node.js application using Express 4 and body-parser for JSON request parsing.
- Browser UI is static HTML, CSS, and JavaScript served from `public/`.
- Shop data is stored as JSON in `data/db.json` via `lib/store.js`.

## Module map
- `routes/products.js` — product search/listing and active coupon listing.
- `routes/orders.js` — order listing, lookup, placement, and cancellation.
- `routes/customers.js` — customer/settlement listing and Khata settlement.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export routes.
- `lib/coupons.js` — coupon lookup, validation, discount calculation, and active list.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reserve/release, and summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotal, coupon discount, and checkout totals with GST.
- `lib/reports.js` — dashboard summary and invoice/order GST reconciliation.
- `lib/store.js` — synchronous JSON database read/write and audit log append.
- `lib/tax.js` — HSN/rate resolution and CGST/SGST split.

## Commands
- Start the app: `node server.js` (the package also defines `npm start`).
- Run tests: `node --test` (Node's built-in test runner; no test files are currently present).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
