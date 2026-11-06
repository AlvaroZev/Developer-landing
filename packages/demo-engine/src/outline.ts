import {
  REQUIREMENT_SECTION_KEYS,
  readLocale,
  text,
  type Complexity,
  type Locale,
  type LocaleText,
  type RequirementSectionKey,
} from '@triunder/domain';
import { getIndustry } from '@triunder/industry-registry';
import { getModule, type ModuleDefinition } from '@triunder/module-system';
import { getSolutionBySlug } from '@triunder/solution-registry';
import { getDemo } from './catalog';

/**
 * Deterministic project brief. This is not an AI response and must never be
 * labeled as one. It also refuses to invent a price or a delivery date.
 *
 * The Go API stores briefs; it does not reimplement this wording. Section
 * keys must stay aligned with REQUIREMENT_SECTION_KEYS.
 */
export interface BriefSection {
  key: RequirementSectionKey;
  title: string;
  body: string;
  origin: 'template';
}

const titles: Record<RequirementSectionKey, LocaleText> = {
  business_context: text('Business context', 'Contexto del negocio'),
  problem_statement: text('Problem statement', 'Planteamiento del problema'),
  objectives: text('Objectives', 'Objetivos'),
  proposed_solution: text('Proposed solution', 'Solución propuesta'),
  selected_modules: text('Selected modules', 'Módulos seleccionados'),
  functional_requirements: text('Functional requirements', 'Requisitos funcionales'),
  non_functional_requirements: text('Non-functional requirements', 'Requisitos no funcionales'),
  user_roles: text('User roles', 'Roles de usuario'),
  main_workflows: text('Main workflows', 'Flujos principales'),
  data_entities: text('Data entities', 'Entidades de datos'),
  required_integrations: text('Required integrations', 'Integraciones necesarias'),
  hardware_requirements: text('Hardware requirements', 'Requisitos de hardware'),
  technical_considerations: text('Technical considerations', 'Consideraciones técnicas'),
  assumptions: text('Assumptions', 'Supuestos'),
  open_questions: text('Open questions', 'Preguntas abiertas'),
  recommended_next_steps: text('Recommended next steps', 'Próximos pasos recomendados'),
};

const HARDWARE_MODULES = new Set(['iot-monitoring', 'embedded-diagnostics', 'robotics-cell', 'maintenance']);

export function sectionTitle(key: RequirementSectionKey, locale: Locale): string {
  return readLocale(titles[key], locale);
}

