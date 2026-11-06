import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EngineDemo } from "./EngineDemo";

describe("engine demonstration", () => {
  it("adds a Harborline product to the cart and simulates a purchase", () => {
    render(
      <EngineDemo
        industrySlug="retail"
        solutionSlug="ecommerce"
        complexity="professional"
        modules={[]}
        locale="en"
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Demonstration" });
    fireEvent.click(within(nav).getByRole("button", { name: "Catalog" }));
    expect(screen.getByText("Field notebook")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Add" })[0] as HTMLButtonElement);
    expect(screen.getByText(/Field notebook × 1/)).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Customer" }), { target: { value: "Nia Pell" } });
    fireEvent.click(screen.getByRole("button", { name: "Simulate purchase" }));
    expect(screen.getByText("The cart is empty.")).toBeTruthy();
    expect(screen.getByText(/Simulated order placed/)).toBeTruthy();
  });
});
