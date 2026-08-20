# Redenção Church — app (Fase 1)

Web/PWA responsivo (Vite + React + TypeScript + Supabase). Reaproveita o
pipeline de deploy estático já usado no projeto (Vercel) e cobre a Fase 6
(PWA) do handoff nativamente.

## Estado — Fase 1: Fundação

Implementado nesta sessão, **não testado contra um projeto Supabase real**
(nenhum projeto foi criado; ver `SETUP.md` na raiz do repo):

- Autenticação por e-mail/palavra-passe: criar conta (nome, e-mail, palavra-passe,
  confirmar palavra-passe), entrar (e-mail, palavra-passe), sessão persistente,
    logout.
    - Fluxo de recuperação de palavra-passe completo (pedido por e-mail via
      `resetPasswordForEmail` + ecrã de definição de nova palavra-passe em
        `/reset-password`, acionado pelo evento `PASSWORD_RECOVERY` do Supabase).
        - Leitura do próprio perfil (`profiles`) após login, com criação automática
          da linha via trigger (`handle_new_user`, na migration).
          - Upload de foto de perfil: compressão/crop centrado no cliente (canvas,
            512×512, JPEG) e upload para o bucket `avatars`, persistindo a URL em
              `profiles.avatar_url`.
              - Manifest PWA + service worker (cache do app shell; nenhuma chamada à API
                do Supabase é cacheada).
                - Ícones gerados a partir do logo da igreja (192, 512, maskable, apple-touch-icon).

                Copy em português (Portugal) e tokens visuais (`_ds/nocturne-.../styles.css`,
                `--rc-faint/--rc-muted/--rc-body2`) copiados verbatim do protótipo em
                `Redenção Church App.dc.html`, incluindo o remapeamento exato de claro/escuro.
                Os campos "Confirmar palavra-passe" e o ecrã de recuperação de palavra-passe
                são novos — não existiam no protótipo (que só cobria login/signup com e-mail
                + palavra-passe) — e foram desenhados a seguir o mesmo sistema de classes
                (`.field`, `.input`, `.btn-*`).

                Não implementado: tudo o resto do app (Bíblia, Mensagens, Igreja, onboarding
                completo, favoritos, notas, histórico, planos, pedidos de oração, células,
                ministérios, admin panel — Fases 2–7 do `README.md` da raiz). Os botões
                "Continuar com Google/Apple" e "Continuar como visitante" aparecem desativados
                de propósito — a UI existe para fidelidade visual, mas não fazer parecer
                funcional o que não foi implementado.

                ## Configurar

                1. `npm install`
                2. Crie um projeto em [supabase.com](https://supabase.com) (tier gratuito
                   serve para começar).
                   3. Rode a migration `supabase/migrations/0001_phase1_foundation.sql` (raiz do
                      repo) no SQL Editor do projeto, ou via `supabase db push` com o CLI.
                      4. `cp .env.example .env.local` e preencha `VITE_SUPABASE_URL` e
                         `VITE_SUPABASE_ANON_KEY` (Project Settings → API no painel do Supabase).
                            **Nunca** coloque a `service_role key` aqui nem em nenhum outro lugar do
                               repo — ela ignora RLS.
                               5. No painel do Supabase, em Authentication → URL Configuration, adicione
                                  `http://localhost:5173/reset-password` (dev) e o domínio de produção
                                     equivalente às Redirect URLs — sem isso o link de recuperação de
                                        palavra-passe não volta para o ecrã certo.
                                        6. `npm run dev`

                                        ## Testar (antes de marcar a Fase 1 como concluída)

                                        Siga o "Two-account test" descrito no `README.md` da raiz, focado no que
                                        esta fase cobre: criar conta A, definir foto, sair, criar conta B, confirmar
                                        que nada da conta A vazou, sair, voltar a entrar na conta A e confirmar que
                                        nome/foto persistiram. Isto ainda não foi executado — fica para quando as
                                        credenciais reais do Supabase estiverem configuradas.

                                        ## Scripts

                                        - `npm run dev` — servidor de desenvolvimento
                                        - `npm run build` — build de produção (`tsc -b && vite build`) — já validado
                                          nesta sessão, compila sem erros
                                          - `npm run preview` — pré-visualizar o build de produção
                                          - `npm run lint` — oxlint