const fs = require('node:fs');
const path = require('node:path');

/**
 * Lê um arquivo no formato CHAVE=valor (uma por linha, # inicia comentário)
 * e devolve um objeto simples com essas chaves.
 * Não lança erro se o arquivo não existir — devolve {} pra quem chamar decidir o que fazer.
 */
function lerArquivoConfig(caminhoArquivo) {
  if (!fs.existsSync(caminhoArquivo)) return {};

  const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
  const config = {};

  for (const linhaBruta of conteudo.split('\n')) {
    const linha = linhaBruta.trim();
    if (!linha || linha.startsWith('#')) continue;

    const indiceIgual = linha.indexOf('=');
    if (indiceIgual === -1) continue;

    const chave = linha.slice(0, indiceIgual).trim().toUpperCase();
    const valor = linha.slice(indiceIgual + 1).trim();
    config[chave] = valor;
  }

  return config;
}

/**
 * Carrega e normaliza o facility.config de uma pasta de projeto.
 * Retorna sempre o mesmo formato, com padrões sensatos pra chaves ausentes.
 *
 * Chaves reconhecidas no facility.config:
 *   TOKEN=...                (obrigatório pra rodar via CLI)
 *   PREFIXO=!
 *   INTENCOES=SERVIDORES,MENSAGENS_DO_SERVIDOR,CONTEUDO_DE_MENSAGEM
 *   COMANDOS=./comandos
 *   EVENTOS=./eventos
 */
function carregarConfig(pastaProjeto = process.cwd()) {
  const caminhoArquivo = path.join(pastaProjeto, 'facility.config');
  const bruto = lerArquivoConfig(caminhoArquivo);

  return {
    caminhoArquivo,
    encontrado: fs.existsSync(caminhoArquivo),
    token: bruto.TOKEN || process.env.DISCORD_TOKEN || '',
    prefixo: bruto.PREFIXO || '!',
    intencoes: bruto.INTENCOES
      ? bruto.INTENCOES.split(',').map((item) => item.trim()).filter(Boolean)
      : [],
    pastaComandos: bruto.COMANDOS || './comandos',
    pastaEventos: bruto.EVENTOS || './eventos',
  };
}

module.exports = { carregarConfig, lerArquivoConfig };
