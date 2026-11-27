'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, sku, hsn, price, qty, gstRate) {
  return { name, sku, hsn, price, qty, gstRate };
}

function assertCurrent(order, expectedInvoice, expectedCheckout) {
  // Both calculations receive the exact same in-memory order lines and coupon.
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(printed, expectedInvoice);
  assert.deepEqual(
    {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total
    },
    expectedCheckout
  );
}

test('INVOICE MATCHES CHECKOUT: capped SAVE10 discount reduces taxable value', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2, undefined)
    ]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    {
      subtotal: printed.subtotal,
      discount: printed.discount,
      tax: printed.tax,
      cgst: printed.cgst,
      sgst: printed.sgst,
      total: printed.total
    },
    {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total
    }
  );
  assert.deepEqual(
    printed.rows.map(function (row) {
      return { gstPercent: row.gstPercent, lineTax: row.lineTax };
    }),
    checkout.lines.map(function (line) {
      return { gstPercent: line.gstPercent, lineTax: line.tax };
    })
  );
});

test('CURRENT BEHAVIOUR: #1001 mixed 5% and 12% items, no coupon', function () {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
      item('A2 Gir Cow Ghee 500ml', 'DRY-001', '0405', 450, 1, 12)
    ]
  };

  assertCurrent(order, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'A2 Gir Cow Ghee 500ml', sku: 'DRY-001', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  }, {
    subtotal: 1090, discount: 0, tax: 86, cgst: 43, sgst: 43, total: 1176
  });
});

test('INVOICE MATCHES CHECKOUT: #1002 SAVE10 discount is applied before GST', function () {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
      item('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2, 5)
    ]
  };

  assertCurrent(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9
  });
});

test('INVOICE MATCHES CHECKOUT: #1004 SAVE10 respects the ₹150 discount cap', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2, 5)
    ]
  };

  assertCurrent(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5
  });
});

test('CURRENT BEHAVIOUR: #1008 all 18% items, no coupon', function () {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1, 18),
      item('Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 2, 18)
    ]
  };

  assertCurrent(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  });
});
