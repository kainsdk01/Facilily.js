const EstilosBotao = {
  PRIMARIO: 1,
  SECUNDARIO: 2,
  SUCESSO: 3,
  PERIGO: 4,
  LINK: 5,
};

class Botao {
  constructor() {
    this.dados = { type: 2, style: EstilosBotao.PRIMARIO };
  }

  definirId(id) { this.dados.custom_id = id; return this; }
  definirRotulo(texto) { this.dados.label = texto; return this; }
  definirEstilo(estilo) { this.dados.style = estilo; return this; }
  definirEmoji(emoji) {
    this.dados.emoji = typeof emoji === 'string' ? { name: emoji } : emoji;
    return this;
  }
  definirUrl(url) { this.dados.style = EstilosBotao.LINK; this.dados.url = url; return this; }
  desabilitar(valor = true) { this.dados.disabled = valor; return this; }

  construir() { return this.dados; }
}

module.exports = { Botao, EstilosBotao };
