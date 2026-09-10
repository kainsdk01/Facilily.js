const { registrar } = require('./RegistroFuncoes');
const { criarArmazenamento } = require('../dados/ArmazenamentoJSON');
const { buscarMembro } = require('./AjudantesDiscord');

const { estado, salvar } = criarArmazenamento('permissoesComando.json', () => ({ servidores: {} }));

function regrasDoServidor(servidorId) {
  if (!estado.dados.servidores[servidorId]) estado.dados.servidores[servidorId] = {};
  return estado.dados.servidores[servidorId];
}

// #definirPermissaoComando[nomeComando;idCargo] -> só quem tem esse cargo pode usar o comando
registrar('definirPermissaoComando', (args, ctx) => {
  const [nomeComando, idCargo] = args;
  if (!nomeComando || !idCargo) return '⚠️ Uso: `#definirPermissaoComando[nomeComando;idCargo]`';
  const regras = regrasDoServidor(ctx.mensagem.servidorId);
  if (!regras[nomeComando]) regras[nomeComando] = [];
  if (!regras[nomeComando].includes(idCargo)) regras[nomeComando].push(idCargo);
  salvar();
  return `✅ Comando \`${nomeComando}\` agora exige o cargo <@&${idCargo}>.`;
});

// #removerPermissaoComando[nomeComando;idCargo]
registrar('removerPermissaoComando', (args, ctx) => {
  const [nomeComando, idCargo] = args;
  const regras = regrasDoServidor(ctx.mensagem.servidorId);
  if (regras[nomeComando]) regras[nomeComando] = regras[nomeComando].filter((id) => id !== idCargo);
  salvar();
  return '✅ Restrição removida.';
});

// #listarPermissoesComando[nomeComando] -> ids de cargo separados por vírgula, vazio = liberado geral
registrar('listarPermissoesComando', (args, ctx) => {
  const regras = regrasDoServidor(ctx.mensagem.servidorId);
  return (regras[args[0]] ?? []).join(',');
});

// #usuarioTemPermissaoComando[usuario;nomeComando] -> "true"/"false"
// Se o comando não tem nenhum cargo configurado, qualquer um pode usar (devolve "true").
registrar('usuarioTemPermissaoComando', async (args, ctx) => {
  const [usuario, nomeComando] = args;
  if (!usuario || !nomeComando) return '⚠️ Uso: `#usuarioTemPermissaoComando[usuario;nomeComando]`';
  const regras = regrasDoServidor(ctx.mensagem.servidorId);
  const cargosExigidos = regras[nomeComando];
  if (!cargosExigidos || cargosExigidos.length === 0) return 'true';
  const membro = await buscarMembro(ctx, usuario);
  if (!membro) return 'false';
  return String(cargosExigidos.some((idCargo) => membro.roles.includes(idCargo)));
});

module.exports = {};
