/**
 * Eval script — runs the eval dataset against the AI orchestrator.
 *
 * Usage:
 *   bun eval/run-eval.ts
 *
 * Env vars:
 *   DATABASE_URL — PostgreSQL connection string (required)
 *   BE_BASE_URL — Backend base URL for MCP (default: http://localhost:3001)
 *   EVAL_USER_JWT — a valid JWT for the eval user (required)
 *   EVAL_USER_UUID — the user UUID for the eval user (required)
 *
 * The script:
 * 1. Loads the eval dataset (20 cases).
 * 2. For each case, calls the orchestrator with the question.
 * 3. Collects the response text + tool calls.
 * 4. Checks that all expected_keywords appear in the response (case-insensitive).
 * 5. Checks that all expected_tools were called.
 * 6. For navigation cases, checks that the navigate tool was called with the
 *    expected route.
 * 7. Prints a summary table + pass/fail per case.
 *
 * Exit code: 0 if all cases pass, 1 if any case fails.
 */
import "dotenv/config";
import "reflect-metadata";
import { evalCases, type EvalCase } from "./dataset.js";
import { orchestrate } from "../src/services/orchestrator.js";
import { initDal, getDal } from "../src/db/dal.js";
import type { ModelMessage } from "ai";
import { logger } from "@primebrick/sdk";

interface CaseResult {
  case: EvalCase;
  passed: boolean;
  responseText: string;
  toolsCalled: string[];
  missingKeywords: string[];
  missingTools: string[];
  wrongRoute: boolean;
  error: string | null;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
}

async function runCase(c: EvalCase, opts: {
  beBaseUrl: string;
  userJwt: string;
  userUuid: string;
}): Promise<CaseResult> {
  const messages: ModelMessage[] = [
    { role: "user", content: c.question },
  ];

  let responseText = "";
  const toolsCalled: string[] = [];
  let navigateRoute: string | null = null;
  let tokensIn = 0;
  let tokensOut = 0;
  let error: string | null = null;
  const startTime = Date.now();

  await orchestrate(
    {
      beBaseUrl: opts.beBaseUrl,
      userJwt: opts.userJwt,
      userUuid: opts.userUuid,
      userLocale: "en",
    },
    messages,
    {
      onTextDelta: (text) => { responseText += text; },
      onToolCall: (toolName) => { toolsCalled.push(toolName); },
      onClientToolCall: (toolName, args) => {
        if (toolName === "navigate") {
          navigateRoute = (args as { route?: string })?.route ?? null;
        }
      },
      onFinish: ({ tokensIn: ti, tokensOut: to }) => {
        tokensIn = ti;
        tokensOut = to;
      },
      onError: (err) => { error = err.message; logger.error(`${c.id} orchestrator error`, { tags: ["eval"], error: err.message }); },
    },
  );

  const latencyMs = Date.now() - startTime;
  const responseLower = responseText.toLowerCase();
  const missingKeywords = c.expected_keywords.filter(
    (kw) => !responseLower.includes(kw.toLowerCase()),
  );
  const missingTools = c.expected_tools.filter(
    (t) => !toolsCalled.includes(t),
  );
  const wrongRoute = c.expected_route !== undefined && navigateRoute !== c.expected_route;

  const passed = !error && missingKeywords.length === 0 && missingTools.length === 0 && !wrongRoute;

  return {
    case: c,
    passed,
    responseText,
    toolsCalled,
    missingKeywords,
    missingTools,
    wrongRoute,
    error,
    latencyMs,
    tokensIn,
    tokensOut,
  };
}

function printResult(r: CaseResult): void {
  const status = r.passed ? "PASS" : "FAIL";
  const statusColor = r.passed ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";
  logger.info(`${statusColor}[${status}]${reset} ${r.case.id} (${r.case.category}) — ${r.case.question}`, { tags: ["eval"] });
  logger.info(`  Latency: ${r.latencyMs}ms | Tokens: ${r.tokensIn} in / ${r.tokensOut} out | Tools: ${r.toolsCalled.join(", ") || "(none)"}`, { tags: ["eval"] });
  if (r.error) {
    logger.info(`  Error: ${r.error}`, { tags: ["eval"] });
  }
  if (r.missingKeywords.length > 0) {
    logger.info(`  Missing keywords: ${r.missingKeywords.join(", ")}`, { tags: ["eval"] });
  }
  if (r.missingTools.length > 0) {
    logger.info(`  Missing tools: ${r.missingTools.join(", ")}`, { tags: ["eval"] });
  }
  if (r.wrongRoute) {
    logger.info(`  Wrong route: expected ${r.case.expected_route}, got something else`, { tags: ["eval"] });
  }
  // Show a snippet of the response (first 200 chars).
  const snippet = r.responseText.slice(0, 200).replace(/\n/g, " ");
  logger.info(`  Response: ${snippet}${r.responseText.length > 200 ? "..." : ""}`, { tags: ["eval"] });
  logger.info("", { tags: ["eval"] });
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  const beBaseUrl = process.env.BE_BASE_URL || "http://localhost:3001";
  const userJwt = process.env.EVAL_USER_JWT;
  const userUuid = process.env.EVAL_USER_UUID;

  if (!url) {
    logger.error("DATABASE_URL is not set", { tags: ["eval"] });
    process.exit(1);
  }
  if (!userJwt) {
    logger.error("EVAL_USER_JWT is not set — provide a valid JWT for the eval user", { tags: ["eval"] });
    process.exit(1);
  }
  if (!userUuid) {
    logger.error("EVAL_USER_UUID is not set", { tags: ["eval"] });
    process.exit(1);
  }

  logger.info(`Running ${evalCases.length} cases against ${beBaseUrl}`, { tags: ["eval"] });
  logger.info(`User UUID: ${userUuid}`, { tags: ["eval"] });
  logger.info("", { tags: ["eval"] });

  initDal();

  const results: CaseResult[] = [];
  for (const c of evalCases) {
    process.stdout.write(`[eval] Running ${c.id}...`);
    try {
      const result = await runCase(c, { beBaseUrl, userJwt, userUuid });
      results.push(result);
      process.stdout.write(` done (${result.latencyMs}ms)\n`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Case ${c.id} threw: ${errorMsg}`, { tags: ["eval"] });
      results.push({
        case: c, passed: false, responseText: "", toolsCalled: [], missingKeywords: c.expected_keywords, missingTools: c.expected_tools, wrongRoute: false, error: errorMsg, latencyMs: 0, tokensIn: 0, tokensOut: 0, });
    }
    // Delay between cases — the local LLM (CPU inference) is single-threaded
    // and needs time to release the connection before the next request.
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  logger.info("\n" + "=".repeat(80), { tags: ["eval"] });
  logger.info("Eval Results", { tags: ["eval"] });
  logger.info("=".repeat(80) + "\n", { tags: ["eval"] });

  for (const r of results) {
    printResult(r);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const avgLatency = Math.round(results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length);
  const totalTokensIn = results.reduce((sum, r) => sum + r.tokensIn, 0);
  const totalTokensOut = results.reduce((sum, r) => sum + r.tokensOut, 0);

  logger.info("=".repeat(80), { tags: ["eval"] });
  logger.info(`Summary: ${passed}/${results.length} passed (${failed} failed)`, { tags: ["eval"] });
  logger.info(`Avg latency: ${avgLatency}ms | Total tokens: ${totalTokensIn} in / ${totalTokensOut} out`, { tags: ["eval"] });
  logger.info("=".repeat(80), { tags: ["eval"] });

  await getDal().close();

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  logger.error("Fatal error", { tags: ["eval"], error: err });
  process.exit(1);
});