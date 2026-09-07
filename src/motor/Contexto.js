class Contexto {
  constructor(cliente, mensagem, argumentos) {
    this.cliente = cliente;
    this.mensagem = mensagem;
    this.argumentos = argumentos; // array de strings, texto após o comando dividido por espaço
    this.embed = {}; // campos do embed sendo construído
    this.componentes = []; // linhas de ação (botões) sendo construídas
  }
}

module.exports = { Contexto };
