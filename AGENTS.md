# VETRO development rules

## Product
VETRO is a B2B SaaS for commercial intelligence and sales management for real-estate developers. It is not a generic CRM.

## Source of truth
- Repository: `claudialourenci1-ux/Vetro`
- Supabase project: `Vetro App`
- Project ref: `lcyrkagglsyjrmntwfek`
- Never create a second Supabase project.
- Never bypass RLS in frontend code.
- Never expose service-role keys or OpenAI API keys to the browser.
- Database-calculated commercial metrics are authoritative. AI may interpret them but must not become the source of truth for KPIs.

## Stack
- Next.js App Router
- TypeScript strict mode
- Supabase Auth + PostgreSQL + Storage + Edge Functions
- `@supabase/ssr` for browser/server clients and auth proxy
- Vercel deployment target
- OpenAI Responses API may be used server-side for executive interpretation and action recommendations

## Two product contexts
VETRO has two distinct authenticated experiences and they must never be conflated.

### 1. VETRO Platform Control Center
For `super_admin` only. The root `/` must render platform-wide administration rather than an empty company workspace.
Platform navigation:
- Visão geral
- Empresas
- Usuários
- Atividade
- Saúde da plataforma
- Configurações

The Control Center must show real global metrics, company activity and access structure. A super admin can activate a company, invite its first admin, inspect company access, and view platform-wide activity.

### 2. Company workspace
For company `admin`, `manager`, and `collaborator` users.
Workspace navigation:
1. Overview
2. Parceiros
3. Atividades
4. Pipeline
5. Empreendimentos
6. Metas
7. Equipe
8. Intelligence / V6
9. Plano de ação
10. Importar dados
11. Configuração de inteligência / Admin

The Overview is the commercial cockpit, not a shallow KPI summary. It should progressively expose real data for VGV evolution, period comparison, goals, forecast, pipeline, stage aging, partner performance, development performance, inventory/absorption, concentration, V6, attention signals and recommended actions.

Never show company first-access onboarding to a `super_admin` as the primary platform experience.

## Access model
VETRO is invitation-only. There is no public signup flow.

### super_admin
- VETRO platform owner/operator.
- Can create/activate client companies.
- Can create or authorize the first company admin.
- Can access all companies and platform-level administration.

### admin
- Company administrator approved after the SaaS is contracted.
- Can manage the company workspace, settings, team and permissions.
- Can invite `manager` and `collaborator` users through the approved backend flow.
- Cannot access another company or platform-wide VETRO administration.

### manager
- Commercial management role.
- Can access operational and strategic company data needed to manage the commercial operation.
- Cannot manage company administrators or platform ownership.

### collaborator
- Operational data-entry role.
- Must not receive strategic access by default.
- Default permissions are limited to:
  - `partners_view`
  - `pipeline_view`
  - `opportunities_manage`
  - `activities_log`
  - `developments_view`
- Does NOT receive by default:
  - Overview KPIs
  - Intelligence / V6
  - sales/VGV analytics
  - team visibility
  - user management
  - imports
  - admin/settings
- Company admins may explicitly grant additional collaborator permissions.

## Granular permissions
Backend permission enum: `company_permission`.
Available permissions:
- `overview_view`
- `partners_view`
- `partners_manage`
- `pipeline_view`
- `opportunities_manage`
- `activities_log`
- `developments_view`
- `imports_execute`
- `intelligence_view`
- `team_view`
- `team_manage`
- `admin_view`
- `settings_manage`

Permission records live in `company_member_permissions`.
Use the backend as the source of truth. Hiding a menu is not authorization.

RPCs include:
- `get_my_company_permissions(target_company_id)` returns the current user's effective permissions.
- `set_member_permissions(target_company_id, target_user_id, permission_list)` is restricted to company admins and only targets active collaborators.
- `get_platform_overview_metrics()` is for the super-admin Control Center.
- `get_platform_recent_activity(limit_rows)` is for the super-admin audit/activity experience.
- `get_commercial_cockpit(...)` returns the authorized commercial cockpit payload for a company and period.
- `get_vgv_goal_progress(...)` calculates progress against the active VGV goal independently from an arbitrary dashboard lookback.
- `refresh_commercial_signals(...)` generates deterministic attention signals for the management team.
- `get_commercial_action_center(...)`, `create_manual_commercial_action(...)`, `update_commercial_action(...)`, and `adopt_ai_brief_actions(...)` support tracked execution.

