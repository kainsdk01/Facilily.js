const { registrar } = require('./RegistroFuncoes');

// #criarConvite[] -> cria um convite pro canal atual, válido por 24h
registrar('criarConvite', async (_args, ctx) => {
  try {
    const convite = await ctx.cliente.rest.post(`/channels/${ctx.mensagem.canalId}/invites`, {
      max_age: 86400,
    });
    return `https://discord.gg/${convite.code}`;
  } catch (erro) {
    return `❌ Não consegui criar o convite: ${erro.message}`;
  }
});

// #criarCanal[nome] -> cria um canal de texto novo, devolve o ID dele
registrar('criarCanal', async (args, ctx) => {
  const nome = args[0];
  if (!nome) return '⚠️ Uso: `#criarCanal[nome]`';

  try {
    const canal = await ctx.cliente.rest.post(`/guilds/${ctx.mensagem.servidorId}/channels`, {
      name: nome,
      type: 0,
    });
    return canal.id;
  } catch (erro) {
    return `❌ Não consegui criar o canal: ${erro.message}`;
  }
});

// #deletarCanal[idDoCanal]
registrar('deletarCanal', async (args, ctx) => {
  const idCanal = args[0];
  if (!idCanal) return '⚠️ Uso: `#deletarCanal[idDoCanal]`';

  try {
    await ctx.cliente.rest.deletar(`/channels/${idCanal}`);
    return '🗑️ Canal deletado.';
  } catch (erro) {
    return `❌ Não consegui deletar o canal: ${erro.message}`;
  }
});

// #enviarDM[idOuMencao;texto] -> manda mensagem privada pro usuário
registrar('enviarDM', async (args, ctx) => {
  const alvo = args[0];
  const texto = args[1];
  if (!alvo || !texto) return '⚠️ Uso: `#enviarDM[idOuMencao;texto]`';

  try {
    const canalDM = await ctx.cliente.rest.post('/users/@me/channels', { recipient_id: alvo });
    await ctx.cliente.rest.post(`/channels/${canalDM.id}/messages`, { content: texto });
    return `✅ DM enviada para <@${alvo}>.`;
  } catch (erro) {
    return `❌ Não consegui enviar a DM: ${erro.message}`;
  }
});

module.exports = {};
