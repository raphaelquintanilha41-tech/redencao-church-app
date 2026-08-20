# Setup — Backend Implementation (Fase 1: código pronto, ainda não testado)

This file tracks the actual status of turning the design prototype into a
real backend, per `README.md`. Written so status claims stay honest:
nothing here is marked done unless it was actually run and verified.

## Status

- [x] Stack decidida: web/PWA responsivo (Vite + React + TypeScript),
reaproveitando o deploy Vercel estático existente. O código da app
existe agora em `app/`.
- [x] `supabase/migrations/0001_phase1_foundation.sql` — sem alterações
desde a versão anterior: escrita, **não executada contra um projeto
Supabase real**. RLS ainda não validada com o teste de duas contas.
- [x] `app/` — Fase 1 (Fundação) implementada no código: autenticação real
(criar conta com nome/e-mail/palavra-passe/confirmar palavra-passe,
entrar com e-mail/palavra-passe, recuperação de palavra-passe por
e-mail, sessão persistente, logout), leitura do próprio perfil, upload
de avatar (compressão client-side + bucket `avatars`). PWA (manifest,
service worker, ícones) configurado. `npm run build` e `npm run lint`
passam sem erros. Testado visualmente em modo dev (capturas de ecrã) —
mas **nunca testado contra um Supabase real**: nenhuma chamada de
autenticação, leitura ou escrita foi de facto executada, porque não
existe projeto Supabase conectado.
- [ ] Tudo o resto (Fases 2–7: favoritos, notas, histórico de leitura,
planos, conteúdo, pedidos de oração, células, ministérios, batismos,
testemunhos, eventos, notificações, painel admin) — não iniciado.

## O que está bloqueando

1. **Nenhum projeto Supabase conectado.** Sem URL, sem anon key
configuradas em `app/.env.local` (só existe `app/.env.example` como
modelo). Crie um projeto em supabase.com, rode
`supabase/migrations/0001_phase1_foundation.sql` (SQL Editor ou
`supabase db push`), e preencha `app/.env.local` com a **Project URL**
e a **anon public key**.
Não coloque a `service_role key` em nenhum lugar do repo — essa chave
ignora RLS.

2. **Sem isso, o teste de duas contas** exigido pelo README (criar
conta A, favoritar, sair, criar conta B, confirmar isolamento, voltar
à conta A, confirmar persistência) não pode ser executado. Nada da
Fase 1 deve ser marcado como "concluído" até esse teste passar de
facto.

3. **Ícones PWA e o logo em `app/public/`** ainda precisam de ser
copiados manualmente (não foi possível transferir binários pela
sessão que gerou o código) — ver `app/README.md`.

## Ordem sugerida a partir daqui

1. Criar o projeto Supabase, rodar a migration, preencher
`app/.env.local`.
2. Configurar em Authentication → URL Configuration a redirect URL
`http://localhost:5173/reset-password` (dev) e o domínio de produção,
para o fluxo de recuperação de palavra-passe funcionar.
3. `cd app && npm install && npm run dev`, rodar o teste de duas contas
descrito no README.md.
4. Só depois de esse teste passar, avançar para a Fase 2 (`favorites`,
`bible_notes`, `reading_history`, `reading_plan_progress`).
