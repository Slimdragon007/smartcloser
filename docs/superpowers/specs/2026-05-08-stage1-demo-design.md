# SmartCloser — Stage 1 Demo & Waitlist Page Design

**Date:** 2026-05-08
**Author:** Slim (Michael Haslim)
**Status:** Approved through brainstorming, pending user review of this spec, then writing-plans

## Overview

SmartCloser is a planned WiFi/Bluetooth-enabled assistive device that automatically closes doors. Target users: elderly folks who struggle with heavy doors and remote workers who need acoustic privacy during calls.

This spec covers **Stage 1 only**: a single-page concept demo plus waitlist signup, deployed to Cloudflare Pages. The actual device (firmware, hardware, real telemetry) is **Stage 2** and gets its own brainstorm + spec cycle.

The Stage 1 demo's job is twofold:

1. Make the project feel real to interested visitors so they trust the build is happening.
2. Capture email addresses of people who want to follow along, validating demand before the device ships.

## Decisions Locked During Brainstorming

| Decision               | Choice                                                  | Rationale                                                       |
| ---------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| Scope path             | Stage 1 demo first, Stage 2 real build later            | Ship something validatable this week, defer hardware investment |
| Audience framing       | Concept demo + waitlist (engineering-honest aesthetic)  | Page openly a prototype, signals real engineering work          |
| AI features            | Removed (both Gemini buttons stripped)                  | Demo is about the device, not AI tooling                        |
| Branding               | "SmartCloser by Haslim Engineering"                     | Personal brand, fits engineering aesthetic                      |
| Location in header     | Dropped                                                 | Gemini hallucinated "Phoenix, AZ"                               |
| Olide-120B reference   | Genericized to "Prototype Mk1"                          | Not affiliated with Olide commercially                          |
| Email capture          | Cloudflare Pages Function + KV                          | Pure Cloudflare stack, free tier, reusable in Stage 2           |
| Repo strategy          | Monorepo from day 1 (`web/`, future `firmware/`)        | Avoids Stage 2 restructuring cost                               |
| Implementation pattern | Single-file HTML, light refactor of Gemini code         | Matches documented portfolio pattern                            |
| Domain                 | `smartcloser.pages.dev` for now, custom domain deferred | Avoid decision fatigue, custom domain trivial to add later      |
| CTA wording            | "Get build updates"                                     | Engineering-honest, matches prototype framing                   |

## Architecture

```
                  ┌─────────────────────────────────┐
   Visitor ────▶  │ Cloudflare Pages                │
   (browser)      │   smartcloser.pages.dev         │
                  │   serves web/index.html         │
                  └────────────┬────────────────────┘
                               │
                               │ POST /api/waitlist
                               ▼
                  ┌─────────────────────────────────┐
                  │ Cloudflare Pages Function       │
                  │   web/functions/api/waitlist.js │
                  │   validates + rate-limits       │
                  └────────────┬────────────────────┘
                               │
                               ▼
                  ┌─────────────────────────────────┐
                  │ Cloudflare KV namespace         │
                  │   SMARTCLOSER_WAITLIST          │
                  └─────────────────────────────────┘

   Slim ──▶ wrangler kv:key list ──▶ exports waitlist on demand
```

Single `git push` deploys the static page + the function together. No separate Worker repo, no separate deploy step. KV namespace is provisioned once via Wrangler CLI and bound to the Pages project.

## Repo Structure

```
smartcloser/
├── web/
│   ├── index.html              # demo page (refactored from Gemini code)
│   ├── favicon.svg             # placeholder
│   ├── robots.txt              # allow indexing
│   └── functions/
│       └── api/
│           └── waitlist.js     # Pages Function: POST handler
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-05-08-stage1-demo-design.md
├── .gitignore                  # Node, Wrangler, env files
├── .dev.vars.example           # template for local dev secrets
├── wrangler.toml               # KV binding, project config
├── package.json                # wrangler dev dep, deploy scripts
├── README.md                   # how to deploy, how to read signups
└── LICENSE                     # MIT
```

Stage 2 grows this by adding `firmware/` (ESP32 C++) and possibly `dashboard/` (admin view) at the same level as `web/`.

## Page Content & Layout (top to bottom)

### Header (kept from Gemini, branding fixed)

- Title: `SmartCloser_Proto_v0.2 | Haslim Engineering`
- Right side: device ID + ESP32_LINK_ACTIVE pulse indicator (visual only, no real link)

### Hero (new)

- H1: `A smarter door closer.`
- Sub: `An assistive WiFi-enabled device that closes doors automatically. Built for elderly folks who struggle with heavy doors and remote workers who need quiet during calls.`
- CTA button: `Get build updates` → scrolls to waitlist section

### Intro Strip (new)

> What you're looking at below is a live kinematic simulation of the SmartCloser prototype. The math models real motor behavior, the telemetry mirrors what the device will report once on-device firmware is complete. The unit ships when it's ready.

### Simulator Dashboard (kept from Gemini)

- Left column (7/12): SVG kinematic simulator with door + scissor arms
- Right column (5/12): JSON telemetry pane, motor amps, phase readouts
- Bottom controls: Open / Close / Sim Obstruction buttons
- AI Engineering Assistant panel: **REMOVED**
- "Olide-120B" label inside SVG: replaced with "Prototype Mk1"

### Waitlist Section (new, anchor target for hero CTA)

- Heading: `Be the first to know.`
- Sub: `We'll email when there's a working unit. No marketing, no spam, just build progress.`
- Input: email, placeholder `you@example.com`
- Button: `Notify me`
- Success state: `You're on the list. We'll be in touch.`
- Error state: `Something went wrong. Try again or email m.haslim@gmail.com directly.`