export function buildScopeOutline(input: {
  industry: string;
  solution: string;
  complexity: Complexity;
  modules: readonly string[];
  description?: string;
  locale: Locale;
}): BriefSection[] {
  const industry = getIndustry(input.industry);
  const solution = getSolutionBySlug(input.solution);
  const demo = getDemo(input.industry, input.solution);
  const locale = input.locale;
  const modules = input.modules.map((id) => getModule(id)).filter((item): item is ModuleDefinition => Boolean(item));
  const industryName = industry ? readLocale(industry.name, locale) : input.industry;
  const solutionName = solution ? readLocale(solution.name, locale) : input.solution;
  const description = input.description?.trim() || (locale === 'es'
    ? 'El visitante no añadió una descripción propia.'
    : 'The visitor did not add their own description.');
  const hardware =
    solution?.category === 'hardware-engineering' || modules.some((module) => HARDWARE_MODULES.has(module.id));
  const entities = demo?.entities.map((entity) => readLocale(entity.plural, locale)).join(', ') || (locale === 'es' ? 'Por definir en el descubrimiento.' : 'To be named during discovery.');
  const workflows = (demo?.workflows ?? industry?.workflows ?? []).map((item) => readLocale(item, locale));
  const moduleLines = modules.length
    ? modules.map((module) => `${readLocale(module.name, locale)} — ${readLocale(module.description, locale)}`).join('\n')
    : locale === 'es'
      ? 'Ningún módulo opcional está seleccionado.'
      : 'No optional module is selected.';
  const dependencies = modules.flatMap((module) => module.dependencies.map((dependency) => `${module.id} → ${dependency}`));

  const bodies: Record<RequirementSectionKey, string> = {
    business_context: locale === 'es'
      ? `Industria: ${industryName}. Solución explorada: ${solutionName}. Profundidad de la demostración: ${input.complexity}. ${description}`
      : `Industry: ${industryName}. Solution explored: ${solutionName}. Demonstration depth: ${input.complexity}. ${description}`,
    problem_statement: industry ? readLocale(industry.problem, locale) : description,
    objectives: locale === 'es'
      ? `Operar un sistema de ${solutionName} para ${industryName} con la profundidad ${input.complexity}, usando la demostración Harborline solo como referencia.`
      : `Operate a ${solutionName} system for ${industryName} at ${input.complexity} depth, using the Harborline demonstration only as a reference.`,
    proposed_solution: demo
      ? `${readLocale(demo.summary, locale)} ${locale === 'es' ? 'Esto describe una demostración, no un alcance cerrado.' : 'This describes a demonstration, not a closed scope.'}`
      : locale === 'es'
        ? 'Esta combinación no tiene una demostración en vivo. El alcance tendría que definirse desde cero.'
        : 'This pairing has no live demonstration. The scope would need to be defined from scratch.',
    selected_modules: moduleLines,
    functional_requirements: workflows.length
      ? workflows.map((item) => `• ${item}`).join('\n')
      : locale === 'es'
        ? 'Los flujos concretos quedan por escribir con quien opera el proceso.'
        : 'Concrete workflows still need to be written with the person who runs the process.',
    non_functional_requirements: locale === 'es'
      ? 'Aún no hay metas de disponibilidad, retención ni concurrencia. No se deben inventar.'
      : 'Availability, retention, and concurrency targets are not set yet. They should not be invented.',
    user_roles: demo?.roles?.length
      ? demo.roles.map((role) => readLocale(role.label, locale)).join(', ')
      : locale === 'es'
        ? 'Los roles de la operación real no están definidos. Los roles de la demostración, si aparecen, son simulados.'
        : 'Real operating roles are not defined. Roles inside a demonstration, when present, are simulated.',
    main_workflows: workflows.join('\n') || moduleLines,
    data_entities: entities,
    required_integrations: [
      ...(industry?.integrations ?? []).map((item) => readLocale(item, locale)),
      ...dependencies,
    ].join('\n') || (locale === 'es' ? 'Ninguna integración está comprometida.' : 'No integration is committed.'),
    hardware_requirements: hardware
      ? locale === 'es'
        ? 'La configuración menciona hardware o control. En Triunder ese comportamiento es simulado. Un proyecto real tendría que nombrar dispositivos, protocolos y qué pasa si el enlace se cae.'
        : 'The configuration mentions hardware or control. In Triunder that behavior is simulated. A real project would have to name devices, protocols, and what happens when the link drops.'
      : locale === 'es'
        ? 'Esta configuración no indica hardware.'
        : 'This configuration does not indicate hardware.',
    technical_considerations: locale === 'es'
      ? 'La demostración guarda su estado en el navegador y, si hay sesión, en Triunder. Un sistema de producción necesitaría su propio modelo de datos, permisos y despliegue. Triunder no es un inquilino SaaS para el cliente.'
      : 'The demonstration keeps state in the browser and, when a session exists, in Triunder. A production system would need its own data model, permissions, and deployment. Triunder is not a SaaS tenant for the client.',
    assumptions: locale === 'es'
      ? 'Los datos de Harborline son ficticios. Este brief no incluye precio, fecha de entrega ni compromiso de alcance.'
      : 'Harborline data is fictional. This brief includes no price, no delivery date, and no commitment of scope.',
    open_questions: locale === 'es'
      ? '¿Quién lo opera un martes por la mañana?\n¿Qué sistema reemplaza o con cuál convive?\n¿Qué decisión no puede tomar el software?'
      : 'Who operates it on a Tuesday morning?\nWhich system does it replace, or which system does it sit beside?\nWhich decision must the software refuse to make?',
    recommended_next_steps: locale === 'es'
      ? 'Revisar este brief, corregir lo que no describe la operación, y solo entonces enviarlo con una consulta. No es una propuesta comercial.'
      : 'Review this brief, correct anything that does not describe the operation, and only then send it with an inquiry. It is not a commercial proposal.',
  };

  return REQUIREMENT_SECTION_KEYS.map((key) => ({
    key,
    title: sectionTitle(key, locale),
    body: bodies[key],
    origin: 'template' as const,
  }));
}
