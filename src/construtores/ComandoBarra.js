const TiposOpcao = {
  SUBCOMANDO: 1,
  GRUPO_SUBCOMANDOS: 2,
  TEXTO: 3,
  INTEIRO: 4,
  BOOLEANO: 5,
  USUARIO: 6,
  CANAL: 7,
  CARGO: 8,
  MENCIONAVEL: 9,
  NUMERO: 10,
  ANEXO: 11,
};

class ComandoBarra {
  constructor(nome, descricao) {
    this.dados = { name: nome, description: descricao, options: [] };
  }

  adicionarOpcaoTexto(nome, descricao, { obrigatorio = false, escolhas } = {}) {
    this.dados.options.push({
      type: TiposOpcao.TEXTO, name: nome, description: descricao,
      required: obrigatorio, choices: escolhas,
    });
    return this;
  }

  adicionarOpcaoInteiro(nome, descricao, { obrigatorio = false, min, max } = {}) {
    this.dados.options.push({
      type: TiposOpcao.INTEIRO, name: nome, description: descricao,
      required: obrigatorio, min_value: min, max_value: max,
    });
    return this;
  }

  adicionarOpcaoBooleano(nome, descricao, { obrigatorio = false } = {}) {
    this.dados.options.push({ type: TiposOpcao.BOOLEANO, name: nome, description: descricao, required: obrigatorio });
    return this;
  }

  adicionarOpcaoUsuario(nome, descricao, { obrigatorio = false } = {}) {
    this.dados.options.push({ type: TiposOpcao.USUARIO, name: nome, description: descricao, required: obrigatorio });
    return this;
  }

  adicionarOpcaoCanal(nome, descricao, { obrigatorio = false } = {}) {
    this.dados.options.push({ type: TiposOpcao.CANAL, name: nome, description: descricao, required: obrigatorio });
    return this;
  }

  construir() { return this.dados; }
}

module.exports = { ComandoBarra, TiposOpcao };