### Footer (new)

- Left: `© 2026 Haslim Engineering`
- Right: `v0.2 prototype · GitHub` (linked when public)

## What Stays / Goes from Gemini's Code

**Kept verbatim:**

- Inverse-kinematic solver math (`solveKinematics()`)
- 100Hz telemetry update loop and JSON syntax highlighter
- Open / Close / Sim Obstruction button behavior
- Visual treatment (Inter + JetBrains Mono, dark mode, blue accent)
- State machine (STATE_READY, STATE_OPENING, STATE_CLOSING, FAULT_OBSTRUCTION)

**Removed:**

- AI Engineering Assistant panel (HTML + CSS + JS)
- `analyzeState()` and `getTuningAdvice()` functions
- Gemini API config (`apiKey`, `fetchWithBackoff()`)

**Modified:**

- Header company name: "Haskell Automotive Engineering" → "Haslim Engineering"
- Header location: "Phoenix, AZ" → removed
- SVG label: "OLIDE-120B" → "PROTOTYPE MK1"

## Pages Function: `web/functions/api/waitlist.js`

**Route:** `POST /api/waitlist`
**Request body:** `{ "email": "user@example.com" }`

**Response codes:**
| Code | Meaning | Body |
|---|---|---|
| 200 | Success or duplicate (idempotent) | `{ "ok": true }` |
| 400 | Malformed JSON or invalid email | `{ "error": "Invalid email" }` |
| 405 | Method not allowed | `{ "error": "Method not allowed" }` |
| 429 | Rate limit hit | `{ "error": "Too many requests" }` |
| 500 | Server error (KV write failed) | `{ "error": "Server error" }` |

**Logic:**

1. Reject non-POST → 405
2. Parse JSON body, fail to 400 if malformed
3. Validate email: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, length ≤ 254 chars (RFC 5321 max)
4. Read rate-limit counter for `cf-connecting-ip`, reject to 429 if ≥ 5 within the past hour
5. Increment rate-limit counter, set 1-hour TTL on first write
6. Write `mail:{email}` → JSON to KV (no TTL)
7. Return 200

## KV Schema

**Namespace:** `SMARTCLOSER_WAITLIST`

| Key pattern      | Value                                                | TTL            |
| ---------------- | ---------------------------------------------------- | -------------- |
| `mail:{email}`   | `{"email","created_at","ip","user_agent","referer"}` | none           |
| `ratelimit:{ip}` | counter (string number)                              | 3600s (1 hour) |

Two prefixes (`mail:`, `ratelimit:`) so listing waitlist via `wrangler kv:key list --prefix=mail:` is clean and excludes rate-limit entries.

## Error Handling

- **Malformed JSON:** caught at parse, returns 400 with generic error (don't echo input back, XSS surface)
- **Email regex fail:** 400, generic message
- **KV read failure (rate limit lookup):** fail open (allow request) and log warning. Don't block legitimate users on infrastructure flake.
- **KV write failure (signup):** 500, generic message; frontend shows fallback (`email m.haslim@gmail.com directly`)
- **Frontend network failure:** form shows error state, no retry loop, suggests fallback email

## Testing Approach

Stage 1 scope is approximately 150 lines of code total (one HTML file, one function).

- **Manual smoke test before each deploy:** open in browser, verify hero + simulator + form submit + KV write visible via `wrangler kv:key list`
- **Local dev:** `wrangler pages dev web/` runs page + function locally on `localhost:8788`
- **No automated tests in Stage 1.** Adding Vitest + Miniflare for a small static page plus one function is over-engineered. Defer to Stage 2 when device telemetry needs reliability guarantees.

## Deployment Process

**One-time setup:**

1. Create GitHub repo `smartcloser` (public)
2. `wrangler kv:namespace create SMARTCLOSER_WAITLIST` → record namespace ID
3. Add KV binding to `wrangler.toml`
4. Connect Pages project to GitHub repo via Cloudflare dashboard
5. Pages build settings: build command = none, output directory = `web`
6. Bind KV namespace to Pages project (Cloudflare dashboard → Settings → Functions)
7. Push to `main` → auto-deploys to `smartcloser.pages.dev`

**Ongoing:**

- `git push origin main` triggers auto-deploy
- View signups: `wrangler kv:key list --namespace-id=<id> --prefix=mail:`
- Export signups: small Node script that lists keys, reads each value, outputs CSV

**Custom domain (deferred):** add via Pages dashboard whenever ready, no redeploy needed.

## Out of Scope (Stage 1 Boundaries)

Explicitly **not** building now:

- ESP32 firmware (Stage 2)
- Real device telemetry pipeline (Stage 2)
- Admin dashboard for managing signups (use Wrangler CLI for now)
- Email broadcasting to waitlist (collecting only, not sending)
- Analytics (Plausible/GA) — privacy implications, defer
- Multiple pages (about, blog, status) — single page only
- Authentication / accounts
- D1 / R2 / Durable Objects
- Mobile app
- i18n / translations
- A/B testing infrastructure
- Custom 404 page beyond Cloudflare default

If any of these become priorities, they get their own brainstorming pass.

## Resolved Items (post-approval defaults, 2026-05-08)

1. **Fallback email:** `m.haslim@gmail.com` (Slim's verified Gmail per memory).
2. **GitHub visibility:** public (portfolio signal, low risk for no-secrets demo).
3. **License:** MIT.

## What Comes Next

After this spec is approved by Slim, the next steps are:

1. Implementation plan via `superpowers:writing-plans` skill — turns this design into a stepwise build sequence
2. Implementation execution — produces working code
3. Manual verification + deploy
4. Stage 2 brainstorming begins (firmware + real telemetry)
