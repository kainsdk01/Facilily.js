class LinhaAcao {
  constructor() {
    this.componentes = [];
  }

  adicionar(...itens) {
    this.componentes.push(...itens.map((item) => (item.construir ? item.construir() : item)));
    return this;
  }

  construir() {
    return { type: 1, components: this.componentes };
  }
}

module.exports = { LinhaAcao };
