import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/600.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app";
import { LocaleProvider } from "./lib/locale";
import { SessionProvider } from "./lib/session";
import { ThemeProvider } from "./lib/theme";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("root missing");

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <SessionProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SessionProvider>
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
);
