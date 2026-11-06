export const en = {
  brand: {
    name: "Triunder",
    tagline: "Interactive Software & Engineering Showroom",
    valueProp:
      "Don't just hear what can be built. Configure it, experience it, and imagine it running your business.",
  },
  nav: {
    explore: "Explore",
    projects: "Projects",
    capabilities: "Capabilities",
    builder: "Project builder",
    contact: "Contact",
    dashboard: "Dashboard",
    admin: "Admin",
    signIn: "Sign in",
    signOut: "Sign out",
    register: "Register",
  },
  home: {
    brand: "Triunder",
    headline: "Engineer systems you can experience.",
    support:
      "Explore industries, configure solutions, and interact with realistic applications — from software platforms to hardware-integrated systems.",
    ctaExplore: "Enter the showroom",
    ctaBuilder: "Start configuring",
    industriesHeading: "Industries",
    industriesSupport: "Choose a domain. Triunder adapts terminology, workflows, and demos.",
    featuredHeading: "Featured demonstrations",
    featuredSupport: "Fully interactive applications with seeded data and real workflows.",
    capabilitiesHeading: "Engineering depth",
    capabilitiesSupport:
      "Full-stack software, embedded systems, IoT, automation, AI, and cloud infrastructure — demonstrated as working systems.",
    projectsHeading: "Selected work",
    projectsSupport: "Real engineering projects, clearly distinguished from showroom demos.",
    simulationNote: "All showroom data is simulated and fictional.",
  },
  explore: {
    selectIndustry: "Select industry",
    selectSolution: "Select solution",
    selectComplexity: "Select complexity",
    enterDemo: "Enter application",
    incompatible: "This solution is not available for the selected industry.",
    modules: "Modules",
    configuration: "Configuration",
    level: {
      starter: "Starter",
      professional: "Professional",
      enterprise: "Enterprise",
    },
  },
  config: {
    industry: "Industry",
    solution: "Solution",
    complexity: "Complexity",
    modules: "Modules",
    save: "Save configuration",
    share: "Share",
    generateRequirements: "Generate requirements",
    requestConsultation: "Request consultation",
    collapse: "Collapse",
    expand: "Expand summary",
  },
  demo: {
    search: "Search",
    filter: "Filter",
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    empty: "No records yet.",
    simulated: "Simulated environment",
    notifications: "Notifications",
  },
  auth: {
    email: "Email",
    password: "Password",
    firstName: "First name",
    lastName: "Last name",
    optional: "Optional",
  },
  common: {
    loading: "Loading…",
    error: "Something went wrong.",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    back: "Back",
    next: "Next",
    continue: "Continue",
  },
};

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type MessageTree = DeepStringify<typeof en>;
