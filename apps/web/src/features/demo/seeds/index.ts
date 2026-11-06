import type { DemoSeed } from "../engine/demo-store";
import { healthcareCrmSeed } from "./healthcare-crm";
import { realEstateCrmSeed } from "./real-estate-crm";
import { retailEcommerceSeed } from "./retail-ecommerce";
import { manufacturingMesSeed } from "./manufacturing-mes";
import { logisticsFleetSeed } from "./logistics-fleet";
import { agricultureIotSeed } from "./agriculture-iot";

/**
 * Seed factory — specialized per industry/template.
 * Generic CRM template branches on industryId for terminology-aligned data.
 */
export function getDemoSeed(templateId: string, industryId: string): DemoSeed {
  if (templateId === "crm" && industryId === "healthcare") {
    return healthcareCrmSeed();
  }
  if (templateId === "crm" && industryId === "real-estate") {
    return realEstateCrmSeed();
  }
  if (templateId === "crm") {
    // Fallback CRM for other compatible industries — still industry-aware naming via shell.
    return healthcareCrmSeed();
  }
  if (templateId === "ecommerce") return retailEcommerceSeed();
  if (templateId === "mes") return manufacturingMesSeed();
  if (templateId === "fleet") return logisticsFleetSeed();
  if (templateId === "agriculture-iot") return agricultureIotSeed();

  return {
    templateId,
    industryId,
    entities: { primary: [] },
    metrics: {},
    charts: {},
  };
}
