export type LandingTopicId =
  | "what"
  | "model"
  | "components"
  | "install"
  | "approvals"
  | "generative"
  | "theming";

export type LandingTopic = {
  /** The answer's anchor on the page. */
  id: LandingTopicId;
  question: string;
  /** The short name on the link under the conversation. */
  shortLabel: string;
  /** Word beginnings that send a typed question to this answer. */
  keywords: string[];
};

/** The questions the landing page answers, in page order. */
export const landingTopics: LandingTopic[] = [
  {
    id: "what",
    question: "What is Honest AI?",
    shortLabel: "What is it?",
    keywords: ["what is", "what's", "about", "overview", "licen", "mit", "open source", "free", "price", "cost"],
  },
  {
    id: "model",
    question: "Does it call a model for me?",
    shortLabel: "Models",
    keywords: ["model", "llm", "api", "stream", "openai", "anthropic", "gemini", "state", "props", "backend", "sdk"],
  },
  {
    id: "components",
    question: "Which components are there?",
    shortLabel: "Components",
    keywords: ["component", "which", "list", "available", "catalog", "chat", "prompt", "markdown", "table", "trace"],
  },
  {
    id: "install",
    question: "How do I install a component?",
    shortLabel: "Install",
    keywords: ["install", "setup", "set up", "cli", "npx", "npm", "pnpm", "yarn", "bun", "shadcn", "start", "requirement", "tailwind", "next"],
  },
  {
    id: "approvals",
    question: "How does an agent ask before it acts?",
    shortLabel: "Approvals",
    keywords: ["approv", "ask", "confirm", "permission", "human", "decision", "review", "risk"],
  },
  {
    id: "generative",
    question: "Can a model generate the interface itself?",
    shortLabel: "Generative UI",
    keywords: ["generat", "render", "lang", "playground", "chart", "form"],
  },
  {
    id: "theming",
    question: "Can I restyle and translate the components?",
    shortLabel: "Theming",
    keywords: ["theme", "theming", "style", "restyle", "dark", "token", "color", "translat", "label", "locali", "i18n", "accessib", "screen reader", "custom"],
  },
];

/** The id of the heading that holds a topic's question. */
export function landingQuestionId(id: LandingTopicId) {
  return `${id}-question`;
}

/**
 * The topic whose keywords a typed question mentions most, or null when it
 * mentions none. A tie goes to the topic that comes first on the page.
 */
export function findLandingTopic(text: string): LandingTopic | null {
  const normalized = text.toLowerCase();
  let best: LandingTopic | null = null;
  let bestScore = 0;

  for (const topic of landingTopics) {
    const score = topic.keywords.filter((keyword) =>
      new RegExp(`\\b${keyword}`).test(normalized),
    ).length;
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }

  return best;
}
