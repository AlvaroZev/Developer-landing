import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

async function choose(page: Page, name: string, option: RegExp) {
  await page.getByRole("combobox", { name }).click();
  await page.getByRole("option", { name: option }).click();
}

test("a visitor selects a solution, uses it, and keeps the inquiry", async ({ page }, testInfo) => {
  const email = `visitor-${Date.now()}-${testInfo.project.name}@example.com`;
  await page.goto("/");
  await page.getByRole("button", { name: "Allow analytics" }).click();
  const industry = page.getByRole("combobox", { name: "Industry" });
  const solution = page.getByRole("combobox", { name: "Solution" });
  await expect(industry).toBeVisible();
  await expect(solution).toBeVisible();
  if (testInfo.project.name === "desktop") {
    const industryBox = await industry.boundingBox();
    const solutionBox = await solution.boundingBox();
    expect(industryBox?.y ?? 9999).toBeLessThan(900);
    expect((solutionBox?.y ?? 9999) + (solutionBox?.height ?? 0)).toBeLessThan(900);
  }

  await choose(page, "Industry", /Retail/);
  await page.getByRole("combobox", { name: "Solution" }).click();
  await expect(page.getByRole("option", { name: /Robotics/ })).toHaveCount(0);
  await page.getByRole("option", { name: /Point of Sale/ }).click();
  await page.getByRole("link", { name: "Explore this solution" }).click();
  await expect(page).toHaveURL(/\/explore\/retail\/point-of-sale/);
  await page.getByRole("button", { name: "Add" }).first().click();
  await page.getByTestId("compose-order").click();
  await expect(page.getByRole("status")).toBeVisible();

  await page.getByRole("link", { name: "Start a project" }).click();
  await expect(page.getByLabel("Industry")).toHaveValue("retail");
  await expect(page.getByLabel("Solution")).toHaveValue("point-of-sale");
  await page
    .getByLabel("What problem are you trying to solve?")
    .fill("The counter closes each night without a record of which tickets moved stock.");
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByRole("heading", { name: "Inquiry received" })).toBeVisible();
  await page.getByRole("link", { name: "Create an account and keep this inquiry" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse1");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("button", { name: "Inquiries" }).click();
  await expect(page.getByText("which tickets moved stock")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Inquiries" }).click();
  await expect(page.getByText("which tickets moved stock")).toBeVisible();
});

test("critical pages have no serious accessibility violations", async ({ page }) => {
  for (const path of ["/", "/login", "/inquiry", "/explore/healthcare/scheduling"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    expect(
      results.violations.filter((item) => item.impact === "serious" || item.impact === "critical"),
    ).toEqual([]);
  }
});
