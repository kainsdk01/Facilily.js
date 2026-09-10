const { registrar } = require('./RegistroFuncoes');
const { servidorCache, cabecalhoMotivo } = require('./AjudantesDiscord');

function acharCargo(ctx, idCargo) {
  return servidorCache(ctx)?.roles?.find((c) => c.id === idCargo);
}

// #existeCargo[idCargo] -> "true"/"false"
registrar('existeCargo', (args, ctx) => String(Boolean(acharCargo(ctx, args[0]))));

// #corCargo[idCargo] -> hex, "#000000" se não tiver cor
registrar('corCargo', (args, ctx) => {
  const cargo = acharCargo(ctx, args[0]);
  if (!cargo) return '';
  return `#${(cargo.color || 0).toString(16).padStart(6, '0')}`;
});

// #posicaoCargo[idCargo] -> posição na hierarquia (quanto maior, mais alto)
registrar('posicaoCargo', (args, ctx) => {
  const cargo = acharCargo(ctx, args[0]);
  return cargo ? String(cargo.position) : '';
});

// #cargoMencionavel[idCargo] -> "true"/"false"
registrar('cargoMencionavel', (args, ctx) => {
  const cargo = acharCargo(ctx, args[0]);
  return String(Boolean(cargo?.mentionable));
});

// #cargoEhGerenciado[idCargo] -> "true"/"false", cargo automático de bot/integração
registrar('cargoEhGerenciado', (args, ctx) => {
  const cargo = acharCargo(ctx, args[0]);
  return String(Boolean(cargo?.managed));
});

// #mencaoCargo[idCargo] -> "<@&id>", pronto pra colar na mensagem
registrar('mencaoCargo', (args) => (args[0] ? `<@&${args[0]}>` : ''));

// #criarCargo[nome;corHex;mencionavel] -> cria o cargo e devolve o ID
registrar('criarCargo', async (args, ctx) => {
  const nome = args[0];
  const corHex = args[1];
  const mencionavel = args[2] === 'true';
  if (!nome) return '⚠️ Uso: `#criarCargo[nome;corHex;mencionavel]`';

  try {
    const cargo = await ctx.cliente.rest.post(`/guilds/${ctx.mensagem.servidorId}/roles`, {
      name: nome,
      color: corHex ? parseInt(corHex.replace('#', ''), 16) : 0,
      mentionable: mencionavel,
    });
    return cargo.id;
  } catch (erro) {
    return `❌ Não consegui criar o cargo: ${erro.message}`;
  }
});

// #editarCargo[idCargo;nome;corHex] -> edita nome e/ou cor de um cargo já existente
registrar('editarCargo', async (args, ctx) => {
  const idCargo = args[0];
  const nome = args[1];
  const corHex = args[2];
  if (!idCargo) return '⚠️ Uso: `#editarCargo[idCargo;nome;corHex]`';

  const corpo = {};
  if (nome) corpo.name = nome;
  if (corHex) corpo.color = parseInt(corHex.replace('#', ''), 16);

  try {
    await ctx.cliente.rest.patch(`/guilds/${ctx.mensagem.servidorId}/roles/${idCargo}`, corpo);
    return '✅ Cargo editado.';
  } catch (erro) {
    return `❌ Não consegui editar o cargo: ${erro.message}`;
  }
});

// #deletarCargo[idCargo]
registrar('deletarCargo', async (args, ctx) => {
  const idCargo = args[0];
  if (!idCargo) return '⚠️ Uso: `#deletarCargo[idCargo]`';

  try {
    await ctx.cliente.rest.deletar(`/guilds/${ctx.mensagem.servidorId}/roles/${idCargo}`, cabecalhoMotivo(args[1]));
    return '🗑️ Cargo deletado.';
  } catch (erro) {
    return `❌ Não consegui deletar o cargo: ${erro.message}`;
  }
});

// #moverCargo[idCargo;novaPosicao] -> muda a posição do cargo na hierarquia
registrar('moverCargo', async (args, ctx) => {
  const idCargo = args[0];
  const posicao = Number(args[1]);
  if (!idCargo || Number.isNaN(posicao)) return '⚠️ Uso: `#moverCargo[idCargo;novaPosicao]`';

  try {
    await ctx.cliente.rest.patch(`/guilds/${ctx.mensagem.servidorId}/roles`, [{ id: idCargo, position: posicao }]);
    return '✅ Cargo movido.';
  } catch (erro) {
    return `❌ Não consegui mover o cargo: ${erro.message}`;
  }
});

module.exports = {};
