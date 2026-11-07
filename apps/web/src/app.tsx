import { Route, Routes } from "react-router-dom";
import { AccountPage } from "./pages/account";
import { AdminPage } from "./pages/admin";
import { ForgotPage, LoginPage, RegisterPage, ResetPage } from "./pages/auth";
import { DemoPage } from "./pages/demo";
import { HomePage } from "./pages/home";
import { InquiryPage } from "./pages/inquiry";
import { NotFoundPage, PrivacyPage } from "./pages/privacy";
import { ProjectPage } from "./pages/project";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects/:slug" element={<ProjectPage />} />
      <Route path="/explore/:industry/:solution" element={<DemoPage />} />
      <Route path="/inquiry" element={<InquiryPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPage />} />
      <Route path="/reset-password" element={<ResetPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
