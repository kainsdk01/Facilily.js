const { registrar } = require('./RegistroFuncoes');
const { criarArmazenamento } = require('../dados/ArmazenamentoJSON');

// Blacklist própria do bot: trava o uso de comandos sem precisar banir de
// verdade na Discord (útil pra golpistas/spammers que você quer manter
// "visíveis" no servidor, só sem poder usar o bot).
const { estado, salvar } = criarArmazenamento('bloqueios.json', () => ({ bloqueados: {} }));

// #bloquearUsuario[usuario;motivo]
registrar('bloquearUsuario', (args) => {
  const [usuario, motivo] = args;
  if (!usuario) return '⚠️ Uso: `#bloquearUsuario[usuario;motivo]`';
  estado.dados.bloqueados[usuario] = { motivo: motivo || 'Sem motivo informado', data: new Date().toISOString() };
  salvar();
  return `🚫 <@${usuario}> foi bloqueado de usar o bot.`;
});

// #desbloquearUsuario[usuario]
registrar('desbloquearUsuario', (args) => {
  const usuario = args[0];
  if (!usuario) return '⚠️ Uso: `#desbloquearUsuario[usuario]`';
  delete estado.dados.bloqueados[usuario];
  salvar();
  return `✅ <@${usuario}> foi desbloqueado.`;
});

// #estaBloqueado[usuario] -> "true"/"false"
registrar('estaBloqueado', (args) => String(Boolean(estado.dados.bloqueados[args[0]])));

// #motivoBloqueio[usuario]
registrar('motivoBloqueio', (args) => estado.dados.bloqueados[args[0]]?.motivo ?? '');

module.exports = {};
