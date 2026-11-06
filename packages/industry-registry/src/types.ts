import type { LocaleText } from '@triunder/domain';
import type { ThemePair } from '@triunder/theme-system';

/**
 * An industry is metadata plus vocabulary. Behavior lives in a demo
 * definition. Adding an industry means adding one entry to `industries`
 * and a demonstrated solution in @triunder/demo-engine. The test matrix
 * reads this array; do not keep a second list in tests.
 */
export interface IndustryDefinition {
  slug: string;
  name: LocaleText;
  description: LocaleText;
  problem: LocaleText;
  icon: string;
  theme: ThemePair;
  /** Canonical terms the showroom uses when it is not rendering an entity label. */
  terminology: {
    subject: LocaleText;
    actor: LocaleText;
    event: LocaleText;
    place: LocaleText;
    work: LocaleText;
  };
  workflows: LocaleText[];
  metrics: LocaleText[];
  featuredModules: string[];
  integrations: LocaleText[];
  /** Must match a demo whose industry slug is this one. */
  primarySolution: string;
}
