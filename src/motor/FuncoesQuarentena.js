const { registrar } = require('./RegistroFuncoes');
const { criarArmazenamento } = require('../dados/ArmazenamentoJSON');

const { estado, salvar } = criarArmazenamento('quarentena.json', () => ({ servidores: {} }));

function listaDoServidor(servidorId) {
  if (!estado.dados.servidores[servidorId]) estado.dados.servidores[servidorId] = {};
  return estado.dados.servidores[servidorId];
}

// #colocarQuarentena[usuario;motivo] -> marca o usuário como suspeito nesse servidor
registrar('colocarQuarentena', (args, ctx) => {
  const [usuario, motivo] = args;
  if (!usuario) return '⚠️ Uso: `#colocarQuarentena[usuario;motivo]`';
  listaDoServidor(ctx.mensagem.servidorId)[usuario] = {
    motivo: motivo || 'Sem motivo informado',
    data: new Date().toISOString(),
  };
  salvar();
  return `🔒 <@${usuario}> foi colocado em quarentena.`;
});

// #removerQuarentena[usuario]
registrar('removerQuarentena', (args, ctx) => {
  const usuario = args[0];
  if (!usuario) return '⚠️ Uso: `#removerQuarentena[usuario]`';
  delete listaDoServidor(ctx.mensagem.servidorId)[usuario];
  salvar();
  return `✅ <@${usuario}> saiu da quarentena.`;
});

// #estaQuarentena[usuario] -> "true"/"false"
registrar('estaQuarentena', (args, ctx) => {
  const usuario = args[0];
  return String(Boolean(listaDoServidor(ctx.mensagem.servidorId)[usuario]));
});

// #motivoQuarentena[usuario]
registrar('motivoQuarentena', (args, ctx) => listaDoServidor(ctx.mensagem.servidorId)[args[0]]?.motivo ?? '');

// #totalEmQuarentena[]
registrar('totalEmQuarentena', (_args, ctx) => String(Object.keys(listaDoServidor(ctx.mensagem.servidorId)).length));

module.exports = {};
