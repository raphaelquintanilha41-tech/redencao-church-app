# Setup — Backend Implementation (Phase 1 in progress)

This file tracks the actual status of turning the design prototype into a
real backend, per `README.md`. Written so status claims stay honest:
nothing here is marked done unless it was actually run and verified.

## Status

- [x] `supabase/migrations/0001_phase1_foundation.sql` written — `profiles`
      table, RLS policies (select/insert/update own row only), auto-create
      trigger on signup, `avatars` storage bucket + owner-scoped policies.
      **Not run or tested against a live Supabase project.** SQL has not
      been executed anywhere; RLS policies have not been verified with the
      two-account test the README requires.
- [ ] Everything else (Phases 1's auth UI through Phase 7's admin panel):
      not started. Blocked — see below.

## What's blocking further work

1. **No Supabase project connected.** There's no URL, anon key, or
   service role key configured anywhere in this repo. Create a project at
   supabase.com (free tier is enough to start), then run
   `supabase/migrations/0001_phase1_foundation.sql` against it (SQL Editor,
   or `supabase db push` with the CLI) and share the **Project URL** and
   **anon public key** so the app can be wired to it.
   Do **not** put the `service_role` key anywhere in this repo — it's
   public, and that key bypasses RLS entirely.

2. **No app codebase exists yet.** This repo is 99% design/prototype
   assets (`*.dc.html`, the bundled `redencao-church-app-share.html`,
   the seed content `.js` files). There is no `package.json`, no build
   tooling, no framework chosen. The README leaves the stack open (React
   Native, Flutter, native, or responsive web/PWA) — recommend responsive
   web/PWA since the project already deploys through Vercel as static
   HTML, but this is a real decision, not a default to silently commit to.

3. **This sandbox currently has no npm registry access** (`npm install`
   returns 403 for npmjs.org), so a JS/React app can't be scaffolded from
   here right now. If work continues in this environment, that needs to
   be opened up; otherwise this is a reason to do the app scaffolding in
   an environment that has registry access and treat this repo/session as
   the design-and-schema source of truth.

## Suggested order once unblocked

1. Confirm stack (web/PWA vs. native) and get Supabase project
   URL + anon key.
2. Scaffold the app, wire Supabase Auth (signup/login/forgot-password/
   session/logout — Phase 1).
3. Run migration `0001`, then run the **two-account test** from
   `README.md` before marking Phase 1 done.
4. Proceed to Phase 2 (`favorites`, `bible_notes`, `reading_history`,
   `reading_plan_progress`) only after Phase 1 passes that test.
