import { Route, Routes } from "react-router-dom";
import { SiteShell } from "../components/layout/SiteShell";
import { HomePage } from "../routes/HomePage";
import { ExploreIndustryPage } from "../routes/ExploreIndustryPage";
import { ExploreSolutionPage } from "../routes/ExploreSolutionPage";
import { DemoPage } from "../routes/DemoPage";
import { ProjectsPage } from "../routes/ProjectsPage";
import { ProjectBuilderPage } from "../routes/ProjectBuilderPage";
import { ContactPage } from "../routes/ContactPage";
import { NotFoundPage } from "../routes/NotFoundPage";

/**
 * Unified Triunder experience — marketing IS the showroom.
 * Homepage and /explore/* share one shell, design system, and configuration state.
 */
export function App() {
  return (
    <Routes>
      <Route element={<SiteShell />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExploreIndustryPage />} />
        <Route path="explore/:industrySlug" element={<ExploreIndustryPage />} />
        <Route
          path="explore/:industrySlug/:solutionSlug"
          element={<ExploreSolutionPage />}
        />
        <Route
          path="explore/:industrySlug/:solutionSlug/app/*"
          element={<DemoPage />}
        />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectSlug" element={<ProjectsPage />} />
        <Route path="project-builder" element={<ProjectBuilderPage />} />
        <Route path="project-builder/:industrySlug" element={<ProjectBuilderPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
