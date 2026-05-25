// Customer UI + API journey:
//   - Log in via the login form
//   - Browse the products page, confirm the seed product is visible
//   - Add to wishlist via the API (UI varies — API is the contract test)
//   - Place a cash order via the API
//   - Verify the customer's orders list contains it

const { test, expect } = require("./_fixtures");

test.describe("Customer", () => {
  test("logs in via the form", async ({ page, state }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(state.customer.email);
    await page.getByLabel(/password/i).fill(state.customer.password);
    await page.getByRole("button", { name: /login/i }).click();
    await page.waitForURL("**/");
  });

  test("products page renders and includes the seed product", async ({ page, state }) => {
    await page.goto("/products");
    // The product name contains the timestamp from setup so it's unique.
    await expect(page.getByText(/E2E Wireless Mouse/)).toBeVisible({ timeout: 8_000 });
  });

  test("adds the seed product to wishlist", async ({ api, state }) => {
    const r = await api("POST", "/api/wishlist", { token: state.customer.token, body: { product_id: state.productId } });
    // 201 fresh add; 409 if a prior test run already added it.
    expect([201, 409]).toContain(r.status);

    const w = await api("GET", "/api/wishlist", { token: state.customer.token });
    expect(w.status).toBe(200);
    const items = w.body?.data || [];
    expect(items.some((it) => Number(it.product_id) === Number(state.productId))).toBe(true);
  });

  test("places a cash order, sees it in the customer's order list", async ({ api, state }) => {
    const r = await api("POST", "/api/orders", {
      token: state.customer.token,
      body: {
        shipping_address: "12 E2E Street",
        phone: state.customer.phone,
        payment_method: "cash",
        items: [{ product_id: state.productId, quantity: 1 }],
      },
    });
    expect([200, 201]).toContain(r.status);
    const orderId = r.body?.data?.id || r.body?.id;
    expect(orderId).toBeTruthy();

    const mine = await api("GET", "/api/orders", { token: state.customer.token });
    expect(mine.status).toBe(200);
    const list = mine.body?.data || mine.body?.orders || [];
    expect(list.some((o) => Number(o.id) === Number(orderId))).toBe(true);
  });
});
