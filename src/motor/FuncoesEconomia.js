const { registrar } = require('./RegistroFuncoes');
const banco = require('../economia/Banco');

// Se não passar um alvo, usa quem executou o comando.
function resolverAlvo(args, indice, ctx) {
  return args[indice] || ctx.mensagem.autor.id;
}

// =========================================================
// ECONOMIA POR SERVIDOR
// Cada servidor tem seu próprio saldo pra cada usuário.
// =========================================================

// #saldo[alvo] -> número. Sem argumento, mostra o saldo de quem chamou.
registrar('saldo', (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  return String(banco.obterSaldo(ctx.mensagem.servidorId, alvo));
});

// #addSaldo[idOuMencao;quantidade] -> soma e devolve o novo saldo
registrar('addSaldo', (args, ctx) => {
  const alvo = args[0];
  const quantidade = Number(args[1]);
  if (!alvo || Number.isNaN(quantidade)) {
    return '⚠️ Uso: `#addSaldo[idOuMencao;quantidade]`';
  }
  return String(banco.adicionarSaldo(ctx.mensagem.servidorId, alvo, quantidade));
});

// #removerSaldo[idOuMencao;quantidade] -> subtrai e devolve o novo saldo (nunca fica negativo)
registrar('removerSaldo', (args, ctx) => {
  const alvo = args[0];
  const quantidade = Number(args[1]);
  if (!alvo || Number.isNaN(quantidade)) {
    return '⚠️ Uso: `#removerSaldo[idOuMencao;quantidade]`';
  }
  return String(banco.removerSaldo(ctx.mensagem.servidorId, alvo, quantidade));
});

// #definirSaldo[idOuMencao;quantidade] -> define um valor exato, ignora o que tinha antes
registrar('definirSaldo', (args, ctx) => {
  const alvo = args[0];
  const quantidade = Number(args[1]);
  if (!alvo || Number.isNaN(quantidade)) {
    return '⚠️ Uso: `#definirSaldo[idOuMencao;quantidade]`';
  }
  return String(banco.definirSaldo(ctx.mensagem.servidorId, alvo, quantidade));
});

// #ranking[quantidade] -> lista pronta, um usuário por linha, do mais rico ao menos rico
// Bônus: como a linguagem de tags não tem "loop", isso não dava pra montar só com
// addSaldo/saldo — por isso incluí pronto.
registrar('ranking', (args, ctx) => {
  const limite = Number(args[0]) || 10;
  const lista = banco.ranking(ctx.mensagem.servidorId, limite);
  if (lista.length === 0) return 'Ninguém tem saldo registrado neste servidor ainda.';
  return lista
    .map((item, i) => `${i + 1}. <@${item.usuarioId}> — ${item.saldo}`)
    .join('\n');
});

// =========================================================
// ECONOMIA GLOBAL
// Mesmo saldo do usuário em qualquer servidor onde o bot estiver.
// =========================================================

registrar('saldoGlobal', (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  return String(banco.obterSaldoGlobal(alvo));
});

registrar('addSaldoGlobal', (args) => {
  const alvo = args[0];
  const quantidade = Number(args[1]);
  if (!alvo || Number.isNaN(quantidade)) {
    return '⚠️ Uso: `#addSaldoGlobal[idOuMencao;quantidade]`';
  }
  return String(banco.adicionarSaldoGlobal(alvo, quantidade));
});

registrar('removerSaldoGlobal', (args) => {
  const alvo = args[0];
  const quantidade = Number(args[1]);
  if (!alvo || Number.isNaN(quantidade)) {
    return '⚠️ Uso: `#removerSaldoGlobal[idOuMencao;quantidade]`';
  }
  return String(banco.removerSaldoGlobal(alvo, quantidade));
});

registrar('definirSaldoGlobal', (args) => {
  const alvo = args[0];
  const quantidade = Number(args[1]);
  if (!alvo || Number.isNaN(quantidade)) {
    return '⚠️ Uso: `#definirSaldoGlobal[idOuMencao;quantidade]`';
  }
  return String(banco.definirSaldoGlobal(alvo, quantidade));
});

registrar('rankingGlobal', (args) => {
  const limite = Number(args[0]) || 10;
  const lista = banco.rankingGlobal(limite);
  if (lista.length === 0) return 'Ninguém tem saldo global registrado ainda.';
  return lista
    .map((item, i) => `${i + 1}. <@${item.usuarioId}> — ${item.saldo}`)
    .join('\n');
});

module.exports = {};
