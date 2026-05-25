// Central job handler registry.
//
// Each job module exports a pure async handler — the BullMQ worker just
// dispatches on `job.name`. This lets us unit-test handlers without Redis,
// and lets the worker file stay tiny.

const { runFlashSaleTick } = require("./flashSaleTick");
const { runStaleOrderSweep } = require("./staleOrderSweep");
const { runCouponExpiry } = require("./couponExpiry");
const { runDailySalesReport } = require("./dailySalesReport");
const { runLowStockDigest } = require("./lowStockDigest");
const { runReviewRequest } = require("./reviewRequest");
const { runActivityLogRetention } = require("./activityLogRetention");
const { runWishlistBackInStock } = require("./wishlistBackInStock");
const { runOrphanMediaCleanup } = require("./orphanMediaCleanup");
const { runAbandonedCartReminder } = require("./abandonedCartReminder");
const { runFailedPaymentRetry } = require("./failedPaymentRetry");

// Map: BullMQ job name -> async (data) => result
const handlers = {
  "flash-sale-tick":         (d) => runFlashSaleTick(d?.now ? new Date(d.now) : undefined),
  "stale-order-sweep":       (d) => runStaleOrderSweep(d || {}),
  "coupon-expiry":           (d) => runCouponExpiry(d?.now ? new Date(d.now) : undefined),
  "daily-sales-report":      (d) => runDailySalesReport(d || {}),
  "low-stock-digest":        (d) => runLowStockDigest(d || {}),
  "review-request":          (d) => runReviewRequest(d || {}),
  "activity-log-retention":  (d) => runActivityLogRetention(d || {}),
  "wishlist-back-in-stock":  (d) => runWishlistBackInStock(d || {}),
  "orphan-media-cleanup":    (d) => runOrphanMediaCleanup(d || {}),
  "abandoned-cart-reminder": (d) => runAbandonedCartReminder(d || {}),
  "failed-payment-retry":    (d) => runFailedPaymentRetry(d || {}),
};

module.exports = { handlers };
