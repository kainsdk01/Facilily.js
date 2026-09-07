const { Cliente } = require('./src/Cliente');
const { Intencoes, combinar } = require('./src/Intencoes');
const { ClienteRest } = require('./src/ClienteRest');
const { ClienteGateway } = require('./src/ClienteGateway');
const { Mensagem } = require('./src/estruturas/Mensagem');
const { registrar } = require('./src/motor/RegistroFuncoes');

module.exports = {
  Cliente,
  Intencoes,
  combinar,
  ClienteRest,
  ClienteGateway,
  Mensagem,
  registrarFuncao: registrar,
};
