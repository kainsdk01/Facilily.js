const { criarArmazenamento } = require('../dados/ArmazenamentoJSON');

// Antes esse arquivo reimplementava sua própria leitura/escrita de JSON,
// em paralelo ao que ArmazenamentoJSON.js já fazia de forma mais completa
// (escrita async, atômica e enfileirada). Agora só usa esse storage.
const { estado, salvar } = criarArmazenamento('economia.json', () => ({
  servidores: {},
  global: {},
}));
const dados = estado.dados;

// ---- Por servidor ----

function obterSaldo(servidorId, usuarioId) {
  return dados.servidores[servidorId]?.[usuarioId] ?? 0;
}

function definirSaldo(servidorId, usuarioId, valor) {
  if (!dados.servidores[servidorId]) dados.servidores[servidorId] = {};
  dados.servidores[servidorId][usuarioId] = Math.max(0, Math.trunc(valor));
  salvar();
  return dados.servidores[servidorId][usuarioId];
}

function adicionarSaldo(servidorId, usuarioId, quantidade) {
  return definirSaldo(servidorId, usuarioId, obterSaldo(servidorId, usuarioId) + quantidade);
}

function removerSaldo(servidorId, usuarioId, quantidade) {
  return definirSaldo(servidorId, usuarioId, obterSaldo(servidorId, usuarioId) - quantidade);
}

function ranking(servidorId, limite = 10) {
  const contas = dados.servidores[servidorId] ?? {};
  return Object.entries(contas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([usuarioId, saldo]) => ({ usuarioId, saldo }));
}

// ---- Global (mesmo saldo em qualquer servidor) ----

function obterSaldoGlobal(usuarioId) {
  return dados.global[usuarioId] ?? 0;
}

function definirSaldoGlobal(usuarioId, valor) {
  dados.global[usuarioId] = Math.max(0, Math.trunc(valor));
  salvar();
  return dados.global[usuarioId];
}

function adicionarSaldoGlobal(usuarioId, quantidade) {
  return definirSaldoGlobal(usuarioId, obterSaldoGlobal(usuarioId) + quantidade);
}

function removerSaldoGlobal(usuarioId, quantidade) {
  return definirSaldoGlobal(usuarioId, obterSaldoGlobal(usuarioId) - quantidade);
}

function rankingGlobal(limite = 10) {
  return Object.entries(dados.global)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([usuarioId, saldo]) => ({ usuarioId, saldo }));
}

module.exports = {
  obterSaldo,
  definirSaldo,
  adicionarSaldo,
  removerSaldo,
  ranking,
  obterSaldoGlobal,
  definirSaldoGlobal,
  adicionarSaldoGlobal,
  removerSaldoGlobal,
  rankingGlobal,
};
