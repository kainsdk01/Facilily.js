const { criarArmazenamento } = require('../dados/ArmazenamentoJSON');

const { estado, salvar } = criarArmazenamento('avisos.json', () => ({}));
const dados = estado.dados;

function adicionarAviso(servidorId, usuarioId, motivo) {
  if (!dados[servidorId]) dados[servidorId] = {};
  if (!dados[servidorId][usuarioId]) dados[servidorId][usuarioId] = [];
  dados[servidorId][usuarioId].push({
    motivo: motivo || 'Sem motivo informado',
    data: new Date().toISOString(),
  });
  salvar();
  return dados[servidorId][usuarioId].length;
}

function obterAvisos(servidorId, usuarioId) {
  return dados[servidorId]?.[usuarioId] ?? [];
}

function limparAvisos(servidorId, usuarioId) {
  if (dados[servidorId]) delete dados[servidorId][usuarioId];
  salvar();
}

module.exports = { adicionarAviso, obterAvisos, limparAvisos };
