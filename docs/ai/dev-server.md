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
