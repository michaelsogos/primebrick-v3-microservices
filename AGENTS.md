# AI AGENT INSTRUCTIONS - Primebrick Microservices

## ⚠️ CRITICAL: NEVER COMMIT AUTOMATICALLY
**AI agents MUST NEVER commit changes without explicit user instruction.**
- WAIT for the user to explicitly tell you to commit before running any `git commit` command.
- This applies to ALL situations - no exceptions.

## Repository overview
Independent Git repository containing the distributed microservices part of the Primebrick v3 Backend.
**Documentation language:** All `*.md` files must use **English** for team-facing prose.

## Microservices Stack & Architecture Rules
1. **Tech Stack**: Node.js, Fastify (or Express), TypeScript, and pnpm.
2. **Strict Typing**: Use strict TypeScript. Avoid `any` at all costs. Define precise interfaces for DTOs, Requests, and Responses.
3. **Isolation & Autonomy**: Every microservice inside this repository must be 100% self-contained. Do not write hardcoded cross-service relative imports.
4. **Shared Code**: If multiple microservices need to share common utilities, types, or SDKs, they must be isolated in a dedicated shared package within this repository (e.g., using pnpm workspaces if needed).
5. **API Contracts**: Maintain clear and strict API contracts (or schemas) for inter-service communication.
6. **Async Code**: Use `async/await` syntax exclusively. Always handle errors with clean `try/catch` blocks. Never silence caught errors.
7. **Environment**: Never commit `.env` files. Provide a `.env.example` file specifying all required configuration variables.

## Commands

| Action | Command |
|--------|---------|
| Install | `pnpm install` |
| Build | `pnpm run build` |

## GitFlow rules
This repository follows GitFlow. AI agents MUST follow these rules.
Ensure you follow branch management, version tagging, and commit protocols.
