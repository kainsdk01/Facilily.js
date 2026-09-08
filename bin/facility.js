#!/usr/bin/env node
const path = require('node:path');
const fs = require('node:fs');
const { Cliente } = require('../src/Cliente');
const { resolver } = require('../src/Intencoes');
const { carregarConfig } = require('../src/Config');

const USO = `
facility.js — CLI

Uso:
  npx facility iniciar

Isso lê o facility.config da pasta atual e sobe o bot, sem precisar de
nenhum arquivo .js escrito à mão. Exemplo de facility.config:

  TOKEN=seu-token-aqui
  PREFIXO=!
  INTENCOES=SERVIDORES,MENSAGENS_DO_SERVIDOR,CONTEUDO_DE_MENSAGEM
  COMANDOS=./comandos
  EVENTOS=./eventos

Comandos vão em ./comandos/nome.txt (conteúdo = código de tags).
Eventos vão em ./eventos/pronto.txt, erro.txt, mensagemCriada.txt, depuracao.txt.
`;

function iniciar() {
  const config = carregarConfig(process.cwd());

  if (!config.encontrado) {
    console.error(`facility.config não encontrado em ${config.caminhoArquivo}`);
    console.error('Crie esse arquivo na raiz do seu projeto antes de rodar "npx facility iniciar".');
    process.exit(1);
  }

  if (!config.token) {
    console.error('TOKEN ausente. Defina TOKEN=... no facility.config (ou a variável de ambiente DISCORD_TOKEN).');
    process.exit(1);
  }

  const bot = new Cliente({
    prefixo: config.prefixo,
    intencoes: config.intencoes.length ? resolver(config.intencoes) : 0,
  });

  const pastaComandos = path.resolve(process.cwd(), config.pastaComandos);
  if (fs.existsSync(pastaComandos)) {
    bot.carregarComandos(pastaComandos);
  } else {
    console.log(`[facility.js] pasta de comandos não encontrada (${pastaComandos}), pulando.`);
  }

  bot.carregarEventos(path.resolve(process.cwd(), config.pastaEventos));

  bot.on('depuracao', (msg) => console.log('[facility.js]', msg));
  bot.on('erro', (erro) => console.error('[facility.js] erro:', erro));

  bot.entrar(config.token);
}

const subcomando = process.argv[2];

if (subcomando === 'iniciar') {
  iniciar();
} else {
  console.log(USO);
  process.exit(subcomando ? 1 : 0);
}
