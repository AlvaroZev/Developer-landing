import { createContext, useContext } from "react";
import type { ProjectConfiguration } from "@triunder/domain";

interface ConfigContextValue {
  configuration: ProjectConfiguration | null;
  updateConfiguration: (
    partial: Partial<ProjectConfiguration> &
      Pick<ProjectConfiguration, "industryId" | "solutionId">,
  ) => void;
  clearConfiguration: () => void;
}

export const ConfigContext = createContext<ConfigContextValue>({
  configuration: null,
  updateConfiguration: () => undefined,
  clearConfiguration: () => undefined,
});

export function useConfiguration() {
  return useContext(ConfigContext);
}
