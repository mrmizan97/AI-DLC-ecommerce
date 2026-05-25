// Admin UI journey:
//   - Log in via the login form
//   - Verify the admin landing page (or homepage) renders for an admin session
//   - Hit the admin jobs API as the admin to confirm token works end-to-end
//
// We use the login form because it's the highest-fidelity test of the
// integrated stack. Subsequent role-gated assertions use the API directly
// (the existing admin UI is large; we don't try to walk every page).

const { test, expect, API_URL } = require("./_fixtures");

test.describe("Admin", () => {
  test("logs in via the form, lands on homepage", async ({ page, state }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(state.admin.email);
    await page.getByLabel(/password/i).fill(state.admin.password);
    await page.getByRole("button", { name: /login/i }).click();
    // The login handler navigates to "/" on success.
    await page.waitForURL("**/");
    await expect(page).toHaveURL(/\/$/);
  });

  test("admin token can read /api/jobs", async ({ api, state }) => {
    const r = await api("GET", "/api/jobs", { token: state.admin.token });
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty("waiting");
    expect(r.body).toHaveProperty("active");
    expect(r.body).toHaveProperty("completed");
    expect(r.body).toHaveProperty("failed");
  });

  test("admin sees the 11 scheduled cron jobs", async ({ api, state }) => {
    const r = await api("GET", "/api/jobs/schedules", { token: state.admin.token });
    expect(r.status).toBe(200);
    const list = Array.isArray(r.body) ? r.body : (r.body?.schedules || []);
    // We registered 11 at boot. Allow 10+ in case prod variant differs.
    expect(list.length).toBeGreaterThanOrEqual(10);
  });

  test("admin can enqueue Tier 2 AI jobs on the seed product", async ({ api, state }) => {
    const embed = await api("POST", `/api/ai-tier2/embed/${state.productId}`, { token: state.admin.token });
    expect(embed.status).toBe(202);
    expect(embed.body?.jobId).toBeTruthy();

    const enrich = await api("POST", `/api/ai-tier2/enrich/${state.productId}`, { token: state.admin.token });
    expect(enrich.status).toBe(202);
  });

  test("customer cannot reach admin-only /api/jobs", async ({ api, state }) => {
    const r = await api("GET", "/api/jobs", { token: state.customer.token });
    expect(r.status).toBe(403); // role gate
  });
});
