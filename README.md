# Handoff: Redenção Church App — Backend & Persistence Implementation

## Overview
The Redenção Church mobile app UI (Home, Bíblia, Mensagens, Igreja, Perfil) has been designed and prototyped in HTML. It now needs to be rebuilt as a real, persistent, multiuser, secure product — a working codebase with authentication, database, storage, and an admin panel — replacing all mocked/local data with real backend integration.

## About the Design Files
The files in this bundle (`Redenção Church App.dc.html`, `redencao-church-app-share.html`, the `Especificação Técnica` and `Auditoria` files) are **design references built in HTML** — they show the intended screens, layout, copy, icons, and navigation flow. They are **not production code**. The task is to recreate this UI in a proper app codebase (React Native, Flutter, native iOS/Android, or a responsive web app — pick what fits the team) wired to a real backend (Supabase recommended: Auth, Postgres, Storage, RLS, Realtime, Edge Functions), and to implement all the functional/data requirements below.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy (Portuguese, verbatim), icons (Phosphor), and the Nocturne design system tokens (`_ds/nocturne-.../styles.css`) should be recreated pixel-faithfully. Copy the exact ptBR text from the HTML files rather than rewriting it.

## Design System
Nocturne: dark navy ground (`--color-bg`), warm gold/blurple accent used sparingly (lines, icons, primary button outlines — never large fills), Inter typeface, 8px radii, compact spacing. Light mode exists (toggle in Perfil) — muted text remaps to darker neutral steps in light mode (`--rc-faint`/`--rc-muted`/`--rc-body2` CSS vars added in the app file). Full token reference: `_ds/nocturne-.../readme.md` in the main project (not duplicated in this folder — pull from the main project if needed).

## Current State — What Is Real vs. Mocked
Everything in the current HTML prototype is **frontend-only**: React component state, no backend calls, no persistence beyond in-memory state (some `localStorage` reads for onboarding/theme). Specifically mocked/fictional and must be replaced with real data:
- User profile (name "Raphael", email, avatar) — hardcoded
- Favorites, notes, reading history, prayer requests, plan progress — component state only, reset on reload
- Bible content, devotionals, "Palavra do Dia" — `devocionais-agosto-2026.js` and `palavra-do-dia.js` are static JS arrays (30-31 fixed days), meant as seed/reference content, not a database
- Events/agenda — hardcoded array in the app file
- Login/signup — no real auth; "guest" vs "member" is a local UI flag only

## Required Backend Work (in priority order)

### Phase 1 — Foundation
- Real authentication (sign up: nome, e-mail, senha, confirmar senha; login: e-mail, senha; forgot-password flow; session persistence; logout)
- `profiles` table: `id, user_id, full_name, avatar_url, email, created_at, updated_at`
- Row Level Security on every user-data table: a user can only read/write their own rows
- Storage bucket for avatars (upload, crop/compress client-side, persist URL to `profiles.avatar_url`)

### Phase 2 — Personal data
- Editar perfil (nome, foto, e-mail via secure change flow) → propagate updated name/photo everywhere it's shown (Home greeting, Perfil header, etc.)
- `favorites` (id, user_id, content_type, content_id, created_at) — heart icon on verses/devotionals/sermons/plans must write here; "Meus Favoritos" in Perfil reads only the current user's rows, with filters (Todos/Bíblia/Devocionais/Mensagens/Planos) and remove action
- `bible_notes` (id, user_id, book, chapter, verse, content, created_at, updated_at) — create/edit/delete/search, private by default
- `reading_history` (id, user_id, book, chapter, last_verse, translation, read_at) — auto-logged on chapter open; Home "Continue de onde parou" reads the latest row
- `reading_plan_progress` (id, user_id, plan_id, day, completed_at) — Dia X de 30, % complete, continuar/concluir

### Phase 3 — Content
- `daily_word` / `devotionals` tables (date, title, reference, message/reflection, question, daily_action, prayer, takeaway, status: draft/review/scheduled/published/archived, publish_at) — app shows the row matching today's date; seed with the content already written in `devocionais-agosto-2026.js` and `palavra-do-dia.js`
- `sermons`, `church_events` tables — admin-editable, recurring service times configurable (not hardcoded Sunday 10:15 / Thursday 20:00)

