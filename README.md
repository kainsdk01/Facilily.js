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

## Estrutura

```
facility.js/
├── index.js                    # ponto de entrada
├── example.js                  # exemplo de bot com !ping
├── package.json
└── src/
    ├── Cliente.js               # une gateway + rest, emite eventos de alto nível
    ├── ClienteGateway.js        # WebSocket, heartbeat, resume, reconexão
    ├── ClienteRest.js           # requisições HTTP com rate limit por bucket
    ├── Intencoes.js             # bitfield de intents (Intenções)
    └── estruturas/
        └── Mensagem.js          # classe com .responder() e .enviarNoCanal()
```

## Eventos disponíveis

| Evento | Quando dispara |
|---|---|
| `pronto` | Conexão estabelecida e cliente autenticado |
| `mensagemCriada` | Uma mensagem é criada em um canal |
| `depuracao` | Mensagens internas de debug |
| `erro` | Erro no gateway |
| `bruto` | Qualquer evento do gateway não tratado explicitamente |

## API do Cliente

- `cliente.entrar(token)` — conecta ao Discord
- `cliente.usuario` — dados do bot autenticado
- `cliente.servidores` — Map de servidores (guilds) em cache
- `cliente.rest` — instância de `ClienteRest` para chamadas diretas à API

## API da Mensagem

- `mensagem.responder(conteudo)` — responde citando a mensagem original
- `mensagem.enviarNoCanal(conteudo)` — envia uma mensagem nova no mesmo canal

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

Funções aninhadas funcionam: `#cor{#pegarVar{corPadrao}}`. Argumentos são separados por `;`. Pra usar `;`, `{`, `}` ou `#` literais, escape com `\`.

### Funções disponíveis

| Função | Uso |
|---|---|
| `#titulo{texto}` | Define o título do embed |
| `#descricao{texto}` | Define a descrição do embed |
| `#cor{nome ou hex}` | Cor do embed (`VERMELHO`, `VERDE`, `AZUL`, `AMARELO`, `ROXO`, `LARANJA`, `PRETO`, `BRANCO`, `CINZA`, ou hex tipo `#ff0000`) |
| `#imagem{url}` | Imagem grande do embed |
| `#thumbnail{url}` | Miniatura do embed |
| `#rodape{texto;iconeUrl}` | Rodapé do embed |
| `#autorEmbed{nome;iconeUrl}` | Autor exibido no embed |
| `#campo{nome;valor;inline}` | Adiciona um campo ao embed (`inline` é `true` ou `false`) |
| `#texto{conteudo}` | Texto simples enviado junto (fora do embed) |
| `#mencaoAutor{}` | Menção de quem executou o comando |
| `#nomeAutor{}` | Nome de usuário de quem executou |
| `#idAutor{}` / `#idCanal{}` / `#idServidor{}` | IDs do contexto atual |
| `#argumento{indice}` | Argumento do comando pela posição (0, 1, 2...) |
| `#argumentos{}` | Todos os argumentos juntos |
| `#totalArgumentos{}` | Quantidade de argumentos passados |
| `#definirVar{nome;valor}` / `#pegarVar{nome}` | Variáveis em memória, compartilhadas entre comandos |
| `#se{condicao;entao;senao}` | Condicional simples com `==`, `!=`, `>`, `<`, `>=`, `<=` |

### Criando novas funções

```js
const { registrarFuncao } = require('facility.js');

registrarFuncao('maiusculo', (args) => (args[0] ?? '').toUpperCase());
```

Agora `#maiusculo{ola mundo}` funciona em qualquer comando.
