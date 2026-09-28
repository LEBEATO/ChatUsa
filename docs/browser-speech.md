# Voz de teste do navegador

Sem OpenAI configurada, a aula usa `speechSynthesis` e uma voz `en-US`.
Prefere uma voz local e aguarda até cinco segundos por `voiceschanged`.
Se nenhuma voz americana aparecer, a interface explica como instalar uma
voz ou tentar outro navegador. Um novo clique permite tentar novamente.
Esse modo não chama `/api/speech` nem a OpenAI. Conversa e transcrição
continuam dependendo da configuração da OpenAI.

## Teste manual

1. Em um ambiente sem chave OpenAI, abra uma atividade após concluir o cadastro inicial.
2. Confira a identificação “Voz de teste do navegador”.
3. Clique em “Ouvir / repetir”: deve ler a frase da atividade (ou a última resposta).
4. Clique em “Mais devagar”: deve reiniciar com velocidade 0,75.
5. Clique em “Parar” durante a espera ou reprodução: o áudio deve parar.
6. Inicie novamente e navegue para Meu espaço: a voz deve parar.
7. No painel Network, confirme que esses controles não enviam requisições a `/api/speech`.
8. Em um sistema sem voz `en-US`, confirme a mensagem após cinco segundos.

Não é necessário editar `.env.local`. Para testar sem chave em uma cópia que
já tenha chave, use outro ambiente de execução sem a variável configurada.
Com OpenAI configurada, o fluxo anterior de voz continua ativo e pode ter custo.

## Validação automatizada

```sh
node scripts/check-browser-speech.mjs
npx tsc --noEmit
npm run lint
npm run build
```

Os testes usam vozes simuladas; a qualidade e disponibilidade real da voz
dependem do navegador e do sistema operacional.
