const { registrar } = require('./RegistroFuncoes');
const { servidorCache } = require('./AjudantesDiscord');

// Tudo em memória: entradas recentes por servidor + config de limite/janela.
const entradasRecentes = new Map(); // servidorId -> [timestamps]
const configuracoes = new Map(); // servidorId -> { limite, janelaSegundos }
const modoAtivo = new Set(); // servidorIds com o modo anti-raid ligado manualmente

// #configurarAntiRaid[limiteEntradas;janelaSegundos] -> ex: 10 entradas em 30s é considerado raid
registrar('configurarAntiRaid', (args, ctx) => {
  const limite = Number(args[0]);
  const janela = Number(args[1]);
  if (Number.isNaN(limite) || Number.isNaN(janela)) {
    return '⚠️ Uso: `#configurarAntiRaid[limiteEntradas;janelaSegundos]`';
  }
  configuracoes.set(ctx.mensagem.servidorId, { limite, janelaSegundos: janela });
  return '✅ Anti-raid configurado.';
});

// #registrarEntradaAntiRaid[] -> chame isso dentro do evento membroEntrou.txt
registrar('registrarEntradaAntiRaid', (_args, ctx) => {
  const servidorId = ctx.mensagem.servidorId;
  const lista = entradasRecentes.get(servidorId) ?? [];
  lista.push(Date.now());
  entradasRecentes.set(servidorId, lista);
  return '';
});

// #detectarRaid[] -> "true"/"false", se a quantidade de entradas na janela configurada passou do limite
registrar('detectarRaid', (_args, ctx) => {
  const servidorId = ctx.mensagem.servidorId;
  const config = configuracoes.get(servidorId);
  if (!config) return 'false';
  const agora = Date.now();
  const limiteJanela = agora - config.janelaSegundos * 1000;
  const recentes = (entradasRecentes.get(servidorId) ?? []).filter((t) => t >= limiteJanela);
  entradasRecentes.set(servidorId, recentes);
  return String(recentes.length >= config.limite);
});

// #ativarModoAntiRaid[]
registrar('ativarModoAntiRaid', (_args, ctx) => {
  modoAtivo.add(ctx.mensagem.servidorId);
  return '🛡️ Modo anti-raid ativado.';
});

// #desativarModoAntiRaid[]
registrar('desativarModoAntiRaid', (_args, ctx) => {
  modoAtivo.delete(ctx.mensagem.servidorId);
  return '✅ Modo anti-raid desativado.';
});

// #modoAntiRaidAtivo[] -> "true"/"false"
registrar('modoAntiRaidAtivo', (_args, ctx) => String(modoAtivo.has(ctx.mensagem.servidorId)));

// #ativarLockdown[] -> tranca TODOS os canais de texto do servidor de uma vez (diferente de
// #trancar[], que só tranca o canal atual)
registrar('ativarLockdown', async (_args, ctx) => {
  const servidor = servidorCache(ctx);
  const canaisDeTexto = (servidor?.channels ?? []).filter((c) => c.type === 0);
  let sucesso = 0;
  for (const canal of canaisDeTexto) {
    try {
      await ctx.cliente.rest.put(`/channels/${canal.id}/permissions/${servidor.id}`, {
        type: 0,
        deny: '2048', // SEND_MESSAGES
      });
      sucesso++;
    } catch {
      // segue tentando os outros canais mesmo se um falhar
    }
  }
  return `🔒 Lockdown aplicado em ${sucesso} de ${canaisDeTexto.length} canais.`;
});

// #desativarLockdown[] -> desfaz o #ativarLockdown[]
registrar('desativarLockdown', async (_args, ctx) => {
  const servidor = servidorCache(ctx);
  const canaisDeTexto = (servidor?.channels ?? []).filter((c) => c.type === 0);
  let sucesso = 0;
  for (const canal of canaisDeTexto) {
    try {
      await ctx.cliente.rest.deletar(`/channels/${canal.id}/permissions/${servidor.id}`);
      sucesso++;
    } catch {
      // segue tentando os outros
    }
  }
  return `🔓 Lockdown removido de ${sucesso} de ${canaisDeTexto.length} canais.`;
});

module.exports = {};
