import { Outlet } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ConfigurationSummary } from "../config/ConfigurationSummary";

export function SiteShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pt-24">
        <Outlet />
      </main>
      <ConfigurationSummary />
      <SiteFooter />
    </div>
  );
}
