const EstilosCampoTexto = {
  CURTO: 1,
  PARAGRAFO: 2,
};

class CampoTexto {
  constructor() {
    this.dados = { type: 4, style: EstilosCampoTexto.CURTO };
  }

  definirId(id) { this.dados.custom_id = id; return this; }
  definirRotulo(texto) { this.dados.label = texto; return this; }
  definirEstilo(estilo) { this.dados.style = estilo; return this; }
  definirPlaceholder(texto) { this.dados.placeholder = texto; return this; }
  definirValorPadrao(texto) { this.dados.value = texto; return this; }
  definirTamanho(min, max) { this.dados.min_length = min; this.dados.max_length = max; return this; }
  obrigatorio(valor = true) { this.dados.required = valor; return this; }

  construir() { return this.dados; }
}

class Modal {
  constructor() {
    this.dados = { title: '', custom_id: '', components: [] };
  }

  definirId(id) { this.dados.custom_id = id; return this; }
  definirTitulo(texto) { this.dados.title = texto; return this; }

  adicionarCampo(campo) {
    this.dados.components.push({
      type: 1,
      components: [campo.construir ? campo.construir() : campo],
    });
    return this;
  }

  construir() { return this.dados; }
}

module.exports = { Modal, CampoTexto, EstilosCampoTexto };
