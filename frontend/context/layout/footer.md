# Layout — Footer

## File: `src/components/Footer.js`

Simple 4-column footer rendered on every page.

---

## Columns

1. **Customer Care** — Help Center, How to Buy, Shipping, Returns
2. **About AI-DLC** — About, Careers, Terms, Privacy
3. **Payment** — Cash on Delivery, Credit/Debit Card, Mobile Banking
4. **Follow Us** — Facebook, Instagram, Twitter

---

## Notes

- Server component (no `"use client"` needed).
- Bottom bar shows dynamic copyright year with `new Date().getFullYear()`.
- All links are placeholders (`href="#"`) — wire up when content pages are added.
