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
- Potentially easier shared dependency story (singletons)

**Cons**
- Couples the shell to the remote runtime mechanics and integration code
- Angular shell must host the React rendering boundary (more framework entanglement)
- You lose some of the “clean boundary” benefits that make migrations safer

### Option 3: iFrame isolation — only if you need true runtime independence
Only choose if you truly need “any React version at any time” and are willing to pay integration tax.

---

# 3) Comparison: Multi-repo vs TurboRepo Monorepo (with Angular Shell + Web Components)

## 3.1 Autonomy & Governance
### Multi-repo (Independent)
✅ Strong autonomy  
✅ Teams can move fast independently  
⚠️ Dependency drift is common  
⚠️ Governance becomes “meetings + policing” unless you invest in automation

### TurboRepo monorepo
✅ Strong governance by default (single place to pin versions)  
✅ Easier platform-wide upgrades (React, DS, tooling)  
✅ Easier to enforce boundaries (lint rules to prevent cross-MFE imports)  
⚠️ Teams feel “centralized” if processes aren’t well-designed  
⚠️ Requires good CODEOWNERS + ownership model to avoid “everyone touches everything”

**Winner**
- For dependency alignment + “upgrade in one shot”: **TurboRepo**

---

## 3.2 Dependency management (React + ReactDOM + Design System)
### Multi-repo
- Harder to enforce “everyone uses compatible versions”
- A DS upgrade can turn into a multi-week coordination effort
- Requires disciplined package publishing + versioning strategy

### TurboRepo monorepo
- Single lockfile + workspace constraints makes drift much harder
- DS changes can be rolled out via codemods and workspace-wide tests
- Easy to create a platform guardrail: “no React bundled into MFEs” (if using shared runtime)

**Winner**
- **TurboRepo** (by a lot)

---

## 3.3 Build & CI/CD
### Multi-repo
✅ Smaller CI scope per repo  
✅ Simple mental model  
⚠️ Lots of duplicated pipeline work across repos  
⚠️ Harder to coordinate shared build standards

### TurboRepo monorepo
✅ Turbo caching + affected builds is a big win  
✅ Shared build standards and scripts  
⚠️ CI can get expensive without remote cache and good task hygiene  
⚠️ Requires build graph discipline (don’t create accidental coupling)

**Winner**
- Depends on maturity:
  - early stage / small number of MFEs: multi-repo can be simpler
  - enterprise / many MFEs: **TurboRepo** scales better

---

## 3.4 Release & Deployment independence
### Multi-repo
✅ Naturally independent releases  
✅ Independent pipelines per MFE

### TurboRepo monorepo
✅ Still independent *if you design it that way*:
- build only changed apps
- create one container per changed MFE
- deploy only changed MFEs
⚠️ Without discipline, orgs drift into “release trains” because it’s convenient

**Winner**
- Tie — **both can be independently deployed**
- The deciding factor is process + tooling, not repo shape.

---

## 3.5 Local development experience
### Multi-repo
⚠️ Linking local DS changes into MFEs can be annoying  
⚠️ Cross-MFE contract changes are harder to validate locally  
✅ Simpler for a single team working in one repo

### TurboRepo monorepo
✅ DS + contracts + MFEs all in one workspace  
✅ Easy to run “shell-like” integration harness locally (even if shell repo is separate)  
✅ Easy to validate upgrade blast radius

**Winner**
- **TurboRepo**

---

## 3.6 Enforcing MFE boundaries
### Multi-repo
✅ Natural isolation at repo boundary  
⚠️ Still possible to couple via shared packages in uncontrolled ways

### TurboRepo monorepo
⚠️ Easy to accidentally import internals across MFEs  
✅ But also easier to prevent with lint + TS path restrictions + repo rules

**Winner**
- Depends on enforcement:
  - Without guardrails: multi-repo is safer by accident
  - With guardrails: **TurboRepo** is safer by design

---

# 4) Adding Module Federation (Vite) to the mix

You can layer Module Federation in either model, but you should be intentional about *why*.

## 4.1 Good reasons to use MF here
### Reason A: shared singleton dependencies (React, ReactDOM)
If you want to guarantee “one React on the page” without relying solely on import maps/globals, federation can help.

### Reason B: remote loading + versioning patterns
Federation can provide a structured way to load remote entries and share libraries.

## 4.2 Reasons NOT to overuse MF here
- You’re already choosing Web Components for clean boundaries.
- Using MF for deep cross-MFE imports often reintroduces coupling (“distributed monolith” risk).
- Vite federation plugins vary in maturity vs webpack MF; treat it as a tool, not the architecture.

## 4.3 Practical hybrid guidance (recommended)
- Use **Web Components** as the integration boundary into Angular.
- Use **either**:
  1) **Import map + externals** to share React runtime (simple + standards-based)
  2) **Vite Federation** mainly for dependency sharing (if your org prefers federation-style governance)

---

# 5) Recommended architecture patterns (Angular shell + Web Components + Shadow DOM)

## 5.1 How the Angular shell discovers MFEs
Use a **manifest**:
- `mfe-manifest.json` maps route → MFE entry URL + version
- Shell fetches it at startup and loads the needed MFE entry lazily per route.

This decouples:
- shell deployments from MFE deployments
- URL changes from code changes

## 5.2 Cross-MFE contracts
- Prefer **events** and **versioned payload schemas**
- Avoid passing functions across the boundary
- Use a shared contract package (`@org/contracts`) with:
  - event envelope (`type`, `version`, `correlationId`, `payload`)
  - runtime validation (Zod or JSON schema)

## 5.3 Styling with Shadow DOM + adoptedStyleSheets
- DS CSS is injected into each shadow root via constructed stylesheet
- Theme via CSS variables at document root or host element

## 5.4 Portals / overlays (must design)
Decide one:
- Shell-managed overlays: MFEs dispatch “open modal” intent events
- MFE-managed overlays: provide a portal root in the shadow root (more isolation, more work)

---

# 6) Decision Guide

## Choose Multi-repo MFEs when:
- You have a small number of MFEs
- Teams are highly independent and dislike centralized workflows
- You can invest in strong package publishing governance (DS + contracts)
- You accept that large upgrades may take coordination effort

## Choose TurboRepo monorepo of MFEs when:
- You want dependency standardization and “upgrade in one shot”
- You have (or will have) many MFEs
- You want strong enforcement of platform rules (React version, DS version, build standards)
- You want easier local dev and safer mass refactors

---

# 7) Recommended path for your exact goals
Given:
- Angular shell remains separate
- Web Components + Shadow DOM
- shared React DS components
- desire for one-shot upgrades

**Recommendation**
1) Put MFEs + DS + contracts in a **TurboRepo monorepo**
2) Keep **independent deploy per MFE** (container per app)
3) Use **manifest-based loading** in Angular shell
4) Standardize React runtime compatibility as a platform contract:
   - one major version (strict)
   - one minor version during migration (usually)
5) Use Module Federation only if it directly solves:
   - shared React runtime / dependency dedupe
   - structured remote loading

---

## Appendix: “Do we need Web Components if we use Module Federation?”
Not strictly. But in an Angular→React migration, **Web Components reduce risk** because the boundary is stable and framework-agnostic. Federation can be used behind that boundary (for sharing deps), but you don’t need to abandon WCs to use federation.
