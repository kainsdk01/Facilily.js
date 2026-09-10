# facility.js

Biblioteca 100% brasileira para criar bots de Discord. Toda a API é em português.

## Instalação

```bash
npm install facility.js
```

## Rodar sem escrever JavaScript

Crie um `facility.config` na raiz do projeto:

```
TOKEN=seu-token-aqui
PREFIXO=!
INTENCOES=SERVIDORES,MENSAGENS_DO_SERVIDOR,CONTEUDO_DE_MENSAGEM
COMANDOS=./comandos
EVENTOS=./eventos
```

Comandos ficam em `./comandos/nome.txt`, com o código de tags direto:

```
# comandos/oi.txt
Fala, #nomeAutor[]!
```

Eventos (opcional) ficam em `./eventos/nomeDoEvento.txt` — veja a lista completa em [docs/eventos.md](docs/eventos.md). Depois é só rodar:

```bash
npx facility iniciar
```

## Uso via JavaScript

```js
const { Cliente, Intencoes, combinar } = require('facility.js');

const bot = new Cliente({
  prefixo: '!',
  intencoes: combinar(Intencoes.SERVIDORES, Intencoes.MENSAGENS_DO_SERVIDOR, Intencoes.CONTEUDO_DE_MENSAGEM),
});

bot.carregarComandos('./comandos'); // .js ou .txt, pode misturar
bot.carregarEventos('./eventos');   // opcional
bot.entrar('SEU_TOKEN_AQUI');
```

## Documentação

- **[Eventos disponíveis](docs/eventos.md)**
- **[175 tags de segurança e utilidades](docs/tags.md)**
