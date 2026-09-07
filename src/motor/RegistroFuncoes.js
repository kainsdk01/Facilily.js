const funcoes = new Map();

function registrar(nome, executar) {
  funcoes.set(nome.toLowerCase(), { nome: nome.toLowerCase(), executar });
}

function obter(nome) {
  return funcoes.get(nome.toLowerCase());
}

module.exports = { registrar, obter, funcoes };
