/**
 * Eval dataset — 20 question/answer cases for evaluating the AI assistant.
 *
 * Each case has:
 * - `id`: unique identifier
 * - `category`: "docs" (RAG), "data" (MCP/entity query), "navigation" (client tool), "general"
 * - `question`: the user's question
 * - `expected_keywords`: keywords that MUST appear in the response (lowercase)
 * - `expected_tools`: tools that should be called (e.g. ["search_docs"], ["navigate"])
 * - `expected_route`: for navigation cases, the expected route
 *
 * The eval script checks that the response contains all expected_keywords and
 * that the expected tools were called. It's a smoke test, not a full LLM judge.
 *
 * To add new cases, append to the array below.
 */

export interface EvalCase {
  id: string;
  category: "docs" | "data" | "navigation" | "general";
  question: string;
  expected_keywords: string[];
  expected_tools: string[];
  expected_route?: string;
}

export const evalCases: EvalCase[] = [
  // ─── Docs (RAG) ──────────────────────────────────────────────────────────
  {
    id: "docs-01",
    category: "docs",
    question: "What is the DAL and how do I use it?",
    expected_keywords: ["dal", "repository", "entity"],
    expected_tools: ["search_docs"],
  },
  {
    id: "docs-02",
    category: "docs",
    question: "How does RBAC work in Primebrick?",
    expected_keywords: ["rbac", "permission", "role"],
    expected_tools: ["search_docs"],
  },
  {
    id: "docs-03",
    category: "docs",
    question: "What are the API path conventions for microservices?",
    expected_keywords: ["entities", "api", "path"],
    expected_tools: ["search_docs"],
  },
  {
    id: "docs-04",
    category: "docs",
    question: "How do I configure authentication in the backend?",
    expected_keywords: ["auth", "config"],
    expected_tools: ["search_docs"],
  },
  {
    id: "docs-05",
    category: "docs",
    question: "What is the GitFlow process for Primebrick?",
    expected_keywords: ["gitflow", "release", "branch"],
    expected_tools: ["search_docs"],
  },
  {
    id: "docs-06",
    category: "docs",
    question: "How does the SSE standard work?",
    expected_keywords: ["sse", "event", "stream"],
    expected_tools: ["search_docs"],
  },
  {
    id: "docs-07",
    category: "docs",
    question: "What is the entity registry and how does MCP use it?",
    expected_keywords: ["entity", "registry", "mcp"],
    expected_tools: ["search_docs"],
  },
  {
    id: "docs-08",
    category: "docs",
    question: "How do I deploy Primebrick with Docker?",
    expected_keywords: ["docker", "deploy"],
    expected_tools: ["search_docs"],
  },

  // ─── Data (MCP/entity queries) ───────────────────────────────────────────
  {
    id: "data-01",
    category: "data",
    question: "How many customers are in the system?",
    expected_keywords: ["customer"],
    expected_tools: ["list_entities"],
  },
  {
    id: "data-02",
    category: "data",
    question: "List all active users.",
    expected_keywords: ["user"],
    expected_tools: ["list_entities"],
  },
  {
    id: "data-03",
    category: "data",
    question: "Show me the organizations with more than 10 employees.",
    expected_keywords: ["organization"],
    expected_tools: ["list_entities"],
  },
  {
    id: "data-04",
    category: "data",
    question: "What is the schema of the customers entity?",
    expected_keywords: ["customer", "field"],
    expected_tools: ["get_entity_meta"],
  },
  {
    id: "data-05",
    category: "data",
    question: "Count the total number of auth events in the last 24 hours.",
    expected_keywords: ["auth", "event"],
    expected_tools: ["list_entities"],
  },

  // ─── Navigation (client tool) ────────────────────────────────────────────
  {
    id: "nav-01",
    category: "navigation",
    question: "Take me to the customers page.",
    expected_keywords: ["customer"],
    expected_tools: ["navigate"],
    expected_route: "/customers",
  },
  {
    id: "nav-02",
    category: "navigation",
    question: "Open the settings page.",
    expected_keywords: ["setting"],
    expected_tools: ["navigate"],
    expected_route: "/settings",
  },
  {
    id: "nav-03",
    category: "navigation",
    question: "Go to the users list.",
    expected_keywords: ["user"],
    expected_tools: ["navigate"],
    expected_route: "/users",
  },
  {
    id: "nav-04",
    category: "navigation",
    question: "Show me the organizations page.",
    expected_keywords: ["organization"],
    expected_tools: ["navigate"],
    expected_route: "/organizations",
  },

  // ─── General (no tool expected, just a direct answer) ────────────────────
  {
    id: "gen-01",
    category: "general",
    question: "What can you do for me?",
    expected_keywords: ["help", "data", "question"],
    expected_tools: [],
  },
  {
    id: "gen-02",
    category: "general",
    question: "Who are you?",
    expected_keywords: ["ai", "assistant", "primebrick"],
    expected_tools: [],
  },
  {
    id: "gen-03",
    category: "general",
    question: "What languages do you speak?",
    expected_keywords: ["language", "english"],
    expected_tools: [],
  },
];
