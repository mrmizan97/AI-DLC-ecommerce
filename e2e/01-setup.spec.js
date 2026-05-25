// Bootstraps shared state for every other spec:
//   - registers a fresh admin and customer (unique emails per run)
//   - logs each in to capture a JWT
//   - creates a product so other specs have something to act on
// Writes everything to e2e/.auth/state.json.

const { test, expect, saveState, API_URL } = require("./_fixtures");

test("setup: register admin + customer + create a seed product", async ({ api }) => {
  const stamp = Date.now();
  const admin = { name: "E2E Admin", email: `e2e-admin-${stamp}@test.com`, password: "e2e123!@#", phone: "01700000001", role: "admin" };
  const cust  = { name: "E2E Cust",  email: `e2e-cust-${stamp}@test.com`,  password: "e2e123!@#", phone: "01711111112" };

  const a = await api("POST", "/api/auth/register", { body: admin });
  expect([200, 201]).toContain(a.status);
  expect(a.body?.data?.token).toBeTruthy();

  const c = await api("POST", "/api/auth/register", { body: cust });
  expect([200, 201]).toContain(c.status);
  expect(c.body?.data?.token).toBeTruthy();

  // Seed a category (best effort) then a product.
  const catRes = await api("POST", "/api/categories", { token: a.body.data.token, body: { name: `E2E Cat ${stamp}`, description: "e2e" } });
  let categoryId = catRes.body?.data?.id;
  if (!categoryId) {
    const all = await api("GET", "/api/categories");
    categoryId = all.body?.data?.[0]?.id;
  }
  expect(categoryId).toBeTruthy();

  const p = await api("POST", "/api/products", {
    token: a.body.data.token,
    body: {
      name: `E2E Wireless Mouse ${stamp}`,
      description: "Ergonomic wireless mouse used by the e2e suite.",
      price: 29.99, stock: 50, category_id: categoryId,
      brand: "E2E", sku: `E2E-${stamp}`,
    },
  });
  expect([200, 201]).toContain(p.status);
  const productId = p.body?.data?.id;
  expect(productId).toBeTruthy();

  saveState({
    stamp,
    admin: { ...admin, token: a.body.data.token, id: a.body.data.user.id },
    customer: { ...cust, token: c.body.data.token, id: c.body.data.user.id },
    productId,
    categoryId,
    apiUrl: API_URL,
  });
});
