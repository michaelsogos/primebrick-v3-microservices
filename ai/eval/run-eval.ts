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
      onError: (err) => { error = err.message; console.error(`[eval] ${c.id} orchestrator error:`, err.message); },
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
  console.log(`${statusColor}[${status}]${reset} ${r.case.id} (${r.case.category}) — ${r.case.question}`);
  console.log(`  Latency: ${r.latencyMs}ms | Tokens: ${r.tokensIn} in / ${r.tokensOut} out | Tools: ${r.toolsCalled.join(", ") || "(none)"}`);
  if (r.error) {
    console.log(`  Error: ${r.error}`);
  }
  if (r.missingKeywords.length > 0) {
    console.log(`  Missing keywords: ${r.missingKeywords.join(", ")}`);
  }
  if (r.missingTools.length > 0) {
    console.log(`  Missing tools: ${r.missingTools.join(", ")}`);
  }
  if (r.wrongRoute) {
    console.log(`  Wrong route: expected ${r.case.expected_route}, got something else`);
  }
  // Show a snippet of the response (first 200 chars).
  const snippet = r.responseText.slice(0, 200).replace(/\n/g, " ");
  console.log(`  Response: ${snippet}${r.responseText.length > 200 ? "..." : ""}`);
  console.log();
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  const beBaseUrl = process.env.BE_BASE_URL || "http://localhost:3001";
  const userJwt = process.env.EVAL_USER_JWT;
  const userUuid = process.env.EVAL_USER_UUID;

  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  if (!userJwt) {
    console.error("EVAL_USER_JWT is not set — provide a valid JWT for the eval user");
    process.exit(1);
  }
  if (!userUuid) {
    console.error("EVAL_USER_UUID is not set");
    process.exit(1);
  }

  console.log(`[eval] Running ${evalCases.length} cases against ${beBaseUrl}`);
  console.log(`[eval] User UUID: ${userUuid}`);
  console.log();

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
      console.error(`\n[eval] Case ${c.id} threw: ${errorMsg}`);
      results.push({
        case: c,
        passed: false,
        responseText: "",
        toolsCalled: [],
        missingKeywords: c.expected_keywords,
        missingTools: c.expected_tools,
        wrongRoute: false,
        error: errorMsg,
        latencyMs: 0,
        tokensIn: 0,
        tokensOut: 0,
      });
    }
    // Delay between cases — the local LLM (CPU inference) is single-threaded
    // and needs time to release the connection before the next request.
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n" + "=".repeat(80));
  console.log("Eval Results");
  console.log("=".repeat(80) + "\n");

  for (const r of results) {
    printResult(r);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const avgLatency = Math.round(results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length);
  const totalTokensIn = results.reduce((sum, r) => sum + r.tokensIn, 0);
  const totalTokensOut = results.reduce((sum, r) => sum + r.tokensOut, 0);

  console.log("=".repeat(80));
  console.log(`Summary: ${passed}/${results.length} passed (${failed} failed)`);
  console.log(`Avg latency: ${avgLatency}ms | Total tokens: ${totalTokensIn} in / ${totalTokensOut} out`);
  console.log("=".repeat(80));

  await getDal().close();

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("[eval] Fatal error:", err);
  process.exit(1);
});
