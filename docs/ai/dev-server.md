# Dev server & process lifecycle (agent-owned)

> Audience: AI agents and developers running this repo locally.
> `.devin/rules/dev-server.md` is a pointer to this page — this is the
> canonical text.

## Golden rules

1. **The agent owns the dev-server lifecycle** — start, stop, restart are
   autonomous operations, no ask-first (supersedes the old "user must
   confirm" policy).
2. **A process that is provably user-started is NEVER killed** without
   explicit user permission — and "not user-started" must be PROVEN
   empirically (see step 3), never assumed from "the port is busy" or
   "I didn't start it".
3. **Never duplicate, never migrate**: no second server on the same port,
   no "just use a different port". If the port is taken, resolve the owner.
4. **The stack must survive the turn**: BE, FE, job-handler and CRM stay
   running across agent turns — a service started inside an agent shell
   dies with the session, so services MUST be started **detached** via
   `primebrick-workspace/scripts/dev-stack.ps1` (delegates to
   `dev-stack.mjs` — genuinely idempotent: per-service state files in
   `temp/dev/<name>.json`, serialized lock, process-TREE kill via
   `taskkill /T`, `status`/`stop`/`restart`/`reap` subcommands;
   `reap` kills untracked primebrick dev processes — zombies — while a
   chain that reaches an IDE terminal is classified USER-STARTED and
   never touched. Logs to `temp/logs/` at the multi-repo checkout root
   (`D:\git\primebrick\temp\logs\` — NOT under primebrick-workspace). If a
   turn finds a service down, restart it detached — never leave the only
   copy of the stack inside an ephemeral shell.
5. **Releases and branch churn kill the stack — restart it after**:
   checkouts, merges and release flows rewrite source files under
   running `bun --hot`/tsx watchers; watch-mode services crash
   mid-operation and stay down (`dev-hot` prints "edit a file to
   restart" and respawns only on a *lib* `src/` change — the service's
   own `src/` edits are `bun --hot`'s job, not the watcher's). After
   any release, merge or branch-close operation, re-run `dev-stack.ps1`
   and verify the stack ports answer — the stack MUST be alive when
   the turn ends.

## Default ports

Ports are seeded in each service's `db-meta/patches/*seed*config.sql` —
they are NOT in package.json or .env.example:

| Service | Folder | Port | Start command |
|---------|--------|------|---------------|
| EmailSender | `emailsender/` | 3003 | `bun --hot src/index.ts` |
| AI | `ai/` | 3004 | `bun --hot src/index.ts` |
| Webhook | `webhook/` | 3005 | `bun --hot src/index.ts` |
| Job Handler | `job-handler/` | 3006 | `bun --hot src/index.ts` |
| CRM | `crm/` | 3007 | `bun --hot src/index.ts` |

(Run from the service folder — e.g. `cd ai && bun --hot src/index.ts`.
Each microservice is self-contained; there is no root dev script.)

Other stack services: FE 5173, BE 3001.

## Two-layer watch — service code vs library code

Services boot via `scripts/dev-hot.mjs` (spawned by `pnpm run dev`), which
runs `bun --conditions=development --hot src/index.ts`. Two independent watch
layers cover the whole editable surface:

1. **Service `src/`** — watched by `bun --hot` itself (in-project files).
   Editing service code hot-reloads in place; no respawn.
2. **External library `src/`** — `@primebrick/sdk`, `@primebrick/dal-pg`,
   `@primebrick/core` and `@primebrick/decimal` carry a `development` export
   condition, so bun resolves them to the sibling repos' **TypeScript
   sources** — no lib rebuild is ever needed while iterating. Those files
   live outside the project directory, so `bun --hot` cannot watch them;
   `dev-hot.mjs` watches their `src/` trees recursively and **respawns** the
   service (~1s) on any non-test file change.

### The warning-noise filter (enforcement-preserving)

bun prints `warn: File ... is not in the project directory and will not be
watched` once per external file — historically ~1600 lines per boot, hiding
real signals. `dev-hot.mjs` pipes the child's stdout/stderr and suppresses
**only** the warnings whose path falls inside one of the watched lib repos
(sdk, dal-pg, core, decimal) — those are structurally compensated by the
respawn layer. Every other warning passes verbatim: if a new external
dependency ever enters the graph without being covered by the watch list,
its warning WILL appear — the filter cannot hide new gaps. Do not widen it
to a blanket suppression.

## Launch context (Windows) — Git Bash chain REQUIRED

`dev-stack.ps1` MUST be launched from a shell chain that carries Git
`usr/bin` in PATH — agent exec shells (Git Bash) qualify, pure
PowerShell/cmd does NOT.

Why: headed windows pipe service output through `tee.exe` for raw UTF-8
logs. `tee.exe` exists ONLY in `C:\Program Files\Git\usr\bin`, which is in
neither the user nor the machine PATH. Git Bash prepends `/usr/bin` and
MSYS2 converts it for every Windows child process, so the chain
bash → powershell → node → cmd → service window inherits it.

Since 2026-11-27 `dev-stack.mjs` probes tee before any spawn (`ensureTee`:
PATH first, then the well-known Git path prepended to its own PATH so
every window inherits it) and fails fast with a clear error if neither
resolves — no more doomed windows. Failure mode being prevented: each
window dies instantly with "tee.exe non riconosciuto" then hangs at
Read-Host; dev-stack waits the full 30s port timeout per service — it
looks like a slow boot, it is instant death.

## Procedure — before starting or touching a server

1. **Check the port** (Windows):
   `netstat -ano | findstr "LISTENING" | findstr ":<port>"`
2. **Port free** → start the server yourself (background shell, keep the
   `shell_id`; if you started it only to verify something, stop it when done).
3. **Port busy** → identify the owner empirically:
   ```powershell
   Get-CimInstance Win32_Process -Filter 'ProcessId=<pid>' |
     Select-Object ProcessId, ParentProcessId, CommandLine | Format-List
   ```
   Then walk the **parent chain** — repeat the query on `ParentProcessId`
   until the root. Classify:
   - **User-started** — the chain reaches a terminal under the IDE
     (`Code.exe` / `Windsurf.exe` / `Devin.exe` → `conhost.exe` →
     `powershell`/`cmd`) or a user shell: **reuse the server** (watch mode
     already has the latest code). Do NOT kill it, do NOT duplicate it.
     If you need its stdout/stderr, check the IDE's open terminals; if you
     can't reach them, ASK for access to the running terminal — do not
     restart.
   - **Orphan** — the chain is broken or ends in a detached process with no
     live terminal ancestor (leftover agent shell, dead IDE session):
     agent-owned. You may kill it and restart on the SAME port.
4. **Wrong-app conflict** — the port is held by a process that is NOT this
   project: same owner test. User-started → ask which project owns the
   port; orphan → kill or escalate. Never silently steal a port.
