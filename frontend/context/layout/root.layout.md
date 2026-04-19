# Layout — Root

## File: `src/app/layout.js`

Wraps every page in the app.

---

## Structure

```
<html>
  <body>
    <Header />        ← always visible
    <main>{children}</main>
    <Footer />        ← always visible
    <Toaster />       ← react-hot-toast notifications
  </body>
</html>
```

---

## Global Styles

- Imports `globals.css` which defines CSS variables for the theme (primary orange, etc.) and Tailwind base.
- Uses Geist Sans font via `next/font/google`.

---

## Metadata

```js
title: "AI-DLC Shop — Your Online Shopping Destination"
description: "Shop electronics, fashion, and more at the best prices"
```

---

## Toaster Config

- Position: `top-right`
- Consumed by all pages via `toast.success()` / `toast.error()`.
