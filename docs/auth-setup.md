# Ativar login e IA no CHAT USA

Código preparado; o projeto Supabase real, e-mail e chamadas de IA ainda precisam ser validados. Use Node 22.18 ou superior. Nenhum banco de outro aplicativo deve ser usado.

1. Crie um projeto Supabase exclusivo para CHAT USA (ou indique um projeto já criado para ele).
2. Copie `.env.example` para `.env.local`. Preencha `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `OPENAI_API_KEY`. Todas são lidas no servidor. Não use service_role. Não coloque a chave OpenAI em variáveis `NEXT_PUBLIC_`, GitHub ou mensagens.
3. No SQL Editor desse projeto, execute `supabase/migrations/20260926220046_ai_usage_limits.sql` uma única vez. A migração cria somente contadores privados e a função de quota. Não execute em outros projetos. Depois rode os advisors de segurança do Supabase e revise eventuais alertas.
4. Em Authentication, habilite e-mail/senha e confirmação de e-mail. Configure Site URL com `http://localhost:3000/login` no desenvolvimento; configure o domínio HTTPS correto ao publicar. Configure SMTP para os usuários que vão testar, de acordo com os limites do provedor.
5. Rode `npm run check:config` e reinicie com `npm run dev`.
6. Abra `/login`, crie uma conta, confirme o e-mail e entre. Escolha tutor/nível e faça uma conversa curta. Teste Ouvir, Parar áudio e transcrição pelo microfone.
7. Confira saída da conta, retorno ao login, acesso sem sessão às APIs (401) e uma segunda conta no mesmo navegador, que deve ter histórico separado. Confirme também que recarregar preserva a sessão.

Apenas telas e materiais podem ser explorados sem Supabase configurado; chamadas pagas ficam bloqueadas. Ausência da migração ou falha ao verificar a quota também bloqueia a chamada à OpenAI.

## Limites iniciais

20 chamadas por minuto e 100 por dia UTC por usuário, compartilhadas entre conversa, voz e transcrição. Cada tentativa autorizada consome uma chamada, inclusive quando o provedor falha. Não é uma medição de dólares nem um limite financeiro global. Configure também orçamento/alertas na OpenAI e proteção contra abuso no cadastro antes de lançar publicamente.

A função faz a atualização do contador em transação com bloqueio da linha. Só o usuário identificado pelo JWT pode consumir sua própria quota; não há parâmetros de usuário ou de limite. Tabelas privadas têm RLS e nenhum acesso direto para anon/authenticated. O wrapper público não tem SECURITY DEFINER.

## Sessão e histórico

A autenticação é feita apenas em Route Handlers com cookies HttpOnly, SameSite=Lax e Secure em produção. Não há cliente Supabase no navegador nem tokens retornados nos JSONs. As páginas são shells sem dados privados no servidor: o estado local só é carregado após `/api/auth` verificar o usuário. Toda chamada paga faz sua própria verificação pelo `getUser` no servidor; o bloqueio visual não é a barreira de segurança.

O login não sincroniza aulas. Histórico e progresso continuam no navegador, em uma chave por usuário; os dados antigos de visitante não são importados automaticamente. Sair não apaga o histórico local. Em um dispositivo compartilhado, apague conversas ou os dados do site. Quando o armazenamento está disponível, uma mudança de conta recarrega outras abas para descartar seu estado anterior.

## Verificação reproduzível

- `npm run build` e `npm run lint`.
- `npm run test:sessions`: migração e isolamento do armazenamento local.
- `npm run test:auth`: inicia servidor local de produção com valores fictícios; testa bloqueios e validações sem chamadas pagas.
- `scripts/check-quota.mjs`: usa PGlite instalado separadamente (`PGLITE_MODULE`) para testar o SQL em banco descartável. Não substitui a validação no Supabase real.
- `scripts/check-lesson-flow.mjs`: Playwright, servidor na porta 3100 e Supabase ausente; respostas simuladas. Execução visual ainda pendente neste ambiente.

Documentação de referência: https://supabase.com/docs/guides/auth/server-side/creating-a-client e https://supabase.com/docs/guides/auth/passwords.
