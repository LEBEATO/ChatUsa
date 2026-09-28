# CHAT USA

Aprenda inglês americano conversando. Primeira versão funcional para brasileiros, com Next.js 16.3.6, React 19.2.8, TypeScript e Tailwind CSS 4. As versões instaladas foram preservadas.

## Executar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. No PowerShell, use `npm.cmd` se a política de execução bloquear `npm.ps1`.

## Configurar a IA

Copie `.env.example` para `.env.local` e preencha `OPENAI_API_KEY` com sua chave da OpenAI. Reinicie o servidor depois de alterar variáveis. A chave precisa de acesso à API e saldo/cota para os modelos usados.

| Variável | Finalidade | Padrão |
| --- | --- | --- |
| `OPENAI_API_KEY` | Chave secreta, obrigatória para conversa e áudio | Sem padrão |
| `OPENAI_CHAT_MODEL` | Conversa com resposta estruturada | `gpt-4o-mini` |
| `OPENAI_TRANSCRIPTION_MODEL` | Transcrição de gravações | `gpt-4o-mini-transcribe` |
| `OPENAI_TTS_MODEL` | Geração de voz | `gpt-4o-mini-tts` |

Os modelos são configuráveis; o modelo de conversa deve suportar Responses API e Structured Outputs, e o TTS deve suportar `instructions`. Emma usa a voz `coral`; Ethan, `onyx`, com instruções de General American. As vozes são sintéticas e identificadas como IA.

Sem chave, o app exibe **configuração pendente**. A configuração inicial, navegação, material de estudo e exercício escrito de soletração continuam disponíveis; conversa, transcrição e geração de voz retornam erro explicativo. Não há respostas de IA simuladas. O status verifica a presença da chave, não sua validade ou saldo.

Nunca use prefixo `NEXT_PUBLIC_` para a chave. `.env.local` é ignorado pelo Git. Somente o exemplo com valor fictício pode ser versionado. Nenhum segredo é enviado ao navegador ou registrado em logs pela aplicação.

## O que está implementado

- `/`: apresentação, metodologia e tutores fictícios com retratos gerados por IA.
- `/comecar`: escolha de Emma/Ethan, nível e objetivo.
- `/painel`: próxima atividade e progresso real, inicialmente zerado.
- `/aula`: conversa por texto, microfone, transcrição revisável, áudio automático opcional, repetir, desacelerar, interromper, tradução e soletração.
- `/configuracoes`: tutor, nível, objetivo, áudio e legendas. Mudar preferências preserva o progresso.
- Nove atividades, três por nível. Avançados entram direto em entrevistas, opiniões e conversas abertas.
- Menu móvel, navegação por teclado, foco visível, estados de erro e preferência de movimento reduzido.

## Fluxo de áudio e conversa

O microfone pede permissão somente ao clicar em **Usar minha voz**. Ao parar, a gravação é convertida em WAV PCM mono de 16 kHz no navegador e enviada ao servidor. A transcrição aparece no campo de texto para revisão; só o botão Enviar a envia ao tutor. Microfone exige localhost ou HTTPS e suporte a MediaRecorder/Web Audio. A digitação funciona independentemente desse suporte.

Limites: 2.000 caracteres por mensagem, 15 mensagens de contexto enviadas pelo cliente, 32 KB por corpo JSON e 60 segundos de áudio. O servidor verifica a duração pelo número de amostras PCM e aceita somente o cabeçalho WAV canônico produzido pelo cliente. Não confia em uma duração informada pelo navegador. Há bloqueio de envios simultâneos no cliente, cancelamento ao sair, liberação de microfone/URLs de áudio e timeout de 45 segundos no acesso ao provedor. Erros preservam o texto para uma nova tentativa.

O tutor recebe texto ou transcrição, **não o áudio original**. Portanto não avalia pronúncia, sotaque ou entonação e não fornece notas. A referência General American orienta a voz e as explicações; não é um sistema de avaliação fonética. A soletração reproduz os nomes das letras separadamente da pronúncia da palavra. O feedback de linguagem fica separado da conversa.

## Dados e progresso

`lib/learning.ts` contém os tipos, atividades e `localRepository`; `lib/client-store.ts` sincroniza o estado React com esse repositório. Esse limite permite trocar a persistência por outro adaptador no futuro, por exemplo Supabase, sem acoplar os componentes ao banco.

Preferências, progresso, mensagens e rascunhos ficam em `localStorage`: `chat-usa:v1` para exploração sem conta, e `chat-usa:v1:user:<id>` por conta. Não há sincronização entre dispositivos. Limpar os dados do site apaga essas informações. Conversas mantêm até 60 mensagens por tutor/nível/atividade e podem ser apagadas dentro da aula. Gravações não são armazenadas pelo app. Texto e áudio usados na IA são enviados à OpenAI; a conversa usa `store: false`.

Métricas são contagens de ações: resposta praticada só após uma resposta válida da IA; palavra praticada só ao acertar o exercício escrito; dia de prática ao realizar uma dessas ações. Uma atividade pode ser marcada concluída depois de três respostas bem-sucedidas, uma vez por nível/atividade. Revisões aumentam a prática, mas não duplicam conclusões. Esses números não medem domínio, fluência ou pronúncia.

## Validação

```bash
npm run lint
npm run build
npm start
```

O projeto usa a fonte Geist local para não depender do Google Fonts durante o build. Os retratos estão em `public/images/tutors.png`; prompt e direção visual em `docs/design.md`.

As rotas ficam em `app/api/{status,chat,speech,transcribe}`. Chamadas reais à OpenAI só podem ser verificadas com credenciais. O ambiente de entrega não contém chave. Veja `docs/verification.md` para os testes executados e suas limitações.

Antes de exposição pública, ative e valide a autenticação e as quotas descritas em `docs/auth-setup.md`, configure proteção do cadastro e orçamento do provedor. A validação de origem não substitui autenticação. As mudanças estão em revisão no GitHub; não foi feito deploy.

## Documentação do provedor consultada

- [Responses e Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Transcrição de áudio](https://developers.openai.com/api/docs/guides/speech-to-text)
- [Geração de voz](https://developers.openai.com/api/docs/guides/text-to-speech)

### Retomada das aulas

Conversas e rascunhos ficam no navegador, separados por nível, tutor e atividade. Cada conversa mantém as últimas 60 mensagens, até ser apagada. O painel retoma a atividade incompleta usada mais recentemente. Ao concluir todas as atividades do nível, oferece revisão; isso não certifica fluência. Dentro da aula, **Apagar conversa** pede confirmação e preserva o progresso. Dados antigos são migrados sem perder preferências ou métricas.

Verificações adicionais (Node 22.18+):

```bash
node scripts/check-sessions.mjs
```

Para testar a interface com respostas simuladas, use Playwright instalado separadamente (ou `PLAYWRIGHT_MODULE` apontando para seu módulo), inicie a aplicação na porta 3100 e rode `node scripts/check-lesson-flow.mjs`. Esse teste não chama a OpenAI nem comprova voz/pronúncia reais.

### Login e proteção da IA

Login/cadastro com Supabase e quota transacional estão preparados. Para ativar, siga [a configuração de autenticação](docs/auth-setup.md). A IA agora exige usuário autenticado e uma quota válida no banco. Sem Supabase ou sem a migração, chamadas pagas ficam bloqueadas. O histórico continua local e separado por conta; não há sincronização entre dispositivos. Use `npm run check:config` para conferir as variáveis sem imprimir segredos.
