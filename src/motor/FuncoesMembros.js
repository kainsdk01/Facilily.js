const { registrar } = require('./RegistroFuncoes');
const {
  resolverAlvo,
  servidorCache,
  PERMISSOES,
  calcularPermissoesBase,
  temPermissaoBit,
  buscarMembro,
  dataDoSnowflake,
} = require('./AjudantesDiscord');

// #existeMembro[idOuMencao] -> "true"/"false", ainda está no servidor
registrar('existeMembro', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const membro = await buscarMembro(ctx, alvo);
  return String(membro !== null);
});

// #estaBanido[idOuMencao] -> "true"/"false"
registrar('estaBanido', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  try {
    await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/bans/${alvo}`);
    return 'true';
  } catch {
    return 'false';
  }
});

// #motivoDoBan[idOuMencao] -> motivo registrado quando foi banido, vazio se não achar
registrar('motivoDoBan', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  try {
    const banimento = await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/bans/${alvo}`);
    return banimento.reason ?? '';
  } catch {
    return '';
  }
});

// #temCargo[idOuMencao;idCargo] -> "true"/"false"
registrar('temCargo', async (args, ctx) => {
  const alvo = args[0];
  const idCargo = args[1];
  if (!alvo || !idCargo) return '⚠️ Uso: `#temCargo[idOuMencao;idDoCargo]`';
  const membro = await buscarMembro(ctx, alvo);
  return String(Boolean(membro?.roles?.includes(idCargo)));
});

// #cargosDoMembro[idOuMencao] -> ids separados por vírgula
registrar('cargosDoMembro', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const membro = await buscarMembro(ctx, alvo);
  return membro?.roles?.join(',') ?? '';
});

// #contarCargos[idOuMencao] -> quantidade de cargos do usuário
registrar('contarCargos', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const membro = await buscarMembro(ctx, alvo);
  return String(membro?.roles?.length ?? 0);
});

// #cargoMaisAlto[idOuMencao] -> id do cargo de maior posição na hierarquia
registrar('cargoMaisAlto', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const servidor = servidorCache(ctx);
  const membro = await buscarMembro(ctx, alvo);
  if (!membro || !servidor?.roles) return '';
  const cargos = servidor.roles.filter((c) => membro.roles.includes(c.id));
  if (cargos.length === 0) return servidor.id; // só tem @everyone
  cargos.sort((a, b) => b.position - a.position);
  return cargos[0].id;
});

// #corDestaque[idOuMencao] -> cor (hex) do cargo mais alto que tem cor definida
registrar('corDestaque', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const servidor = servidorCache(ctx);
  const membro = await buscarMembro(ctx, alvo);
  if (!membro || !servidor?.roles) return '#000000';
  const cargos = servidor.roles
    .filter((c) => membro.roles.includes(c.id) && c.color > 0)
    .sort((a, b) => b.position - a.position);
  if (cargos.length === 0) return '#000000';
  return `#${cargos[0].color.toString(16).padStart(6, '0')}`;
});

// #ehAdmin[idOuMencao] -> "true"/"false", tem a permissão ADMINISTRADOR
registrar('ehAdmin', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const servidor = servidorCache(ctx);
  const membro = await buscarMembro(ctx, alvo);
  if (!membro) return 'false';
  const base = calcularPermissoesBase(servidor, membro.roles);
  return String((base & PERMISSOES.ADMINISTRADOR) === PERMISSOES.ADMINISTRADOR);
});

// #temPermissao[idOuMencao;NOME_DA_PERMISSAO] -> "true"/"false"
// Nomes válidos: BANIR_MEMBROS, EXPULSAR_MEMBROS, GERENCIAR_CANAIS, GERENCIAR_SERVIDOR,
// GERENCIAR_CARGOS, GERENCIAR_MENSAGENS, MODERAR_MEMBROS, MENCIONAR_EVERYONE, etc.
registrar('temPermissao', async (args, ctx) => {
  const alvo = args[0];
  const nomePermissao = (args[1] || '').toUpperCase();
  const bit = PERMISSOES[nomePermissao];
  if (!alvo || !bit) return '⚠️ Uso: `#temPermissao[idOuMencao;NOME_DA_PERMISSAO]`';
  const servidor = servidorCache(ctx);
  const membro = await buscarMembro(ctx, alvo);
  if (!membro) return 'false';
  const base = calcularPermissoesBase(servidor, membro.roles);
  return String(temPermissaoBit(base, bit));
});

