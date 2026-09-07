# facility.js

Biblioteca 100% brasileira para criar bots de Discord em JavaScript. Toda a API — classes, métodos e eventos — é em português.

## Instalação

```bash
npm install
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

