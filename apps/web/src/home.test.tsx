import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./app";
import { LocaleProvider } from "./lib/locale";
import { SessionProvider } from "./lib/session";
import { ThemeProvider } from "./lib/theme";

function renderAt(path = "/") {
  return render(
    <ThemeProvider>
      <LocaleProvider>
        <SessionProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </SessionProvider>
      </LocaleProvider>
    </ThemeProvider>,
  );
}

describe("homepage selectors", () => {
  it("shows industry and solution before any supporting section", async () => {
    renderAt();
    const industry = await screen.findByTestId("cascade-trigger-industry");
    const solution = screen.getByTestId("cascade-trigger-solution");
    const headline = screen.getByRole("heading", {
      name: /we engineer digital systems that simplify complex operations/i,
    });
    expect(
      industry.compareDocumentPosition(screen.getByRole("heading", { name: "Selected work" })),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(headline.compareDocumentPosition(industry)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(solution).toBeDisabled();
  });

  it("opens a full-screen cascade and keeps unmatched industries visible", async () => {
    const user = userEvent.setup();
    renderAt();
    await user.click(await screen.findByTestId("cascade-trigger-industry"));
    const dialog = await screen.findByRole("dialog", { name: /choose an industry/i });
    expect(within(dialog).getByRole("option", { name: /Healthcare/ })).toBeInTheDocument();
    expect(within(dialog).getByRole("option", { name: /Manufacturing/ })).toBeInTheDocument();
    const search = within(dialog).getByPlaceholderText(/search industries/i);
    await user.clear(search);
    await user.type(search, "health");
    await waitFor(() => {
      const options = within(dialog).getAllByRole("option");
      expect(options[0]).toHaveTextContent(/Healthcare/);
      expect(options[0]).toHaveClass("is-match");
    });
    expect(within(dialog).getByRole("option", { name: /Manufacturing/ })).toBeInTheDocument();
  });

  it("filters solutions and enables the demonstration link", async () => {
    const user = userEvent.setup();
    renderAt();
    await user.click(await screen.findByTestId("cascade-trigger-industry"));
    await user.click(screen.getByRole("option", { name: /Healthcare/ }));
    const solution = screen.getByTestId("cascade-trigger-solution");
    expect(solution).toBeEnabled();
    await user.click(solution);
    expect(screen.queryByRole("option", { name: /Robotics/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /Scheduling/ }));
    expect(screen.getByRole("link", { name: "Explore this solution" })).toHaveAttribute(
      "href",
      "/explore/healthcare/scheduling",
    );
  });

  it("keeps the selection in the URL", async () => {
    const user = userEvent.setup();
    renderAt();
    await user.click(await screen.findByTestId("cascade-trigger-industry"));
    await user.click(screen.getByRole("option", { name: /Manufacturing/ }));
    expect(screen.getByTestId("cascade-trigger-industry")).toHaveTextContent(/Manufacturing/);
  });
});

describe("demonstration", () => {
  it("runs a retail sale that changes stock", async () => {
    const user = userEvent.setup();
    renderAt("/explore/retail/point-of-sale");
    const add = await screen.findAllByRole("button", { name: "Add" });
    const firstAdd = add[0];
    if (!firstAdd) throw new Error("expected an add button");
    await user.click(firstAdd);
    await user.click(screen.getByTestId("compose-order"));
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });

  it("stops a simulated robot", async () => {
    const user = userEvent.setup();
    renderAt("/explore/manufacturing/robotics");
    expect(await screen.findByText(/Simulated hardware/)).toBeInTheDocument();
    const stop = screen.getAllByRole("button", { name: "Emergency stop" })[0];
    if (!stop) throw new Error("expected an emergency stop");
    await user.click(stop);
    expect(screen.getByRole("status")).toHaveTextContent(/zero/i);
  });
});