### Phase 4 — Church life
- `prayer_requests` (id, user_id, title, body, category, is_anonymous, is_confidential, status: recebido/em_oracao/acompanhado/concluido, created_at) — RLS: only author + authorized pastor/staff roles can read
- `cells`, `cell_join_requests` — cell listing (approx. region only, full address after approval), "Quero participar" → request → leader/admin approval → appears in "Minha Célula"
- `ministries`, `ministry_interest` — interest form → admin review
- `baptism_requests` (status: interested/contacted/preparing/confirmed/completed)
- `testimonies` (status: pending/approved/rejected — only approved shows publicly)
- `newcomer_contacts` ("Sou Novo Aqui" form — restricted to authorized staff)
- `giving_methods` (MB WAY number, IBAN, QR, admin-configured, never hardcoded; no per-user donation history in this version)
- `event_registrations` — "Quero participar" on events → registration → visible in "Meus Eventos"

### Phase 5 — Communication
- Notification center (read/unread, mark all read) + push notifications by category, user-controlled preferences; app badge count where platform supports it

### Phase 6 — PWA / app shell
- Manifest, service worker, icons (incl. maskable + Apple touch icon), install flow (Android/desktop native prompt; iOS manual "Adicionar à Tela de Início" instructions), basic offline caching of shell + last-viewed public content (never cache private data insecurely)

### Phase 7 — Admin panel
Sections: Conteúdo (Palavra do Dia, Devocionais, Pregações, Banners), Igreja (Agenda, Células, Ministérios, Batismos, Cursos), Pessoas (Membros, Visitantes, Pedidos de oração, Inscrições, Interesses), Comunicação (Notificações), Configurações (Horários, Endereço, Contactos, Redes sociais, MB WAY, IBAN).
Roles: Super Admin, Pastor, Administrador, Editor, Líder de Célula (own cell only), Líder de Ministério (own ministry only), Intercessor (authorized prayer requests only). Enforce every role boundary in the backend/RLS, not just by hiding UI.

## Security & Compliance
- RLS on every table listed above — verify a user cannot read another user's rows even by manipulating IDs directly against the API
- GDPR (app operates in Portugal): privacy policy, terms, consent management, "exportar meus dados", "excluir minha conta" — with extra care for prayer requests, visitor data, baptism data, cell data, and any minors' data
- Do not store banking details from members — only the church's own configured giving methods

## Test Criteria (must pass before considering any feature "done")
For each feature: appears correctly → accepts interaction → validates input → persists to the database → survives reload → survives logout/login → syncs across devices → is scoped to the correct user → respects role permissions → handles errors → works on mobile and desktop.

**Two-account test (mandatory):** Create Account A, set name/photo, favorite João 3:16, add a note, open Salmos 23, start a reading plan, send a prayer request, register for an event. Log out. Create Account B — confirm none of Account A's private data is visible, create different data, log out. Log back into Account A — confirm every item (photo, name, favorite, note, history, plan progress, prayer request, event registration) is still there and nothing from Account B leaked in.

Report progress phase by phase: Implementado / Corrigido / Banco (tables/migrations) / Segurança (RLS policies) / Testes / Falhou / Próxima fase. Never report a test as passing if it wasn't actually run — say "não testado" instead.

## Assets
Photos referenced in the prototype (church logo, sermon banners, onboarding photos) live in `assets/` in the main project — pull those in alongside this handoff if the developer needs the actual image files.

## Files in this bundle
- `Redenção Church App.dc.html` — the full interactive UI prototype (all screens, current mocked state/data)
- `redencao-church-app-share.html` — same app, bundled as one offline-viewable file
- `Especificação Técnica - Igreja.dc.html`, `Especificação Técnica - Perfil.dc.html` — detailed prior specs for the Igreja and Perfil areas
- `Auditoria e Especificação Consolidada.dc.html` — consolidated audit/spec document
- `devocionais-agosto-2026.js`, `palavra-do-dia.js` — seed content (30/31 days) to load into the `devotionals`/`daily_word` tables
