const { registrar } = require('./RegistroFuncoes');

const INICIADO_EM = Date.now();

// #uptimeBot[] -> segundos desde que o bot conectou
registrar('uptimeBot', () => String(Math.floor((Date.now() - INICIADO_EM) / 1000)));

// #versaoBiblioteca[] -> versão da facility.js, lida direto do package.json
registrar('versaoBiblioteca', () => {
  try {
    return require('../../package.json').version ?? 'desconhecida';
  } catch {
    return 'desconhecida';
  }
});

// #totalServidoresBot[] -> quantos servidores o bot está atualmente
registrar('totalServidoresBot', (_args, ctx) => String(ctx.cliente.servidores.size));

// #estaNoServidor[idServidor] -> "true"/"false"
registrar('estaNoServidor', (args, ctx) => String(ctx.cliente.servidores.has(args[0])));

// #listarServidoresBot[quantidade] -> "nome(id), nome(id), ..."
registrar('listarServidoresBot', (args, ctx) => {
  const limite = Number(args[0]) || 20;
  const lista = [...ctx.cliente.servidores.values()].slice(0, limite);
  return lista.map((s) => `${s.name}(${s.id})`).join(', ');
});

// #ping[] -> latência aproximada até a API REST da Discord, em milissegundos
registrar('ping', async (_args, ctx) => {
  const inicio = Date.now();
  try {
    await ctx.cliente.rest.get('/gateway');
    return String(Date.now() - inicio);
  } catch (erro) {
    return `❌ Não consegui medir: ${erro.message}`;
  }
});

module.exports = {};
