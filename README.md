# facility.js

Biblioteca 100% brasileira para criar bots de Discord em JavaScript. Toda a API — classes, métodos e eventos — é em português.

## Instalação

```bash
npm install
```

## Uso básico

```js
const { Cliente, Intencoes, combinar } = require('facility.js');

const cliente = new Cliente({
  intencoes: combinar(Intencoes.SERVIDORES, Intencoes.MENSAGENS_DO_SERVIDOR, Intencoes.CONTEUDO_DE_MENSAGEM),
});

cliente.on('pronto', () => {
  console.log(`Logado como ${cliente.usuario.username}`);
});

cliente.on('mensagemCriada', (mensagem) => {
  if (mensagem.conteudo === '!ping') {
    mensagem.responder('Pong!');
  }
});

cliente.entrar('SEU_TOKEN_AQUI');
```

## Sistema de comandos por código (`#funcao{}`)

Assim como o aoi.js usa `$titulo[]`, aqui usamos `#titulo{}`. Registre um comando com `cliente.comando(nome, { codigo })` — o resultado é enviado automaticamente no canal ao final da execução (não precisa chamar nada pra "enviar").

```js
cliente.comando('perfil', {
  codigo: `
    #titulo{Perfil de #nomeAutor{}}
    #cor{AZUL}
    #descricao{Olá, #mencaoAutor{}! Você está no servidor #idServidor{}.}
    #campo{ID do canal;#idCanal{};true}
  `,
});
```

