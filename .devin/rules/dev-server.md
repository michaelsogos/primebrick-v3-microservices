---
trigger: always_on
---

# Devin Rule: Dev Server Management

## Trigger
- Applies whenever an AI agent is about to start a dev server for any
  microservice in this repository.

## Actions
Before starting any dev server, ALWAYS check first whether one is already running
for the relevant microservice. Never take the initiative to start a new dev
server on a new port, and NEVER kill a PID that is holding the port the
microservice normally uses.

Procedure to follow before starting a dev server:

1. Identify the microservice's default dev port from its own config
   (e.g. `package.json` scripts, `.env.example`, or service-level README).
   Each microservice in this repository is self-contained and may use a
   different port.
2. Check the listening ports for that microservice's default dev port. On Windows:
   `netstat -ano | findstr "LISTENING" | findstr ":<port>"`
3. If a process is already listening on that port, resolve the PID to its
   command line to confirm it belongs to THIS microservice:
   `powershell -Command "Get-CimInstance Win32_Process -Filter 'ProcessId=<pid>' | Select-Object ProcessId, CommandLine | Format-List"`
4. If the PID belongs to this microservice's dev server:
   - DO NOT start a new dev server.
   - DO NOT kill the existing process.
   - Reuse it. The dev server already has the latest code via HMR / watch mode.
5. If you need stdout/stderr output from that dev server:
   - First check whether the terminal running it is visible in the IDE
     (look for open terminals in the IDE before spawning your own).
   - If you cannot access it, ASK the user to give you access to the
     terminal that is already running, instead of restarting the server.
6. Only start a new dev server if:
   - No process is listening on the microservice's default port, AND
   - The user has confirmed it is OK to start one.

## Enforcement
- AI agent MUST identify the microservice's dev port from its own config before
  starting a dev server (this repository hosts multiple independent services).
- AI agent MUST NOT kill a PID holding a microservice's dev port without
  explicit user instruction.
- AI agent MUST NOT start a second dev server instance for the same microservice.
- If the agent started a dev server only to verify something, it MUST stop it
  when done. The user's dev server must never be killed without asking.
