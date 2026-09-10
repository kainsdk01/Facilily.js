const { registrar } = require('./RegistroFuncoes');

// #criarRegraAutomod[nome;palavrasSeparadasPorVirgula;acao]
// acao: "bloquear" (BLOCK_MESSAGE) ou "avisar" (SEND_ALERT_MESSAGE, precisa de canal configurado à parte)
registrar('criarRegraAutomod', async (args, ctx) => {
  const [nome, palavras] = args;
  if (!nome || !palavras) return '⚠️ Uso: `#criarRegraAutomod[nome;palavra1,palavra2;acao]`';

  try {
    const regra = await ctx.cliente.rest.post(`/guilds/${ctx.mensagem.servidorId}/auto-moderation/rules`, {
      name: nome,
      event_type: 1,
      trigger_type: 1, // KEYWORD
      trigger_metadata: { keyword_filter: palavras.split(',').map((p) => p.trim()) },
      actions: [{ type: 1 }], // BLOCK_MESSAGE
      enabled: true,
    });
    return regra.id;
  } catch (erro) {
    return `❌ Não consegui criar a regra: ${erro.message}`;
  }
});

// #deletarRegraAutomod[idRegra]
registrar('deletarRegraAutomod', async (args, ctx) => {
  const idRegra = args[0];
  if (!idRegra) return '⚠️ Uso: `#deletarRegraAutomod[idRegra]`';
  try {
    await ctx.cliente.rest.deletar(`/guilds/${ctx.mensagem.servidorId}/auto-moderation/rules/${idRegra}`);
    return '🗑️ Regra deletada.';
  } catch (erro) {
    return `❌ Não consegui deletar: ${erro.message}`;
  }
});

// #listarRegrasAutomod[] -> "nome(id), nome(id), ..."
registrar('listarRegrasAutomod', async (_args, ctx) => {
  try {
    const regras = await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/auto-moderation/rules`);
    if (regras.length === 0) return 'Nenhuma regra configurada.';
    return regras.map((r) => `${r.name}(${r.id})`).join(', ');
  } catch (erro) {
    return `❌ Não consegui listar: ${erro.message}`;
  }
});

// #regraAutomodAtiva[idRegra] -> "true"/"false"
registrar('regraAutomodAtiva', async (args, ctx) => {
  const idRegra = args[0];
  if (!idRegra) return 'false';
  try {
    const regra = await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/auto-moderation/rules/${idRegra}`);
    return String(Boolean(regra.enabled));
  } catch {
    return 'false';
  }
});

// #ativarRegraAutomod[idRegra;true|false]
registrar('ativarRegraAutomod', async (args, ctx) => {
  const [idRegra, valor] = args;
  if (!idRegra) return '⚠️ Uso: `#ativarRegraAutomod[idRegra;true|false]`';
  try {
    await ctx.cliente.rest.patch(`/guilds/${ctx.mensagem.servidorId}/auto-moderation/rules/${idRegra}`, {
      enabled: valor !== 'false',
    });
    return '✅ Regra atualizada.';
  } catch (erro) {
    return `❌ Não consegui atualizar: ${erro.message}`;
  }
});

module.exports = {};
