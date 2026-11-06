/**
 * @triunder/demo-engine
 *
 * Operable demonstrations. Add a live industry/solution pair by appending a
 * DemoDefinition and, if the behavior is not generic, a branch in reduce.ts.
 *
 * Do not teach the React app a second copy of these rules. UI sends DemoAction
 * values and renders the state that comes back.
 */
export { getDemo, getDemoById, listDemos } from './catalog';
export { applyEffects } from './effects';
export { buildScopeOutline, sectionTitle } from './outline';
export { metricValue, queryRecords, statusCounts } from './query';
export { applyAction, cartTotalCents, nextFieldReading } from './reduce';
export { demoPath, parseLevel, parseModules } from './routes';
export {
  attachModule,
  createSession,
  navigationFor,
  restoreSession,
  schemasFor,
} from './session';
export type { DemoDefinition, DemoEngineName } from './types';
