# React MFEs with Angular Shell: Independent Repos vs TurboRepo Monorepo (Vite + Web Components + Module Federation)

## Context / Assumptions
- **Parent shell**: Angular SPA (separate repo/app) that routes between “pages” which render **React MFEs**.
- **MFE integration surface**: React MFEs are consumed by Angular.
- **Builder**: Vite for MFEs.
- **Deployment**: containerized (each MFE served as static assets behind an ingress/route), and the Angular shell remains separately deployed.
- **Goal**: maximize team autonomy while maintaining **dependency governance** and enabling “upgrade in one shot” when needed.

---

## TL;DR
- If you want the Angular shell to consume React MFEs with minimal framework entanglement, **Web Components are the most robust integration boundary**.
- A **TurboRepo monorepo** doesn’t remove independent deployment; it primarily changes **governance + upgrade mechanics** (and reduces “dependency drift”).
- **Module Federation** can be used with either approach, but when you already want Web Components + Shadow DOM isolation, federation is best used for **dependency sharing** (React, DS) or **artifact loading**, not as a reason to couple MFEs together.

---

# 1) Two Operating Models

## A) Independently Deployed React MFEs (Multi-repo)
Each MFE lives in its own repo, with its own CI/CD pipeline and container image.

### Typical repo set
- `mfe-orders` repo
- `mfe-customers` repo
- `mfe-approvals` repo
- shared packages:
  - either published to an internal registry (`@org/design-system`, `@org/contracts`)
  - or copied/templated (less ideal long-term)

### Key characteristic
**Maximum repo-level autonomy**, but governance requires stronger policy enforcement (because drift happens naturally).

---

## B) TurboRepo Monorepo of MFEs (still independently deployed)
All MFEs live in a single monorepo managed with TurboRepo, but are still deployed as **separate containers**.

### Typical monorepo structure
- `apps/`
  - `orders/`
  - `customers/`
  - `approvals/`
- `packages/`
  - `design-system-react/`
  - `design-system-styles/` (constructed stylesheet, tokens)
  - `contracts/` (event schema, Zod/JSON-schema)
  - `mfe-runtime/` (wc wrapper utilities, portal helpers, lifecycle helpers)

### Key characteristic
**Centralized governance + dependency alignment**, without forcing a single deployment.

> Important: “monorepo” ≠ “single deploy”.
> You can still deploy each MFE independently by building only changed apps and producing a container per app.

---

# 2) Do both examples need Web Components?
## Short answer: **You don’t strictly *have* to**, but in your setup it’s the cleanest and most stable.

### Option 1: Web Components (r2wc) — recommended
Angular shell loads an MFE script and renders `<mfe-orders></mfe-orders>`.

**Pros**
- Framework-agnostic boundary
- Works well with Angular shell routing
- Shadow DOM gives style isolation (especially important in Angular legacy CSS environments)
- Contract-first integration (events/props)

**Cons**
- You must standardize lifecycle + portals + theming strategy
- You must decide how to share React runtime (import map / externals / bundling)

### Option 2: Module Federation “direct import” into Angular shell — not recommended for your migration path
Angular shell consumes React remote modules and tries to render them directly.

**Pros**
- Tight integration
- Potentially easier
