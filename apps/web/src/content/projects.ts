/**
 * Real client portfolio entries for the public showroom.
 * Verified facts only. Do not invent metrics, tech stacks, or screenshots.
 * KidStore admin UI screenshots are unavailable here — use the labeled workflow
 * illustration instead of fabricating a dashboard capture.
 */

export type LocaleCopy = { en: string; es: string };

export interface ProjectShot {
  src: string;
  alt: LocaleCopy;
  caption: LocaleCopy;
  kind: "screenshot" | "illustration";
}

export interface ProjectTestimonial {
  quote: LocaleCopy;
  attribution: string;
}

export interface ProjectCase {
  slug: "kidstore" | "licita-agent";
  client: string;
  website: string;
  websiteLabel: LocaleCopy;
  category: LocaleCopy;
  headline: LocaleCopy;
  summary: LocaleCopy;
  overview: LocaleCopy;
  challenge: LocaleCopy;
  solution: LocaleCopy;
  contributions: LocaleCopy[];
  capabilities: LocaleCopy[];
  impact: LocaleCopy;
  impactNote?: LocaleCopy;
  testimonial?: ProjectTestimonial;
  technologies: string[];
  cover: string;
  shots: ProjectShot[];
  featured: boolean;
}

const t = (en: string, es: string): LocaleCopy => ({ en, es });

