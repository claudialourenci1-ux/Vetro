# VETRO development rules

## Product
VETRO is a B2B SaaS for commercial intelligence and sales management for real-estate developers. It is not a generic CRM.

## Source of truth
- Repository: `claudialourenci1-ux/Vetro`
- Supabase project: `Vetro App`
- Project ref: `lcyrkagglsyjrmntwfek`
- Never create a second Supabase project.
- Never bypass RLS in frontend code.
- Never expose service-role keys to the browser.

## Stack
- Next.js App Router
- TypeScript strict mode
- Supabase Auth + PostgreSQL + Storage + Edge Functions
- `@supabase/ssr` for browser/server clients and auth proxy
- Vercel deployment target

## Product modules
1. Overview
2. Parceiros
3. Pipeline
4. Empreendimentos
5. Intelligence / V6
6. Equipe
7. Importar dados
8. Admin

## Roles
- super_admin: VETRO platform administration
- admin: company administration
- manager: commercial management
- collaborator: operational usage

## V6 Method
- V1 Relacionamento: 15%
- V2 Ativação: 15%
- V3 Geração de Oportunidades: 15%
- V4 Conversão: 20%
- V5 Valor: 20%
- V6 Consistência: 15%

Do not invent or hardcode formulas for individual dimensions unless they already exist in the backend configuration. The weighted overall score is calculated by the database.

## Existing backend entities
`profiles`, `companies`, `company_memberships`, `company_settings`, `partners`, `partner_aliases`, `partner_units`, `brokers`, `broker_partner_memberships`, `developments`, `pipeline_stages`, `opportunities`, `activities`, `sales`, `imports`, `import_rows`, `v6_dimension_configs`, `v6_scores`, `partner_metrics_daily`, `audit_events`.

Views / RPCs include `partner_performance`, `pipeline_overview`, and `get_overview_metrics`.

Edge Functions include `bootstrap-admin` and `invite-member`.

Private import bucket: `vetro-imports`.

## UX direction
Premium B2B technology product. Clean, dense enough for operations, highly legible, desktop-first but responsive. Core palette: violet/purple, graphite/black, white. Preserve the VETRO wordmark direction and three-stripe E-inspired mark.

## Working rules
- Inspect existing code before changing it.
- Prefer small coherent commits.
- Run install, typecheck, lint and build after structural changes.
- Fix root causes, not visual symptoms.
- Do not replace working backend architecture with mock data.
- For screens without data, build useful empty states instead of fake production metrics.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
