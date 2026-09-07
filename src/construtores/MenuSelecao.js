const TiposMenu = {
  TEXTO: 3,
  USUARIO: 5,
  CANAL: 6,
  CARGO: 7,
  MENCIONAVEL: 8,
};

class MenuSelecao {
  constructor(tipo = TiposMenu.TEXTO) {
    this.dados = { type: tipo, options: [] };
  }

  definirId(id) { this.dados.custom_id = id; return this; }
  definirPlaceholder(texto) { this.dados.placeholder = texto; return this; }
  definirMinMax(min, max) { this.dados.min_values = min; this.dados.max_values = max; return this; }

  adicionarOpcao({ rotulo, valor, descricao, emoji, padrao }) {
    this.dados.options.push({
      label: rotulo,
      value: valor,
      description: descricao,
      emoji: typeof emoji === 'string' ? { name: emoji } : emoji,
      default: padrao,
    });
    return this;
  }

  construir() { return this.dados; }
}

module.exports = { MenuSelecao, TiposMenu };