// #podeGerenciarCargo[idOuMencao;idCargo] -> "true"/"false"
// Checa se a posição do cargo mais alto do usuário está ACIMA do cargo alvo
// (protege contra escalada de privilégio antes de dar/tirar cargo).
registrar('podeGerenciarCargo', async (args, ctx) => {
  const alvo = args[0];
  const idCargo = args[1];
  if (!alvo || !idCargo) return '⚠️ Uso: `#podeGerenciarCargo[idOuMencao;idDoCargo]`';
  const servidor = servidorCache(ctx);
  const membro = await buscarMembro(ctx, alvo);
  const cargoAlvo = servidor?.roles?.find((c) => c.id === idCargo);
  if (!membro || !cargoAlvo) return 'false';
  const base = calcularPermissoesBase(servidor, membro.roles);
  if ((base & PERMISSOES.ADMINISTRADOR) === PERMISSOES.ADMINISTRADOR) return 'true';
  const cargosDoMembro = servidor.roles.filter((c) => membro.roles.includes(c.id));
  const maiorPosicao = cargosDoMembro.reduce((max, c) => Math.max(max, c.position), 0);
  return String(maiorPosicao > cargoAlvo.position);
});

// #estaSilenciado[idOuMencao] -> "true"/"false", timeout ativo agora
registrar('estaSilenciado', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const membro = await buscarMembro(ctx, alvo);
  if (!membro?.communication_disabled_until) return 'false';
  return String(new Date(membro.communication_disabled_until).getTime() > Date.now());
});

// #tempoSilencioRestante[idOuMencao] -> segundos restantes de timeout, "0" se não tem
registrar('tempoSilencioRestante', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const membro = await buscarMembro(ctx, alvo);
  if (!membro?.communication_disabled_until) return '0';
  const restante = new Date(membro.communication_disabled_until).getTime() - Date.now();
  return String(Math.max(0, Math.round(restante / 1000)));
});

// #estaBoostando[idOuMencao] -> "true"/"false"
registrar('estaBoostando', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const membro = await buscarMembro(ctx, alvo);
  return String(Boolean(membro?.premium_since));
});

// #dataEntradaServidor[idOuMencao]
registrar('dataEntradaServidor', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const membro = await buscarMembro(ctx, alvo);
  if (!membro?.joined_at) return '';
  return new Date(membro.joined_at).toLocaleDateString('pt-BR');
});

// #tempoNoServidor[idOuMencao] -> dias desde que entrou
registrar('tempoNoServidor', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const membro = await buscarMembro(ctx, alvo);
  if (!membro?.joined_at) return '0';
  const dias = Math.floor((Date.now() - new Date(membro.joined_at).getTime()) / 86400000);
  return String(dias);
});

// #ehBot[idOuMencao] -> "true"/"false"
registrar('ehBot', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const membro = await buscarMembro(ctx, alvo);
  return String(Boolean(membro?.user?.bot));
});

// #tagUsuario[idOuMencao] -> username atual (não o apelido do servidor)
registrar('tagUsuario', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  const membro = await buscarMembro(ctx, alvo);
  return membro?.user?.username ?? '';
});

// #bannerAutor[idOuMencao] -> URL do banner de perfil (vazio se não tiver)
registrar('bannerAutor', async (args, ctx) => {
  const alvo = resolverAlvo(args, 0, ctx);
  try {
    const usuario = await ctx.cliente.rest.get(`/users/${alvo}`);
    if (!usuario.banner) return '';
    return `https://cdn.discordapp.com/banners/${alvo}/${usuario.banner}.png?size=512`;
  } catch {
    return '';
  }
});

// #dataDoId[idQualquer] -> data de criação de QUALQUER snowflake (usuário, cargo,
// canal, mensagem, servidor...), pra não precisar de uma tag por tipo de ID.
registrar('dataDoId', (args) => {
  const id = args[0];
  if (!id) return '⚠️ Uso: `#dataDoId[id]`';
  try {
    return dataDoSnowflake(id).toLocaleDateString('pt-BR');
  } catch {
    return '⚠️ ID inválido';
  }
});

module.exports = {};
