const { registrar } = require('./RegistroFuncoes');
const { resolverAlvo } = require('./AjudantesDiscord');

// Tipos de ação do audit log da Discord que a gente usa aqui.
const ACAO = {
  BAN: 22,
  KICK: 20,
  CHANNEL_DELETE: 12,
  ROLE_DELETE: 32,
};

async function buscarUltimaEntradaAuditoria(ctx, tipoAcao, alvoId) {
  try {
    const resultado = await ctx.cliente.rest.get(
      `/guilds/${ctx.mensagem.servidorId}/audit-logs?action_type=${tipoAcao}&limit=20`
    );
    const entradas = resultado.audit_log_entries ?? [];
    return alvoId ? entradas.find((e) => e.target_id === alvoId) : entradas[0];
  } catch {
    return null;
  }
}

// #quemBaniu[idOuMencao] -> id de quem executou o ban mais recente contra esse usuário
registrar('quemBaniu', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const entrada = await buscarUltimaEntradaAuditoria(ctx, ACAO.BAN, alvo);
  return entrada?.user_id ?? '';
});

// #quemExpulsou[idOuMencao] -> id de quem expulsou (kick) esse usuário mais recentemente
registrar('quemExpulsou', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const entrada = await buscarUltimaEntradaAuditoria(ctx, ACAO.KICK, alvo);
  return entrada?.user_id ?? '';
});

// #quemDeletouCanal[idCanal] -> id de quem deletou aquele canal
registrar('quemDeletouCanal', async (args, ctx) => {
  const idCanal = args[0];
  if (!idCanal) return '⚠️ Uso: `#quemDeletouCanal[idCanal]`';
  const entrada = await buscarUltimaEntradaAuditoria(ctx, ACAO.CHANNEL_DELETE, idCanal);
  return entrada?.user_id ?? '';
});

// #quemDeletouCargo[idCargo] -> id de quem deletou aquele cargo
registrar('quemDeletouCargo', async (args, ctx) => {
  const idCargo = args[0];
  if (!idCargo) return '⚠️ Uso: `#quemDeletouCargo[idCargo]`';
  const entrada = await buscarUltimaEntradaAuditoria(ctx, ACAO.ROLE_DELETE, idCargo);
  return entrada?.user_id ?? '';
});

// #ultimaAcaoModeracao[] -> resumo em texto da entrada mais recente de qualquer tipo
registrar('ultimaAcaoModeracao', async (_args, ctx) => {
  try {
    const resultado = await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/audit-logs?limit=1`);
    const entrada = resultado.audit_log_entries?.[0];
    if (!entrada) return 'Nenhuma ação registrada.';
    return `Ação ${entrada.action_type} por <@${entrada.user_id}> em <@${entrada.target_id}>${
      entrada.reason ? ` — motivo: ${entrada.reason}` : ''
    }`;
  } catch (erro) {
    return `❌ Não consegui ler a auditoria: ${erro.message}`;
  }
});

// #totalBanidos[] -> quantidade de usuários banidos no servidor
registrar('totalBanidos', async (_args, ctx) => {
  try {
    const banidos = await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/bans?limit=1000`);
    return String(banidos.length);
  } catch {
    return '0';
  }
});

// #listaBanidos[quantidade] -> ids separados por vírgula
registrar('listaBanidos', async (args, ctx) => {
  const limite = Math.min(Number(args[0]) || 20, 1000);
  try {
    const banidos = await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/bans?limit=${limite}`);
    return banidos.map((b) => b.user.id).join(',');
  } catch {
    return '';
  }
});

// ---- Convites ----

async function buscarConvite(ctx, codigo) {
  const convites = await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/invites`);
  return convites.find((c) => c.code === codigo) ?? null;
}

// #codigoConviteValido[codigo] -> "true"/"false"
registrar('codigoConviteValido', async (args, ctx) => {
  const convite = await buscarConvite(ctx, args[0]).catch(() => null);
  return String(Boolean(convite));
});

// #usosConvite[codigo]
registrar('usosConvite', async (args, ctx) => {
  const convite = await buscarConvite(ctx, args[0]).catch(() => null);
  return String(convite?.uses ?? 0);
});

// #criadorConvite[codigo] -> id de quem criou
registrar('criadorConvite', async (args, ctx) => {
  const convite = await buscarConvite(ctx, args[0]).catch(() => null);
  return convite?.inviter?.id ?? '';
});

// #validadeConvite[codigo] -> "Nunca expira" ou data/hora de expiração
registrar('validadeConvite', async (args, ctx) => {
  const convite = await buscarConvite(ctx, args[0]).catch(() => null);
  if (!convite) return '';
  if (!convite.max_age) return 'Nunca expira';
  const criadoEm = new Date(convite.created_at).getTime();
  return new Date(criadoEm + convite.max_age * 1000).toLocaleString('pt-BR');
});

// #deletarConvite[codigo]
registrar('deletarConvite', async (args, ctx) => {
  const codigo = args[0];
  if (!codigo) return '⚠️ Uso: `#deletarConvite[codigo]`';
  try {
    await ctx.cliente.rest.deletar(`/invites/${codigo}`);
    return '✅ Convite deletado.';
  } catch (erro) {
    return `❌ Não consegui deletar o convite: ${erro.message}`;
  }
});

// #totalConvitesAtivos[]
registrar('totalConvitesAtivos', async (_args, ctx) => {
  try {
    const convites = await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/invites`);
    return String(convites.length);
  } catch {
    return '0';
  }
});

// #verificarLinkDiscord[texto] -> "true"/"false", detecta convite de outro servidor no texto
registrar('verificarLinkDiscord', (args) => {
  const texto = args[0] ?? '';
  return String(/(discord\.gg|discord(app)?\.com\/invite)\/[a-zA-Z0-9-]+/i.test(texto));
});

// #contemMencaoEveryone[texto] -> "true"/"false"
registrar('contemMencaoEveryone', (args) => {
  const texto = args[0] ?? '';
  return String(/@(everyone|here)/.test(texto));
});

module.exports = {};