Platform view:
- `platform_companies_overview` provides company-level operational rollups to super admins under RLS.

The RLS layer already enforces permission gates on strategic data and write operations. Do not weaken or duplicate this logic in frontend code.

## V6 Method
- V1 Relacionamento: 15%
- V2 Ativação: 15%
- V3 Geração de Oportunidades: 15%
- V4 Conversão: 20%
- V5 Valor: 20%
- V6 Consistência: 15%

Do not invent or hardcode formulas for individual dimensions unless they already exist in the backend configuration. The weighted overall score is calculated by the database.

## Commercial intelligence architecture
The database computes facts; AI interprets facts.

Deterministic/backend responsibilities include:
- KPI values and period comparisons
- goal attainment and gap
- run-rate forecast
- pipeline values and stage counts
- opportunity aging
- partner and development performance
- inventory and absorption
- sales concentration
- V6 values
- deterministic commercial signals when rules are available

AI responsibilities may include:
- executive summary
- attention-point prioritization
- explanation of patterns supported by the supplied data
- recommended commercial actions
- what to watch next
- data-quality warnings

AI must never:
- invent metrics, goals, customers, causes or events
- silently overwrite operational data
- execute recommended commercial actions without an explicit product workflow/user decision
- claim causality when the evidence only supports correlation
- expose raw secret keys client-side

Persist AI briefs with the exact source snapshot/hash used to generate them so recommendations remain auditable.

## Existing backend entities
Core entities include `profiles`, `companies`, `company_memberships`, `company_member_permissions`, `company_settings`, `partners`, `partner_aliases`, `partner_units`, `brokers`, `broker_partner_memberships`, `developments`, `pipeline_stages`, `opportunities`, `activities`, `sales`, `imports`, `import_rows`, `v6_dimension_configs`, `v6_scores`, `partner_metrics_daily`, `audit_events`, `portfolios`, `portfolio_partner_assignments`, `commercial_goals`, `partner_relationship_snapshots`, `activity_brokers`.

Commercial intelligence entities include `inventory_units`, `inventory_unit_events`, `opportunity_stage_history`, `commercial_signals`, `forecast_snapshots`, `ai_briefs`, and `commercial_actions`.

Views / RPCs include `partner_performance`, `pipeline_overview`, `get_overview_metrics`, `get_my_company_permissions`, `set_member_permissions`, `platform_companies_overview`, `get_platform_overview_metrics`, `get_platform_recent_activity`, `get_commercial_cockpit`, `get_vgv_goal_progress`, and `get_commercial_action_center`.

Edge Functions include `bootstrap-admin`, `invite-member`, and `commercial-brief`.

Private import bucket: `vetro-imports`.

## UX direction
Premium B2B technology product. Clean, dense enough for operations, highly legible, desktop-first but responsive. Core palette: deep forest, dark green and soft neutral text. Do not use violet, purple, lilac or magenta in the interface. Preserve the VETRO wordmark direction and three-stripe E-inspired mark.

Official product palette:
- Deep background: `#051F20`
- Secondary background: `#0B2B26`
- Raised surfaces: `#163832`
- Structural/interactive green: `#235347`
- Institutional green: `#8EB69B`
- Soft green: `#B8D3C0`
- Highlight: `#DAF1DE`
- Primary text: `#F3F7F4`
- Secondary text: `#C8D5CD`
- Muted text: `#8FA59A`

ZERO violet, purple, lilac or magenta in product UI, charts, focus states, shadows, gradients or decorative assets.
Prefer smaller typography, compact cards, subtle borders, restrained glow and high information density. Do not create generic AI-dashboard card soup.

## Working rules
- Inspect existing code before changing it.
- Prefer small coherent commits.
- Run install, typecheck, lint and build after structural changes.
- Fix root causes, not visual symptoms.
- Do not replace working backend architecture with mock data.
- For screens without data, build useful empty states instead of fake production metrics.
- Do not add public signup or self-service account creation.
- Menus, routes and actions must reflect effective backend permissions.
- Never rely on frontend visibility as the security boundary.
- Do not seed production merely to make dashboards look full.
- Preserve real business data and make the UI adapt to it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->