/**
 * Erro padrão da biblioteca. Sempre carrega um código estável (pra quem
 * for tratar o evento 'erro' programaticamente) e uma mensagem em português.
 *
 * Uso:
 *   throw new ErroFacility('CONFIG_INTENCAO_DESCONHECIDA', 'Intenção "X" não existe.');
 *   throw new ErroFacility('MOTOR_FUNCAO_FALHOU', '(função: #foo[])', causaOriginal);
 */
class ErroFacility extends Error {
  constructor(codigo, mensagem, causa) {
    super(causa ? `${mensagem} — causa: ${causa.message ?? causa}` : mensagem);
    this.name = 'ErroFacility';
    this.codigo = codigo;
    this.causa = causa;
  }
}

module.exports = { ErroFacility };