export const projects: ProjectCase[] = [
  {
    slug: "licita-agent",
    client: "Licita Agent",
    website: "https://home.licita-agent.com/",
    websiteLabel: t("Visit Licita Agent", "Visitar Licita Agent"),
    category: t("AI product engineering", "Producto e ingeniería con IA"),
    headline: t(
      "From complex procurement research to an AI-powered advisory platform.",
      "De una investigación compleja en contrataciones a una plataforma de asesoría con IA.",
    ),
    summary: t(
      "Designed and engineered an AI-powered procurement advisory platform for Peru, combining document intelligence, retrieval-augmented generation, vector search, and a complete application experience.",
      "Diseñamos e implementamos una plataforma de asesoría en contrataciones públicas para el Perú, con análisis de documentos, búsqueda inteligente y una aplicación completa.",
    ),
    overview: t(
      "Licita Agent helps procurement specialists ask questions about Peruvian public-procurement regulations and procedure documents, with answers grounded in cited sources.",
      "Licita Agent ayuda a especialistas en contrataciones a hacer preguntas sobre la normativa peruana y las bases de un procedimiento, con respuestas respaldadas por fuentes citadas.",
    ),
    challenge: t(
      "Public procurement consulting depends on dense regulatory research and document interpretation. Specialized expertise stays concentrated, and repetitive document work consumes expert time.",
      "La consultoría en contrataciones públicas depende de revisar normativa compleja e interpretar documentos extensos. El conocimiento queda en pocas personas y el trabajo repetitivo con documentos consume el tiempo de los expertos.",
    ),
    solution: t(
      "Triunder designed and built the complete product: conversational assistance over an official corpus, private document spaces, authentication, payments, and production-oriented application architecture.",
      "Triunder diseñó y construyó el producto completo: un asistente conversacional sobre documentación oficial, espacios privados para documentos, autenticación, pagos y una arquitectura pensada para producción.",
    ),
    contributions: [
      t("End-to-end product design and engineering", "Diseño e ingeniería integral del producto"),
      t(
        "AI conversational assistant with source-grounded answers",
        "Asistente de IA conversacional con respuestas respaldadas por fuentes",
      ),
      t(
        "Retrieval-Augmented Generation over official documents",
        "RAG sobre documentos oficiales",
      ),
      t(
        "Document ingestion, processing, and retrieval workflows",
        "Flujos de carga, procesamiento y consulta de documentos",
      ),
      t("PostgreSQL and pgvector-based vector search", "Búsqueda vectorial con PostgreSQL y pgvector"),
      t(
        "User-specific document isolation and privacy controls",
        "Documentos privados por usuario y controles de privacidad",
      ),
      t(
        "Authentication, account management, and administration",
        "Autenticación, gestión de cuentas y administración",
      ),
      t("Stripe payment and subscription experience", "Pagos y suscripciones con Stripe"),
      t(
        "Document expiration and deletion of embeddings with conversations",
        "Vencimiento de documentos y eliminación de datos asociados al cerrar conversaciones",
      ),
    ],
    capabilities: [
      t(
        "Ask questions about procurement regulations and uploaded bases",
        "Hacer preguntas sobre la normativa y las bases cargadas",
      ),
      t(
        "Retrieve grounded answers with article, document, and page citations",
        "Obtener respuestas con citas de artículo, documento y página",
      ),
      t(
        "Maintain private document collections per user",
        "Mantener colecciones privadas de documentos por usuario",
      ),
      t(
        "Manage accounts and commercial access to the platform",
        "Gestionar cuentas y el acceso comercial a la plataforma",
      ),
    ],
    impact: t(
      "The product publicly estimates a reduction in expert work from about 40 hours to about 8 hours per procurement process, based on interviews with the sponsoring consultancy.",
      "El producto estima públicamente una reducción del trabajo de los expertos de unas 40 horas a unas 8 horas por proceso de contratación, según entrevistas con la consultora que impulsó el producto.",
    ),
    impactNote: t(
      "Presented as the product's stated estimate, not an independently verified guarantee. Results vary by procedure and team.",
      "Esta cifra es la estimación publicada por el producto, no una garantía verificada de forma independiente. Los resultados varían según el procedimiento y el equipo.",
    ),
    testimonial: {
      quote: t(
        "Excellent work. The product shipped on schedule, with no cost overrun and no complications. The documentation was very detailed.",
        "Excelente trabajo. El producto salió en el plazo establecido, sin sobrecostos ni complicaciones. La documentación fue muy detallada.",
      ),
      attribution: "Amador Z.",
    },
    technologies: [
      "RAG",
      "PostgreSQL",
      "pgvector",
      "Stripe",
      "Authentication",
      "Document pipelines",
    ],
    cover: "/projects/licita-agent/landing-desktop.png",
    shots: [
      {
        src: "/projects/licita-agent/landing-desktop.png",
        alt: t("Licita Agent landing page", "Página de inicio de Licita Agent"),
        caption: t(
          "The public landing page introduces the product for procurement specialists in Peru — what it helps with, how the advisory experience works, and why teams use it to move faster through dense regulatory research.",
          "La página de inicio presenta el producto a especialistas en contrataciones en el Perú: qué resuelve, cómo funciona la asesoría y por qué los equipos lo usan para avanzar más rápido en investigaciones normativas exigentes.",
        ),
        kind: "screenshot",
      },
      {
        src: "/projects/licita-agent/pricing-monthly.png",
        alt: t("Licita Agent subscription plans", "Planes de suscripción de Licita Agent"),
        caption: t(
          "Clear monthly subscription plans make it easy to choose the right access level. Pricing, included usage, and plan differences are laid out so teams can start without a complicated sales conversation.",
          "Los planes de suscripción mensual facilitan elegir el nivel de acceso adecuado. El precio, el uso incluido y las diferencias entre planes se muestran con claridad, para que los equipos puedan empezar sin un proceso comercial complicado.",
        ),
        kind: "screenshot",
      },
      {
        src: "/projects/licita-agent/chat-desktop.png",
        alt: t("Licita Agent chat assistant", "Asistente de chat de Licita Agent"),
        caption: t(
          "Inside the product, specialists ask everyday questions about regulations and tender documents in a simple chat. Answers come back in plain language, with references they can open and check, so research feels more like a conversation than digging through long PDFs.",
          "Dentro del producto, los especialistas hacen preguntas cotidianas sobre normativa y bases en un chat sencillo. Las respuestas llegan en lenguaje claro, con referencias que pueden abrir y revisar. Investigar se siente más como una conversación que como recorrer PDFs largos.",
        ),
        kind: "screenshot",
      },
    ],
    featured: true,
  },
  {
    slug: "kidstore",
    client: "KidStore Perú",
    website: "https://www.kidstoreperu.com/",
    websiteLabel: t("Visit KidStore Perú", "Visitar KidStore Perú"),
    category: t("Operations dashboard", "Panel operativo"),
    headline: t(
      "From manual game-based fulfillment to a centralized dashboard workflow.",
      "Del cumplimiento manual dentro del juego a un flujo centralizado en un panel.",
    ),
    summary: t(
      "A custom order-fulfillment administration dashboard that let operators process marketplace orders without repeating the previous multi-step game login workflow.",
      "Un panel de administración a medida para el cumplimiento de pedidos, que permitió a los operadores procesar órdenes del marketplace sin repetir el flujo anterior de inicio de sesión en el juego.",
    ),
    overview: t(
      "KidStore Perú operates an online marketplace for gaming-related products and services across titles such as Fortnite, Wild Rift, Marvel Rivals, Pokémon GO, Roblox, and Genshin Impact.",
      "KidStore Perú opera un marketplace en línea de productos y servicios para juegos como Fortnite, Wild Rift, Marvel Rivals, Pokémon GO, Roblox y Genshin Impact.",
    ),
    challenge: t(
      "Order fulfillment required operators to perform several manual steps, including logging into game environments to carry out transfers. The process created a bottleneck and made concurrent fulfillment harder.",
      "El cumplimiento de pedidos exigía varios pasos manuales, incluido iniciar sesión en entornos de juego para realizar transferencias. El proceso generaba un cuello de botella y dificultaba el trabajo concurrente.",
    ),
    solution: t(
      "Triunder delivered a custom administration dashboard for order fulfillment. Fulfillers could process orders directly from the dashboard, collapsing the previous repetitive workflow into a short sequence of dashboard actions and supporting multiple operators at once.",
      "Triunder entregó un panel de administración a medida para el cumplimiento de pedidos. Los operadores podían procesar órdenes directamente desde el panel, reduciendo el flujo repetitivo a pocas acciones y permitiendo trabajo concurrente.",
    ),
    contributions: [
      t("Custom order fulfillment dashboard", "Panel de cumplimiento de pedidos a medida"),
      t("Direct fulfillment actions from the administration interface", "Acciones de cumplimiento directas desde la administración"),
      t("Reduction of a multi-step operational process to a few dashboard actions", "Reducción de un proceso de varios pasos a pocas acciones en el panel"),
      t("Support for concurrent fulfillers", "Soporte para varios operadores en paralelo"),
      t("Improved visibility into fulfillment operations", "Mayor visibilidad de la operación de cumplimiento"),
    ],
    capabilities: [
      t("Process marketplace orders from one administration surface", "Procesar pedidos del marketplace desde una sola superficie administrativa"),
      t("Coordinate multiple fulfillers without sharing a game session workflow", "Coordinar varios operadores sin compartir el flujo de sesión en el juego"),
      t("Keep fulfillment status visible to the operations team", "Mantener visible el estado de cumplimiento para el equipo operativo"),
    ],
    impact: t(
      "Operational transformation from manual, repetitive game-based fulfillment to a centralized dashboard-driven workflow with fewer steps and concurrent processing.",
      "Transformación operativa: del cumplimiento manual y repetitivo dentro del juego a un flujo centralizado en panel, con menos pasos y procesamiento concurrente.",
    ),
    impactNote: t(
      "No fabricated throughput percentage is claimed. The known outcome is a shorter operational path measured in a few dashboard actions.",
      "No se afirma un porcentaje inventado de productividad. El resultado conocido es un camino operativo más corto, medido en pocas acciones del panel.",
    ),
    technologies: [],
    cover: "/projects/kidstore/storefront-desktop.png",
    shots: [
      {
        src: "/projects/kidstore/storefront-desktop.png",
        alt: t("KidStore Perú public storefront", "Tienda pública de KidStore Perú"),
        caption: t("Public marketplace storefront", "Vitrina pública del marketplace"),
        kind: "screenshot",
      },
      {
        src: "/projects/kidstore/storefront-mobile.png",
        alt: t("KidStore Perú on mobile", "KidStore Perú en móvil"),
        caption: t("Mobile storefront presentation", "Presentación móvil de la tienda"),
        kind: "screenshot",
      },
      {
        src: "/projects/kidstore/og.png",
        alt: t("KidStore Perú public brand image", "Imagen pública de marca de KidStore Perú"),
        caption: t("Public marketplace brand asset", "Activo público de marca del marketplace"),
        kind: "screenshot",
      },
      {
        src: "/projects/kidstore/workflow.svg",
        alt: t(
          "Illustrative fulfillment workflow, not a real admin screenshot",
          "Flujo ilustrativo de cumplimiento, no una captura real del panel",
        ),
        caption: t(
          "Illustrative workflow of the dashboard contribution. Not a screenshot of the private admin system.",
          "Flujo ilustrativo de la contribución del panel. No es una captura del sistema administrativo privado.",
        ),
        kind: "illustration",
      },
    ],
    featured: true,
  },
];

export function getProject(slug: string): ProjectCase | undefined {
  return projects.find((project) => project.slug === slug);
}
