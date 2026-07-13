# Application Building Context

Read the following files in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product definition, user flows, and scope (what's in and explicitly out)
2. `context/architecture.md` — tech stack, folder structure, system invariants, and identity/access model
3. `context/roadmap.md` — ordered build units and dependencies (directional, not a spec backlog)
4. `context/ui-context.md` — design tokens, typography, and component conventions
5. `context/code-standards.md` — naming, TypeScript conventions, testing, and file organization rules
6. `context/ai-workflow-rules.md` — how to scope units of work, TDD sequencing, and when to stop and ask
7. `context/progress-tracker.md` — current phase, completed work, open questions, and what's next

Do not start implementing from a verbal description or an inferred goal alone — work against a feature spec in `context/feature-specs/`, informed by the seven files above.

Update `context/progress-tracker.md` after each meaningful implementation change, per the rules in `ai-workflow-rules.md`.

If implementation reveals that architecture, scope, or standards need to change from what's documented, update the relevant context file before continuing — do not let the code and the docs drift apart.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:tailwind-agent-rules -->
# Check the installed Tailwind major version before configuring

Tailwind v4 moved theme configuration into `@theme inline` in CSS; there is no `tailwind.config` file to edit. Check `package.json` before assuming v3 conventions apply.
<!-- END:tailwind-agent-rules -->