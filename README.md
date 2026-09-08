# facility.js

Biblioteca 100% brasileira para criar bots de Discord em JavaScript. Toda a API — classes, métodos e eventos — é em português.

## Instalação

```bash
npm install facility.js
```

## Uso básico

```js
// index.js — arquivo que liga o bot usando a facility.js
require('facility.js').criar({
  prefixo: '!',
  intencoes: ['SERVIDORES', 'MENSAGENS_DO_SERVIDOR', 'CONTEUDO_DE_MENSAGEM'],
  comandos: './comandos',
  banco: { tipo: 'arquivo', caminho: './dados.json' }, // omita pra usar memória (não persiste)
  token: 'SEU_TOKEN_AQUI',
  depuracao: true, // mostra logs internos (conexão, comandos carregados, etc.)
});
```

## Uso sem escrever JavaScript (CLI)

Quem só quer rodar o bot não precisa abrir nenhum arquivo `.js`. Crie um
`facility.config` na raiz do projeto:

```
TOKEN=seu-token-aqui
PREFIXO=!
INTENCOES=SERVIDORES,MENSAGENS_DO_SERVIDOR,CONTEUDO_DE_MENSAGEM
COMANDOS=./comandos
EVENTOS=./eventos
```

Coloque os comandos em `./comandos/nome.txt` (o conteúdo do arquivo é o
código de tags, igual ao que já ia dentro de `codigo:` no formato antigo):

```
# comandos/oi.txt
Fala, #nomeAutor[]!
```

E, se quiser, eventos em `./eventos/pronto.txt`, `erro.txt`,
`mensagemCriada.txt` ou `depuracao.txt`:

```
# eventos/pronto.txt
#log[Online como #nomeBot[]!]
```

Depois é só rodar:

```bash
npx facility iniciar
```

Veja um projeto completo funcionando em `exemplo-sem-js/`. O formato antigo
(`.js` com `module.exports = { nome, codigo }` e `bot.on(...)` no código)
continua funcionando normalmente — os dois formatos podem até conviver na
mesma pasta de comandos.

