class Contexto {
  constructor(cliente, mensagem, argumentos, dadosEvento = null) {
    this.cliente = cliente;
    this.mensagem = mensagem;
    this.argumentos = argumentos; // array de strings, texto após o comando dividido por espaço
    this.embed = {}; // campos do embed sendo construído
    this.componentes = []; // linhas de ação (botões) sendo construídas

    // Dados extras de um evento (ex: cargo criado, canal atualizado, voto de
    // enquete...) que não cabem no formato de "mensagem". Lido pela tag
    // genérica #evento[chave] e por algumas tags de conveniência.
    // Continua null pra comandos normais e pros eventos antigos (pronto,
    // mensagemCriada, erro, depuracao).
    this.dadosEvento = dadosEvento;
  }
}

module.exports = { Contexto };
